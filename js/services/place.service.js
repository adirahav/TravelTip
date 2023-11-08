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

async function getUserPosition(onSuccess) {
    try {
        var position = await _getCurrentPosition();

        // load from storage
        var placesFromCache = await _loadFromStorage(position);
        
        if (placesFromCache) {
            if (Date.now() - placesFromCache.updatedAt < locService.LOCATIONS_CACHE_TIME) {
                onSuccess(placesFromCache); 
            }
        }    
        
        // load from server
        var result = await _getAddressFromCoords(position);
        result = await _getWeatherFromCoords(result);
    
        var place = {
            place_id: null,
            name: "",
            address: result.address,
            coords: {latitude: result.coords.latitude, longitude: result.coords.longitude},
            weather: result.weather
        }
        
        var savedPlace = await _saveToStorage(place)
        onSuccess(savedPlace);
    }
    catch(err) {
        throw new Error("getUserPosition() Error: " + err)
    }
}

async function _getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                resolve(position);
            },
            function(error) {
                reject(new Error(error));
            }
        );
    });
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

async function _getWeatherFromCoords(pos) {
    try {
        var weather = await weatherService.getPlaceWeather(pos)
            
        weather.countryFlag = `https://openweathermap.org/images/flags/${pos.countryCode.toLowerCase()}.png`; 
        weather.image = weatherService.gWeatherOptions.find(option => option.desc.toLowerCase() === weather.description)?.image || null; // not available for free subscription
        pos.weather = weather;
    
        return pos;
    }
    catch(err) {
        throw new Error("getUserPosition() Error: " + err);
    }
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

async function searchPlace(address, onSuccess) {
    try {
        var result = await _searchPlaceFromAddress(address);
        onSuccess(result); 
    }
    catch(err) {
        throw new Error(`_searchPlaceFromAddress() Error: ${err}`);
    }
    
    
}

async function _searchPlaceFromAddress(address) {
    const geocoder = new google.maps.Geocoder();
    const geocodeRequest = {
        address: address,
    };
  
    
    var result = await geocoder.geocode(geocodeRequest);
    var results = result.results;
    const status = results[0] ? google.maps.GeocoderStatus.OK : google.maps.GeocoderStatus.ZERO_RESULTS;

    if (status === google.maps.GeocoderStatus.OK) {
        if (results.length > 0) {
            const location = results[0].geometry.location;
            var place = {
                place_id: results[0].place_id,
                name: address,
                address: results[0].formatted_address,
                coords: { latitude: location.lat(), longitude: location.lng() },
                countryCode: results[0].address_components[results[0].address_components.length - 1].short_name,
                weather: null
            }

            try {
                var result = await _getWeatherFromCoords(place);
                var savedResult = await _saveToStorage(result);
                return savedResult;
            } catch (err) {
                throw new Error(`_searchPlaceFromAddress() Error: ${err}`)
            }
        } else {
            return null
        }
    } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
        return null
    } else {
        throw new Error(`_searchPlaceFromAddress() Error: Geocoding failed due to: ${status}`)
    }
    
}

// == Pick Place ====================

async function pickPlace(coords, onSuccess) {
    try {
        var result = await _searchPlaceFromCoords(coords);
        onSuccess(result); 
    }
    catch(err) {
        throw new Error(`pickPlace() error: ${err}`)
    }   
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

async function deletePlace(uuid, onSuccess) {
    try {
        await storageService.remove(locService.LOCATIONS_STORAGE_DB, uuid)
        onSuccess()
    } catch (err) {
        throw new Error(`deletePlace() Error: ${err}`)
    }  
}

// == Storage =======================

async function _loadFromStorage(place) {
    var places = await storageService.query(locService.LOCATIONS_STORAGE_DB)
   if (places !== null) {
        try {
            var index = places.findIndex(p => p.coords.latitude === place.coords.latitude && p.coords.longitude === place.coords.longitude);
        
            if (index !== -1) {
                // return exist place
                return places[index]; 
            }
            
        }
        catch(err) {
            throw new Error(`_loadFromStorage() error: ${err}`)
        } 
    }

    return null;
}

async function _saveToStorage(place) {
    try {
        const filter = (p) => {
            return p.coords.latitude === place.coords.latitude && p.coords.longitude === place.coords.longitude;
        };

        var places = await storageService.filter(locService.LOCATIONS_STORAGE_DB, filter)
        
        if (places.length == 0) {
            place.createdAt =  place.updatedAt = Date.now();
            
            var newPlace = await storageService.post(locService.LOCATIONS_STORAGE_DB, place)
            return newPlace;
                    
        }
        else {
            let existPlace = places[0];
            existPlace.weather = place.weather;
            existPlace.updatedAt = Date.now();
            var updatedPlace = storageService.put(locService.LOCATIONS_STORAGE_DB, existPlace)
            return updatedPlace;  
        }  
        
    }
    catch(err) {
        throw new Error(`_saveToStorage() error: ${err}`)
    } 
}