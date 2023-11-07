import { mapService } from './services/map.service.js'
import { locService } from './services/loc.service.js'
import { placeService } from './services/place.service.js'
import { utilitiesService } from './services/utilities.service.js'

window.onload = onInit
window.onAddMarker = onAddMarker
window.onClickLink = onClickLink
window.onPanTo = onPanTo
window.onGetUserPos = onGetUserPos
window.onDeletePlace = onDeletePlace
window.onSearchPlace = onSearchPlace
window.renderPlace = renderPlace
window.onSortLocs = onSortLocs
window.onGroupLocs = onGroupLocs
window.onToggleLocsMenu = onToggleLocsMenu

const LOCS_PAGING_SIZE = 10

// == On Init =======================

function onInit() {
    // load map
    $("#map").height($("#map").width());

    mapService.initMap()
        .then(() => {
            // default place    //http://localhost:3000/index.html?lat=3.14&lng=1.63
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('lat') && urlParams.has('lng')) {
                var coords = {
                    lat: parseFloat(urlParams.get('lat')), 
                    lng: parseFloat(urlParams.get('lng'))
                }
                placeService.pickPlace(coords, renderSearchPlace);
            }   
            else {
                $(".current-location").html("<h2>Location:</h2><span>Location not set yet</span>");

                // locations table
                onGetLocs()
            } 

            // saved markers
            mapService.getAllMarkers()
            
            // click event listener to the map
            mapService.getMap().addListener('click', (event) => {
                const coords = {
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                };

                _onPickPlace(coords);
            });
        })
        .catch(() => console.log('Error: cannot init map'))
}

// == My Location ===================
function onGetUserPos() {
    placeService.getUserPosition(renderPlace);
}

function renderPlace(place) {
    let htmlContent;

    if (place.weather != null) {
        htmlContent = `
            <div><img src="${place.weather.image}" /></div>
            <div>
                <span>${place.address}</span>
                <img id="weatherCountryFlag" src="${place.weather.countryFlag}" />
                <span id="weatherDesc">${place.weather.description}</span>
            </div>
            <div id="weatherTemperature">
                <span id="weatherCurrentTemperature">
                    ${utilitiesService.stringFormat(
                        "%s℃", 
                        Math.round(place.weather.temperature.celsius)
                    )}</span>
                <span id="weatherRangeTemperature">${
                    utilitiesService.stringFormat(
                        "temperature from %s to %s ℃ wind %s m/s", 
                        Math.round(place.weather.temperature.range.from), 
                        Math.round(place.weather.temperature.range.to),
                        place.weather.temperature.wind
                    )}</span>
            </div>`;
            onPanTo(place)
            
    }
    else {
        htmlContent = `Weather not available`;

        $(".current-location").html("<h2>Location:</h2><span>Location not found</span>");
    }

    $("#weatherContent").html(htmlContent);
    onGetLocs()
}

// == Locations =====================

var gLocsCurrentPageNumber = 1

function onGetLocs() {
    locService.getLocs(gLocsCurrentPageNumber, LOCS_PAGING_SIZE, renderLocations)
}

