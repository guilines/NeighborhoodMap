var google = google || {};
var map;

/* === Model ===*/
var data = {
    map : {
        // currentLocation: 'Madrid, Spain',
        currentLocation: {lat: 40.416932, lng: -3.703797},
        zoom : 15,
        typeControl: false
    },
    locations : [
        {title: 'Plaza del Callao', position: {lat: 40.419856, lng: -3.705831}},
        {title: 'Plaza de España', position: {lat: 40.423309, lng: -3.712211}}
    ]
};

/* === Map ===*/
var Map = function() {
    map = new google.maps.Map($('#map')[0], {
            center: data.map.currentLocation,
            // center: getLocationFromAddress(data.map.currentLocation),
            zoom: data.map.zoom,
            mapTypeControl: data.map.typeControl
            // styles: styles
    });

    data.locations.forEach(function (loc, idx) {
        var marker = new google.maps.Marker({
            position: loc.position,
            title: loc.title,
            animation: google.maps.Animation.DROP,
            id: idx
        });
        marker.setMap(map);
    })
};

/* === ViewModel ===*/

var ViewModel = function() {
    var self = this;

    var map = new Map();

    this.markers = ko.observableArray();

    data.locations.forEach(function (loc,idx) {
        // var span = document.createElement('h6');
        // span.innerHTML = loc.title;
        // document.getElementById('display_locations').appendChild(span);

        // var marker = new google.maps.Marker({
        //     position: loc.position,
        //     title: loc.title,
        //     animation: google.maps.Animation.DROP,
        //     id: idx
        // });
        //
        // marker.setMap(map);
        // self.markers.push(loc);
        self.markers.push(new Marker(loc));
    });
    // this.mapOptions = ko.observableArray();

};

/* === Current Locations===*/
var Marker = function (loc) {
    this.title = ko.observable(loc.title);
    this.position = ko.observable(loc.position);
    this.display=ko.observable(true);
};



//Just used to start the app after the map is loaded. Avoiding
// async errors
var startApp = function () {
    ko.applyBindings(new ViewModel());
};

/* === Common Functions === */
function getLocationFromAddress(addr) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode ({address: addr},function(results,status) {
       if(status == google.maps.GeocoderStatus.OK) {
           console.log('oi?');
           return results[0].geometry.location;
       } else {
           console.log('deu ruim');
       }
    });
    return null;
}
