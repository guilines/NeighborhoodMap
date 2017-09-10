var google = google || {};
var map;
var infoWindow;



/* === Model ===*/
var data = {
    map : {
        // currentLocation: 'Madrid, Spain',
        currentLocation: {lat: 40.416932, lng: -3.703797},
        zoom : 13,
        typeControl: false
    },
    locations : [
        {title: 'Plaza del Callao', position: {lat: 40.419856, lng: -3.705831}},
        {title: 'Plaza de España', position: {lat: 40.423309, lng: -3.712211}},
        {title: 'Plaza de Colón', position: {lat: 40.424905, lng: -3.689134}},
        {title: 'Parque de El Retiro', position: {lat: 40.415404, lng: -3.684504}},
        {title: 'Puerta de Toledo', position: {lat: 40.406725, lng: -3.711610}}
    ]
};

/* === Map ===*/
var GoogleMap = function() {
    map = new google.maps.Map($('#map')[0], {
            center: data.map.currentLocation,
            // center: getLocationFromAddress(data.map.currentLocation),
            zoom: data.map.zoom,
            mapTypeControl: data.map.typeControl
            // styles: styles
    });

    infoWindow = new google.maps.InfoWindow();
};

/* === ViewModel ===*/

var ViewModel = function() {
    var self = this;

    var googleMap = new GoogleMap();

    this.searchLocation = ko.observable('');

    this.markers = ko.observableArray();
    data.locations.forEach(function (loc,idx) {
        self.markers.push(new Marker(loc,idx));
    });

    this.filteredMarkers = ko.computed(function () {
        var search = self.searchLocation().toLowerCase();
        return ko.utils.arrayFilter(self.markers(), function (marker) {
            var status = marker.title().toLowerCase().indexOf(search) >=0;
            marker.display(status);
            return status;
        });

    });

    this.mapOptions = ko.observableArray();

    this.display_burgerMenu = function () {
        $('.menu-bar').css('width','250px');
    };

    this.close_burgerMenu = function () {
        $('.menu-bar').css('width','0');
    };

};

/* === Current Locations===*/
var Marker = function (loc,idx) {
    var self = this;
    this.title = ko.observable(loc.title);
    this.position = ko.observable(loc.position);
    this.idx=idx;
    // this.address = ko.computed(function () {
    //     getAddressFromLocation(self.position());
    // });
    this.address = '';
    getAddressFromLocation(this);

    this.countCheckin = '';
    getFoursquareInfo(this,loc.position);

    this.photoSrc = ko.observableArray([]);
    getPhotoIdByLocation(this,loc.position);




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

    this.highlightedIcon = makeMarkerIcon('14B467');
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
        $('#marker_'+self.idx).addClass('highlighted-locations');

    });
    marker.addListener('mouseout', function() {
        this.setIcon(self.defaultIcon);
        $('#marker_'+self.idx).removeClass('highlighted-locations');
    });

    marker.addListener('click', function () {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        displayInfo(this,self.address(),self.countCheckin(),self.photoSrc());
    });


    this.highlightMarker = function () {
        marker.setIcon(self.highlightedIcon);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        $('#marker_'+self.idx).addClass('highlighted-locations');
    };

    this.defaultMarker = function () {
        marker.setIcon(self.defaultIcon);
        marker.setAnimation(null);
        $('#marker_'+self.idx).removeClass('highlighted-locations');
    };

    this.displayInfoMarker = function () {
        displayInfo(marker,self.address(),self.countCheckin(),self.photoSrc());
    };

    this.display = ko.computed({
        read: function () {
            {}
        },

        write: function (status) {
            if(!status){
                marker.setVisible(false);
            } else {
                marker.setVisible(true);
            }
        }

    },this);

};

/* === Common Functions === */
function getLocationFromAddress(addr) {
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode ({address: addr},function(results,status) {
       if(status == google.maps.GeocoderStatus.OK) {
           console.log('oi?');
           return results[0].geometry.location;
       } else {
           $('#errorModal').css('display','block');
       }
    });
    return null;
}

function getAddressFromLocation(marker) {
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode ({location: marker.position()},function(results,status) {
        if(status == 'OK') {
            marker.address = ko.observable(results[0].formatted_address);
        } else {
            $('#errorModal').css('display','block');
        }
    });
}

