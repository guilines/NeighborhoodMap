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
        {title: 'Plaza de España', position: {lat: 40.423309, lng: -3.712211}},
        {title: 'Plaza de Colón', position: {lat: 40.424905, lng: -3.689134}},
        {title: 'Parque de El Retiro', position: {lat: 40.415404, lng: -3.684504}}
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

};

/* === ViewModel ===*/

var ViewModel = function() {
    var self = this;

    var map = new Map();

    this.markers = ko.observableArray();

    data.locations.forEach(function (loc,idx) {
        self.markers.push(new Marker(loc,idx));
    });
    // this.mapOptions = ko.observableArray();

    this.filterOptions = function () {
        alert('Filter this');
    }

};

/* === Current Locations===*/
var Marker = function (loc,idx) {
    var self = this;
    this.title = ko.observable(loc.title);
    this.position = ko.observable(loc.position);
    this.display=ko.observable(true);

    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21,34));
        return markerImage;
    }

    this.highlightedIcon = makeMarkerIcon('FFFF24');
    this.defaultIcon = makeMarkerIcon('FF6146');

    var marker = new google.maps.Marker({
        position: loc.position,
        title: loc.title,
        animation: google.maps.Animation.DROP,
        icon: self.defaultIcon,
        id: idx
    });
    marker.setMap(map);

    marker.addListener('mouseover', function() {
        this.setIcon(self.highlightedIcon);
    });
    marker.addListener('mouseout', function() {
        this.setIcon(self.defaultIcon);
    });

    this.highlightMarker = function () {
        marker.setIcon(self.highlightedIcon);
    };

    this.defaultMarker = function () {
        marker.setIcon(self.defaultIcon);
    };

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