function renderLocations(result) {
    let htmlList;
    let places = result.pagedEntities;

    if (places && places.length > 0) {
        htmlList = `<table cellspacing="0" cellpedding="0" border="0">`
        htmlList += `
                <tr>
                    <th class="address" colspan="2">Address <i class="fa-solid fa-caret-down fa-xl" onClick="onToggleLocsMenu(this, 'address', '')"></i></th>
                    <th class="weather" colspan="3">Weather <i class="fa-solid fa-caret-down fa-xl" onClick="onToggleLocsMenu(this, 'weather.temperature.celsius', 'weather.description')"></i></th>
                    <th class="actions">Actions</th>
                </tr>`

        htmlList += `
                <ul class="menu" style="display:none">
                    <li onclick="onSortLocs(this, 'asc')"><i class="fa-solid fa-arrow-up-a-z"></i>Sort Down</li>
                    <li onclick="onSortLocs(this, 'desc')"><i class="fa-solid fa-arrow-up-z-a"></i>Sort Up</li>
                    <li onclick="onGroupLocs(this)"><i class="fa-regular fa-object-group fa-xl"></i>Group</li>
                </ul>`

        htmlList += places.map((place) => `
                <tr>
                    <td class="country-flag"><img src="${place.weather.countryFlag}"></td>
                    <td class="address">${place.address}</td>
                    <td class="weather-description">${place.weather.description}</td>
                    <td class="weather-celsius"> ${utilitiesService.stringFormat(
                        "%s℃", 
                        Math.round(place.weather.temperature.celsius)
                    )}</td>
                    <td class="weather-image"><img src="${place.weather.image}"></td>
                    <td class="actions">
                        <i class="fa-solid fa-location-dot" onclick='renderPlace(${JSON.stringify(place)})'></i>
                        <i class="fa-solid fa-trash" onclick="onDeletePlace('${place.uuid}')"></i>
                    </td>
                </tr>`
        ).join('')

        
        htmlList += '</table>'

    }
    else {
        htmlList = `<h1>No locations were found</h1>`
    }
   
    $("#locationsContent").html(htmlList)

    buildLocationPaging(result.totalEntities);
}

// -- menu ------------
var gSelectedLocsMenuSortBy = ''
var gSelectedLocsMenuGroupBy = ''
function onToggleLocsMenu(elMenuToggleIcon, sortBy, groupBy) {
    if (sortBy != gSelectedLocsMenuSortBy || $(".locations-table .menu").is(":hidden")) {
        const position = $(elMenuToggleIcon).position();
        const menuLeft = position.left + $(elMenuToggleIcon).width();
        const menuTop = position.top + $(elMenuToggleIcon).height();

        if (sortBy == "address") {
            $(".locations-table .menu li:eq(2)").addClass('disabled');
        }
        else {
            $(".locations-table .menu li:eq(2)").removeClass('disabled');
        }

        $(".locations-table .menu").css({
            left: menuLeft,
            top: menuTop,
        }).show();
    }
    else {
        $(".locations-table .menu").hide()
    }

    gSelectedLocsMenuSortBy = sortBy;
    gSelectedLocsMenuGroupBy = groupBy;
}

// -- paging ----------

function buildLocationPaging(totalEntities) {
    
    const totalPages = Math.ceil(totalEntities / LOCS_PAGING_SIZE);

    if (totalPages > 1) {
        
        $('#locationsPaging').empty();

        for (let i = 1; i <= totalPages; i++) {
            const button = $('<button></button>');
            button.text(i);

            if (i !== gLocsCurrentPageNumber) {
                button.on('click', function() {
                    gLocsCurrentPageNumber = i;
                    locService.getLocs(i, LOCS_PAGING_SIZE, renderLocations);
                });
            } 
            else {
                button.prop('disabled', true);
            }
            
            $("#locationsPaging").append(button)

        }

        $("#locationsPaging").show()
    }
    else {
        $("#locationsPaging").hide()
    }
    
}

// -- sorting ---------
function onSortLocs(elLi, direction) {
    gLocsCurrentPageNumber = 1;
    locService.sortLocs(
        { fieldName: gSelectedLocsMenuSortBy, direction: direction }, 
        { pageNumber: gLocsCurrentPageNumber , itemsPerPage: LOCS_PAGING_SIZE }, 
        renderLocations
    )
}

// -- grouping ---------
function onGroupLocs(elLi) {
    if ($(elLi).hasClass("disabled")) {
        return
    }

    gLocsCurrentPageNumber = 1;
    locService.groupLocs(
        gSelectedLocsMenuGroupBy, 
        renderGroupLocations
    )
}