function displayInfo(marker,address,countCheckin,photoSrc) {
    if(infoWindow === undefined) {
        $('#errorModal').css('display','block');
    }
    if (infoWindow.marker != marker) {
        infoWindow.setContent('');
        infoWindow.marker = marker;
        infoWindow.addListener('closeclick', function () {
            infoWindow.marker = null;
        });

        var photos='';
        photoSrc.forEach(function (photo) {
            photos+='<img src="'+ photo +'">';
        });

        infoWindow.setContent('<div>'+
            '<h5>' + address.split(',')[0] + '</h5>'+
            '<h6>Checkins: '+ countCheckin + '</h6>'+
           photos +
        '</div>');
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function () {
            marker.setAnimation(null);
        });
    }
}

var foursquare = {
    apiClient: 'L5MXBKULNXRWBQNJOZYDEAX0503S0YQUSLF2WF5RR5V5J3SB',
    apiSecret: 'XGM1ECMZCFGAUTSKWXT0F31J0AWPIEKE04TRY0CLNSLCME3R',
    apiSearch:'https://api.foursquare.com/v2/venues/search?'
};

function getFoursquareInfo(marker,position) {
    var lat = position.lat;
    var lng = position.lng;
    var url = foursquare.apiSearch;
    url += 'll=' + lat + ',' + lng;
    url += '&v=20170907';
    url += '&client_id=' + foursquare.apiClient;
    url += '&client_secret=' + foursquare.apiSecret;

    $.ajax({
        dataType: "json",
        url: url,
        data: data,
        // success: success
        success: function (data) {
            marker.countCheckin = ko.observable(data.response.venues[0].stats.checkinsCount);
            // console.log(data.response.venues[0].id);
            // getPhotoIdByLocation(marker, data.response.venues[0].id);
        },
        error: function () {
            $('#errorModal').css('display','block');
        }
    });

}

var flickr = {
    apiKey: '5833596b7b6fd16137ef573cf718ac93',
    apiSecret: 'f8bc00f9c0118c28',
    apiUrl: 'https://api.flickr.com/services/rest/?',
    apiLoc: 'method=flickr.photos.search',
    apiPhoto: 'method=flickr.photos.getSizes',
    apiJson: '&format=json&nojsoncallback=1',
    photoSize: 'Large Square'
};

function getPhotoIdByLocation(marker,position) {
    var lat = position.lat;
    var lng = position.lng;

    var url = flickr.apiUrl;
    url+= flickr.apiLoc;
    url+= '&lat=' + lat + '&lon='+ lng;
    url+= '&geo_context=1'; //Get Photos taken inside
    url+= '&api_key='+flickr.apiKey;
    url+= flickr.apiJson;

    $.ajax({
        url: url,
        dataType: "json",
        success: function (data) {
            if(data.stat == 'ok') {
                var ids = [];
                for(var it = 0; it < data.photos.photo.length; ++it) {
                    ids.push(data.photos.photo[it].id);
                    if(it > 2) {
                        break;
                    }
                }
                getPhotoById(marker,ids);
            } else {
                $('#errorModal').css('display','block');
            }
        },
        error: function () {
            $('#errorModal').css('display','block');
        }
    });
}

function getPhotoById(marker,ids) {
    ids.forEach(function (id) {
        var url = flickr.apiUrl;
        //First, Find the ID
        url+= flickr.apiPhoto;
        url+= '&photo_id=' + id;
        url+= '&api_key='+flickr.apiKey;
        url+= flickr.apiJson;

        $.ajax({
            url: url,
            dataType: "json",
            success: function (data) {
                if(data.stat == 'ok') {
                    // getPhotoById(marker,data.photos.photo[0].id)
                    marker.photoSrc.push(data.sizes.size[0].source);
                } else {
                    $('#errorModal').css('display','block');
                }
            },
            error: function () {
                $('#errorModal').css('display','block');
            }
        });
    });
}

//Just used to start the app after the map is loaded. Avoiding
// async errors
var startApp = function () {
    try {
        ko.applyBindings(new ViewModel());
    }
    catch(error){
        console.log(error);
        $('#errorModal').css('display','block');
    }
};

var onError = function () {
    $('#errorModal').css('display','block');
};