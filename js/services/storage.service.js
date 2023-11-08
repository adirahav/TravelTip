export const storageService = {
    post,       // Create
    get,        // Read
    put,        // Update
    remove,     // Delete
    query,      // List
    paging,
    sort,
    group,
    filter
}

// == Create ================================
async function post(entityType, newEntity) {
    newEntity = JSON.parse(JSON.stringify(newEntity))
    newEntity.uuid = _generateUUID()
    
    var entities = await query(entityType);
    entities.push(newEntity);

    _save(entityType, entities);

    return newEntity;
}

// == Read ==================================
async function get(entityType, entityUUID) {
    var entities = await query(entityType);
    const entity = entities.find(entity => entity.uuid === entityUUID);
    if (!entity) throw new Error(`Get failed, cannot find entity with uuid: ${entityUUID} in: ${entityType}`)
    return entity
}

// == Update ================================
async function put(entityType, updatedEntity) {
    updatedEntity = JSON.parse(JSON.stringify(updatedEntity))
    
    var entities = await query(entityType);
    const uuidx = entities.findIndex(entity => entity.uuid === updatedEntity.uuid);
    if (uuidx < 0) throw new Error(`Update failed, cannot find entity with id: ${entityUUID} in: ${entityType}`);
    entities.splice(uuidx, 1, updatedEntity);
    _save(entityType, entities);
    return updatedEntity;  
}

// == Delete ================================
async function remove(entityType, entityUUID) {
    var entities = await query(entityType);
    const uuidx = entities.findIndex(entity => entity.uuid === entityUUID)
    if (uuidx < 0) throw new Error(`Remove failed, cannot find entity with uuid: ${entityUUID} in: ${entityType}`)
    entities.splice(uuidx, 1)
    _save(entityType, entities)
    return entities
}

// == List ==================================
async function query(entityType, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const entities = JSON.parse(localStorage.getItem(entityType)) || [];
            resolve(entities);
        }, delay);
    });
}

// == Paging ================================
async function paging(entityType, page, itemsPerPage) {
    try {
        var entities = await query(entityType);

        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pagedEntities = entities.slice(startIndex, endIndex);
        
        const result = {
            pagedEntities,
            totalEntities: entities.length
        };
        return result;
        
    }
    catch(err) {
        throw new Error(err);
    }
    
}

// == Sort ==================================
async function sort(entityType, order, pagination) {
    var entities = await query(entityType);
    
    entities.sort((a, b) => {
        if (order.direction === 'asc') {
            return eval("a." + order.fieldName) < eval("b." + order.fieldName) ? -1 : 1;
        } 
        else if (order.direction === 'desc') {
            return eval("a." + order.fieldName) > eval("b." + order.fieldName) ? -1 : 1;
        }
    });

    _save(entityType, entities);
    
    return paging(entityType, pagination.pageNumber, pagination.itemsPerPage); 
}

// == Group =================================
async function group(entityType, fieldName) {
    var entities = await query(entityType)
    
    const groupedEntities = entities.reduce((result, entity) => {
        const key = eval("entity." + fieldName);
        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(entity);
        return result;
    }, {});

    return groupedEntities;
}

// == Filter ================================
async function filter(entityType, filterFunction) {
    var entities = await query(entityType);
    const filteredEntities = entities.filter(filterFunction);
    return filteredEntities;
}

// == Private Functions =====================
function _save(entityType, entities) {
    localStorage.setItem(entityType, JSON.stringify(entities))
}

function _generateUUID() {
    const cryptoObj = window.crypto || window.msCrypto; // Check for crypto API availability

    if (cryptoObj && cryptoObj.getRandomValues) {
        const buffer = new Uint16Array(8);
        cryptoObj.getRandomValues(buffer);

        buffer[3] = (buffer[3] & 0x0fff) | 0x4000;
        buffer[4] = (buffer[4] & 0x3fff) | 0x8000;

        return Array.from(buffer)
            .map(num => num.toString(16).padStart(4, '0'))
            .join('-');
    } else {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}