function renderGroupLocations(result) {
    let htmlList;
    
    if (result && Object.keys(result).length > 0) {
        htmlList = `<table cellspacing="0" cellpedding="0" border="0" class="grouping">`

        htmlList += `
                <tr>
                    <th class="address" colspan="2">Address <i class="fa-solid fa-caret-down fa-xl" onClick="onToggleLocsMenu(this, 'address', '')"></i></th>
                    <th class="weather" colspan="2">Weather <i class="fa-solid fa-caret-down fa-xl" onClick="onToggleLocsMenu(this, 'weather.temperature.celsius', 'weather.description')"></i></th>
                    <th class="actions">Actions</th>
                </tr>`

        htmlList += `
                <ul class="menu" style="display:none">
                    <li onclick="onSortLocs(this, 'asc')"><i class="fa-solid fa-arrow-up-a-z"></i>Sort Down</li>
                    <li onclick="onSortLocs(this, 'desc')"><i class="fa-solid fa-arrow-up-z-a"></i>Sort Up</li>
                    <li onclick="onGroupLocs(this)"><i class="fa-regular fa-object-group fa-xl"></i>Group</li>
                </ul>`

        

        for (const weather in result) {
            htmlList += `<tr><td class="group-header" colspan="5">${weather}</td></tr>`

            htmlList += result[weather].map((place) => `
                <tr>
                    <td class="country-flag"><img src="${place.weather.countryFlag}"></td>
                    <td class="address">${place.address}</td>
                    <td class="weather-celsius"> ${utilitiesService.stringFormat(
                        "%s℃", 
                        Math.round(place.weather.temperature.celsius)
                    )}</td>
                    <td class="weather-image"><img src="${place.weather.image}"></td>
                    <td class="actions">
                        <i class="fa-solid fa-location-dot" onclick='renderPlace(${JSON.stringify(place)})'></i>
                        <i class="fa-solid fa-trash" onclick="onDeletePlace('${place.uuid}')"></i>
                    </td>
                </tr>`
            ).join('')
        }

        htmlList += '</table>'
    }
    else {
        htmlList = `<h1>No locations were found</h1>`
    }
   
    $("#locationsContent").html(htmlList)

    $("#locationsPaging").hide()
}

// == Delete Place ==================

function onDeletePlace(uuid) {
    placeService.deletePlace(uuid, renderDeletePlace)
}

function renderDeletePlace() {
    if (gSelectedLocsMenuGroupBy != "") {
        gLocsCurrentPageNumber = 1;
        locService.groupLocs(
            gSelectedLocsMenuGroupBy, 
            renderGroupLocations
        )
    }
    else {
        onGetLocs()
    }
}

// == Pan Map =======================

function onPanTo(place) {
    $(".current-location").html(`<h2>Location:</h2><span>${place.address}</span><button onclick="onClickLink(${place.coords.latitude}, ${place.coords.longitude})">Copy Location</button>`);
    mapService.panTo(place.coords.latitude, place.coords.longitude);
}


// == Search Place ==================

function onSearchPlace(ev) {
    ev.preventDefault()
    const address = $('input[name="search"]').val();
    if (address != "") {
        placeService.searchPlace(address, renderSearchPlace);
    }
}

function renderSearchPlace(place) {
    if (place != null) {
        if (place.types != undefined && place.types.includes("plus_code") == true) {
            $(".current-location").html("<h2>Location:</h2><span>Location not found</span>");
        }
        else {
            $(".current-location").html(`<h2>Location:</h2><span>${place.name}</span><button onclick="onClickLink(${place.coords.latitude}, ${place.coords.longitude})">Copy Location</button>`);
        }
        renderPlace(place)
    }
    else {
        onGetLocs()
    }
}

// == Pick Place ====================

function _onPickPlace(coords) {
    placeService.pickPlace(coords, renderPickPlace);
}

function renderPickPlace(place) {
    if (place != null) {
        renderSearchPlace(place)
        onAddMarker(place)
    }
}

// == Add Marker ====================

function onAddMarker(place) {
    mapService.addMarker(place)
}


function onClickLink(lat, lng) {
    const appUrl = 'https://github.io/me/travelTip/index.html';

    const link = `${appUrl}?lat=${lat}&lng=${lng}`;
    
    // Create a temporary input element to copy the link to the clipboard
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = link;
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    console.log(link)

}