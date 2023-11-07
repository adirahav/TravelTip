import { storageService } from './storage.service.js'

const MARKERS_STORAGE_DB = "markers"

export const mapService = {
    initMap,
    getMap,
    addMarker,
    getAllMarkers,
    panTo
}

// == Map ===========================

var gMap

function initMap(lat = 32.0749831, lng = 34.9120554) {
    console.log('InitMap')
    return _connectGoogleApi()
        .then(() => {
            console.log('google available')
            gMap = new google.maps.Map(
                document.querySelector('#map'), {
                center: { lat, lng },
                zoom: 15
            })
            console.log('Map!', gMap)
        })
}

function getMap() {
    return gMap;
}

function panTo(lat, lng) {
    var laLatLng = new google.maps.LatLng(lat, lng)
    gMap.panTo(laLatLng)
}

function _connectGoogleApi() {
    if (window.google) return Promise.resolve()
    const API_KEY = 'AIzaSyCvYLSwwat03jpxCajsKKqPBiJC77HsApE' 
    var elGoogleApi = document.createElement('script')
    elGoogleApi.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`
    elGoogleApi.async = true
    elGoogleApi.defer = true
    document.body.append(elGoogleApi)

    return new Promise((resolve, reject) => {
        elGoogleApi.onload = resolve
        elGoogleApi.onerror = () => reject('Google script failed to load')
    })
}

// == Marker ========================

function addMarker(loc) {
    var marker = new google.maps.Marker({
        position: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        map: gMap,
        title: loc.address
    })

    _saveToStorage({
        position: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        title: loc.address
    });

    return marker
}

function getAllMarkers() {
    var markers = storageService.query() || []

    storageService.query(MARKERS_STORAGE_DB)
            .then(markers => {
                markers.map((m) => {
                    var marker = new google.maps.Marker({
                        position: { lat: m.position.lat, lng: m.position.lng },
                        map: gMap,
                        title: m.title
                    })

                })
            });

}

// == Storage =======================

function _saveToStorage(marker) {
    
    const filter = (m) => {
        return m.position.lat === marker.position.lat && m.position.lng === marker.position.lng;
    };
    
    return new Promise((resolve, reject) => {    
        storageService.filter(MARKERS_STORAGE_DB, filter)
            .then(markers => {
                if (markers.length == 0) {
                    marker.createdAt =  marker.updatedAt = Date.now();
                        storageService.post(MARKERS_STORAGE_DB, marker)
                            .then(newMarker => {
                                resolve(newMarker);
                            })
                            .catch(error => {
                                reject(error);
                            }); 
                }
                else {
                    let desireMarker = markers[0];
                        desireMarker.title = marker.title;
                        desireMarker.updatedAt = Date.now();
                        storageService.put(MARKERS_STORAGE_DB, desireMarker)
                            .then(updatedMarker => {
                                resolve(updatedMarker);
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

