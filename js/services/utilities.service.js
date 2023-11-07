export const utilitiesService = {
    stringFormat,
    saveToStorage
}

function stringFormat(str) {
    var args = [].slice.call(arguments, 1),
        i = 0;

    return str.replace(/%s/g, () => args[i++]);
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
