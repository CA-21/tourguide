var APP = require("core");
var MODEL = require("models/tourml")();
var UTIL = require("utilities");

var CONFIG = arguments[0] || {};
var ACTION = {};
var KEYPAD = {};

var MapModule = require('ti.map');

var win = Ti.UI.createWindow({
	backgroundColor: 'white'
});
var mapview = MapModule.createView({
	mapType: MapModule.NORMAL_TYPE,
	region: {
		latitude: -33.87365,
		longitude: 151.20689,
		latitudeDelta: 0.1,
		longitudeDelta: 0.1
	}
});

if(OS_ANDROID) mapview.mapType = MapModule.HYBRID_TYPE;

$.init = function() {
	APP.log("debug", "map.init | " + JSON.stringify(CONFIG));

	var rc = MapModule.isGooglePlayServicesAvailable()
	switch(rc) {
		case MapModule.SUCCESS:
			Ti.API.info('Google Play services is installed.');
			break;
		case MapModule.SERVICE_MISSING:
			alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
			break;
		case MapModule.SERVICE_VERSION_UPDATE_REQUIRED:
			alert('Google Play services is out of date. Please update Google Play services.');
			break;
		case MapModule.SERVICE_DISABLED:
			alert('Google Play services is disabled. Please enable Google Play services.');
			break;
		case MapModule.SERVICE_INVALID:
			alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
			break;
		default:
			alert('Unknown error.');
			break;
	}

	MODEL.init(CONFIG.index);

	var annotations = [];

	$.handleData(MODEL.getGeoStops());

	//$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	/*if(CONFIG.isChild === true) {
		$.NavigationBar.showBack();
	}*/
	var view = Titanium.UI.createView({
		backgroundColor: 'red',
		width: "100%",
		height: "20dp"
	});

	view.setBackgroundColor(APP.Settings.colors.primary);
	win.add(view);
	win.add(mapview);
	win.open();
};

$.handleData = function(_data) {
	APP.log("debug", "tourml_map.handleData | " + JSON.stringify(_data));

	var annotations = [];

	for(var i = 0, x = _data.length; i < x; i++) {
		if(_data[i].geo) {
			//title, tourmltype, code, geo
			var geo = _data[i].geo.replace("\{'type':'Point','coordinates':", "").replace("}", "");
			var geo_parsed = JSON.parse(geo);

			var vlatitude = geo_parsed[1];
			var vlongitude = geo_parsed[0];

			if(i == 0) {
				mapview.region = {
					latitude: vlatitude,
					longitude: vlongitude,
					latitudeDelta: 0.013,
					longitudeDelta: 0.013
				}
			}
			var annotation = MapModule.createAnnotation({
				latitude: vlatitude,
				longitude: vlongitude,
				pincolor: MapModule.ANNOTATION_RED,
				rightView: Ti.UI.createButton({
					title: '>'
				}),
				leftButton: 'SydneyHarbourBridge.jpg',
				title: _data[i].title
			});

			// Add this annotation after creation
			mapview.addAnnotation(annotation);

		}
	}

	//$.content.setAnnotations(annotations);

	/*$.content.setRegion({
		latitude: latitude_region,
		longitude: longitude_region,
		latitudeDelta: 0.013,
		longitudeDelta: 0.013
	});

	$.content.selectAnnotation(annotations[0]);

	// Under Android, HYBRID_TYPE does not display satellite + roads, but only roads
	// Bug already filed at https://jira.appcelerator.org/browse/TIMOB-9673
	if(Ti.Platform.osname == "android") $.content.mapType = Titanium.Map.SATELLITE_TYPE;
*/
}
// Kick off the init
$.init();