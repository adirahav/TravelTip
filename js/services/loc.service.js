import { storageService } from './storage.service.js'

const LOCATIONS_CACHE_TIME = 60 * 1000 // 1 minute
const LOCATIONS_STORAGE_DB = "locations"

export const locService = {
    getLocs,
    sortLocs,
    groupLocs,
    LOCATIONS_CACHE_TIME,
    LOCATIONS_STORAGE_DB
}

function getLocs(pageNumber, itemsPerPage, onSuccess) {
    // load from storage
    return new Promise((resolve, reject) => {    
        storageService.paging(LOCATIONS_STORAGE_DB, pageNumber, itemsPerPage)
        .then(locations => {
            resolve(onSuccess(locations)); 
        })
        .catch(error => {
            reject(error);
        });
    });
}

function sortLocs(order, pagination, onSuccess) {
    return new Promise((resolve, reject) => {    
        storageService.sort(LOCATIONS_STORAGE_DB, order, pagination)
        .then(locations => {
            resolve(onSuccess(locations)); 
        })
        .catch(error => {
            reject(error);
        });
    });
}

function groupLocs(fieldName, onSuccess) {
    return new Promise((resolve, reject) => {    
        storageService.group(LOCATIONS_STORAGE_DB, fieldName)
        .then(locations => {
            resolve(onSuccess(locations)); 
        })
        .catch(error => {
            reject(error);
        });
    });
}

