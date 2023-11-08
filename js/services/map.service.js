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

async function initMap(lat = 32.0749831, lng = 34.9120554) {
    console.log('InitMap')
    try {
        await _connectGoogleApi()
        console.log('initMap() google available')
        gMap = new google.maps.Map(
            document.querySelector('#map'), {
            center: { lat, lng },
            zoom: 15
        })
        console.log('initMap() gMap =', gMap)
    }
    catch(err) {
        new Error(`initMap() Error ${err}`)
    }
}

function getMap() {
    return gMap;
}

function panTo(lat, lng) {
    var laLatLng = new google.maps.LatLng(lat, lng)
    gMap.panTo(laLatLng)
}

async function _connectGoogleApi() {
    if (window.google) return;

    const API_KEY = 'AIzaSyCvYLSwwat03jpxCajsKKqPBiJC77HsApE';
    const elGoogleApi = document.createElement('script');
    elGoogleApi.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    elGoogleApi.async = true;
    elGoogleApi.defer = true;

    document.body.append(elGoogleApi);

    await new Promise((resolve, reject) => {
        elGoogleApi.onload = resolve;
        elGoogleApi.onerror = () => reject('Google script failed to load');
    });
}

// == Marker ========================

async function addMarker(loc) {
    
    var marker = new google.maps.Marker({
        position: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        map: gMap,
        title: loc.address
    })

    await _saveToStorage({
        position: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        title: loc.address
    });

    return marker
}

async function getAllMarkers() {
    try {
        const result = await storageService.query(MARKERS_STORAGE_DB);
        const markers = Array.from(result);
        markers.forEach((m) => {
            new google.maps.Marker({
                position: { lat: m.position.lat, lng: m.position.lng },
                map: gMap,
                title: m.title
            })
        })
    }
    catch(err) {
        new Error(`getAllMarkers() error: ${err}`);
    }
    

}

// == Storage =======================

async function _saveToStorage(marker) {
    
    const filter = (m) => {
        return m.position.lat === marker.position.lat && m.position.lng === marker.position.lng;
    };
    
    var markers = await storageService.filter(MARKERS_STORAGE_DB, filter)
    if (markers.length == 0) {
        marker.createdAt =  marker.updatedAt = Date.now();

        try {
            var newMarker = await storageService.post(MARKERS_STORAGE_DB, marker)
            return newMarker;
        }
        catch(error) {
            new Error(`_saveToStorage() Error: ${error}`)
        }
    }
    else {
        let existMarker = markers[0];
        existMarker.title = marker.title;
        existMarker.updatedAt = Date.now();
        
        try {
            var updatedMarker = await storageService.put(MARKERS_STORAGE_DB, existMarker)
            return updatedMarker;
        }
        catch(error) {
            new Error(`_saveToStorage() Error: ${error}`)
        } 
    }  
}

