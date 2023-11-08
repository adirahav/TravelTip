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

async function getLocs(pageNumber, itemsPerPage, onSuccess) {
    try {
        var locations = await storageService.paging(LOCATIONS_STORAGE_DB, pageNumber, itemsPerPage);
        onSuccess(locations);
    }
    catch(err) {
        console.log(`getLocs() Error: ${err}`);
    } 
}

async function sortLocs(order, pagination, onSuccess) {
    try {
        var locations = await storageService.sort(LOCATIONS_STORAGE_DB, order, pagination);
        onSuccess(locations);
    }
    catch(err) {
        console.log(`sortLocs() Error: ${err}`);
    } 
}

async function groupLocs(fieldName, onSuccess) {
    try {
        var locations = await storageService.group(LOCATIONS_STORAGE_DB, fieldName);
        onSuccess(locations);
    }
    catch(err) {
        reject(new Error(`groupLocs() Error: ${err}`));
    } 
}

