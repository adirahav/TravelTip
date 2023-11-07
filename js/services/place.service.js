import { weatherService } from './weather.service.js'
import { locService } from './loc.service.js'
import { storageService } from './storage.service.js'

export const placeService = {
    getUserPosition,
    getPlaces,
    searchPlace,
    pickPlace,
    deletePlace,
}

// == User Position =================

function getUserPosition(onSuccess) {
    
    _getCurrentPosition()
        .then((result) => {
            
            // load from storage
            var placesFromCache = _loadFromStorage(locService.LOCATIONS_STORAGE_DB, result)
            
            if (placesFromCache) {
                if (Date.now() - placesFromCache.updatedAt < locService.LOCATIONS_CACHE_TIME) {
                    return onSuccess(placesFromCache); 
                }
            }    
            
            // load from server
            _getAddressFromCoords(result)
                .then(_getWeatherFromCoords)
                .then((result) => {
                    
                    var place = {
                        place_id: null,
                        name: "",
                        address: result.address,
                        coords: {latitude: result.coords.latitude, longitude: result.coords.longitude},
                        weather: result.weather
                    }

                    _saveToStorage(place).then(onSuccess);
                });
        })
        .catch(err => {
            console.error("_getCurrentPosition Error: " + err);
        })

}

function _getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })
}

function _getAddressFromCoords(pos) {
    return new Promise((resolve, reject) => {
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    
        geocoder.geocode({ 'location': latlng }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    pos.countryCode = results[0].address_components[results[0].address_components.length-1].short_name
                    pos.address = results[0].formatted_address
                    resolve(pos); 
                } 
                else {
                    reject(new Error("No results found"));
                }
            } 
            else {
                reject(new Error(`Geocoder failed due to: ${status}`));
            }
        });
    });
}

function _getWeatherFromCoords(pos) {
    return new Promise((resolve, reject) => {
        weatherService.getPlaceWeather(pos)
            .then((weather) => {
                weather.countryFlag = `https://openweathermap.org/images/flags/${pos.countryCode.toLowerCase()}.png`; 
                weather.image = weatherService.gWeatherOptions.find(option => option.desc.toLowerCase() === weather.description)?.image || null; // not available for free subscription
                pos.weather = weather;
                resolve(pos);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

// == Places List ===================
function getPlaces() {
    var placesFromCache = _loadFromStorage(locService.LOCATIONS_STORAGE_DB) || {}

    if (placesFromCache) {
        if (Date.now() - placesFromCache.savedTime < locService.LOCATIONS_CACHE_TIME) {
            return Promise.resolve(placesFromCache)
        }
    }
}

// == Search Place ==================

function searchPlace(address, onSuccess) {
    // load from server
    return _searchPlaceFromAddress(address)
        .then((result) => {
            onSuccess(result); 
        });
    
}

function _searchPlaceFromAddress(address) {
    const geocoder = new google.maps.Geocoder();
    const geocodeRequest = {
        address: address,
    };
  
    return new Promise((resolve, reject) => {
        geocoder.geocode(geocodeRequest, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results.length > 0) {
                    
                    const location = results[0].geometry.location;
                    var place = {
                        place_id: results[0].place_id,
                        name: address,
                        address: results[0].formatted_address,
                        coords: {latitude: location.lat(), longitude: location.lng()},
                        countryCode: results[0].address_components[results[0].address_components.length-1].short_name,
                        weather: null
                    }
                    _getWeatherFromCoords(place)
                        .then((result) => {
                            _saveToStorage(result).then(result => {
                                resolve(result);
                            });
                        })
                        .catch((error) => {
                            reject(error);
                        });
                } 
                else {
                    reject(new Error('No results found for the given address.'));
                }
            } 
            else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                resolve(null);
            }
            else {
                reject(new Error(`Geocoding failed due to: ${status}`));
            }
        });
    });
}

// == Pick Place ====================

function pickPlace(coords, onSuccess) {
    _searchPlaceFromCoords(coords)
        .then((result) => {
            onSuccess(result); 
        });
    
}

function _searchPlaceFromCoords(coords) {
    const geocoder = new google.maps.Geocoder();
    const reverseGeocodeRequest = {
        location: {
            lat: coords.lat, 
            lng: coords.lng, 
        },
    };
  
    return new Promise((resolve, reject) => {
        geocoder.geocode(reverseGeocodeRequest, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results.length > 0) {
                    const locationData = results[0];

                    var place = {
                        place_id: locationData.place_id,
                        name: "",
                        address: locationData.formatted_address,
                        coords: {latitude: coords.lat, longitude: coords.lng},
                        countryCode: locationData.address_components[locationData.address_components.length-1].short_name,
                        weather: null
                    }
                    
                    if (locationData.types.includes("plus_code") == false) {
                        _getWeatherFromCoords(place)
                        .then((result) => {
                            _saveToStorage(result).then(result => {
                                resolve(result);
                            });
                        })
                        .catch((error) => {
                            reject(error);
                        });
                    }
                    else {
                        resolve(locationData);
                    }
                    
                } 
                else {
                    reject(new Error('No results found for the given address.'));
                }
            } 
            else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
                resolve(null);
            }
            else {
                reject(new Error(`Geocoding failed due to: ${status}`));
            }
        });
    });
}

// == Delete Place ===================

function deletePlace(uuid, onSuccess) {
    storageService.remove(locService.LOCATIONS_STORAGE_DB, uuid)
        .then(() => {
            onSuccess()
        });
}

// == Storage =======================

function _loadFromStorage(key, place) {
    // load from storage
    return new Promise((resolve, reject) => {    
        storageService.query(locService.LOCATIONS_STORAGE_DB)
            .then(places => {
                if (places !== null) {
                    var index = places.findIndex(p => p.coords.latitude === place.coords.latitude && p.coords.longitude === place.coords.longitude);
            
                    if (index !== -1) {
                        // return exist place
                        resolve(places[index]); 
                    }
                } 
                
                resolve(null);
            })
            .catch(error => {
                reject(error);
            });
    });    
}

function _saveToStorage(place) {
    
    const filter = (p) => {
        return p.coords.latitude === place.coords.latitude && p.coords.longitude === place.coords.longitude;
    };
    
    return new Promise((resolve, reject) => {    
        storageService.filter(locService.LOCATIONS_STORAGE_DB, filter)
            .then(places => {
                if (places.length == 0) {
                    place.createdAt =  place.updatedAt = Date.now();
                        storageService.post(locService.LOCATIONS_STORAGE_DB, place)
                            .then(newPlace => {
                                resolve(newPlace);
                            })
                            .catch(error => {
                                reject(error);
                            }); 
                }
                else {
                    let desirePlace = places[0];
                        desirePlace.weather = place.weather;
                        desirePlace.updatedAt = Date.now();
                        storageService.put(locService.LOCATIONS_STORAGE_DB, desirePlace)
                            .then(updatedPlace => {
                                resolve(updatedPlace);
                            })
                            .catch(error => {
                                reject(error);
                            });   
                }
            })
            .catch(error => {
                reject(error);
            });
    });    
}