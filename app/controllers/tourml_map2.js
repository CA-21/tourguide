var APP = require("core");
var MODEL = require("models/tourml")();
var UTIL = require("utilities");

var CONFIG = arguments[0] || {};
var ACTION = {};
var KEYPAD = {};

$.init = function() {
	APP.log("debug", "map.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	var annotations = [];

	$.handleData(MODEL.getGeoStops());

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(CONFIG.isChild === true) {
		$.NavigationBar.showBack();
	}

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_audiostop.handleData | " + JSON.stringify(_data));

	var points = JSON.parse("[ { \"latitude\": \"28.24560022171899\", \"longitude\": \"-80.72571516036987\", \"pinColor\": \"Ti.Map.ANNOTATION_RED\", \"title\": \"Place A\", \"subTitle\": \"This is a subtitle\" }, { \"latitude\": \"28.24704626421908\", \"longitude\": \"-80.73882579803467\", \"pinColor\": \"Ti.Map.ANNOTATION_RED\", \"title\": \"Place B\", \"subTitle\": \"\" }, { \"latitude\": \"28.228406881099808\", \"longitude\": \"-80.73399782180786\", \"pinColor\": \"Ti.Map.ANNOTATION_RED\", \"title\": \"Place C\", \"subTitle\": \"This is a subtitle\" } ]");

	var annotations = [];

	for(var i = 0, x = _data.length; i < x; i++) {
		if(_data[i].geo) {
			//title, tourmltype, code, geo
			var geo = _data[i].geo.replace("\{'type':'Point','coordinates':", "").replace("}", "");
			var geo_parsed = JSON.parse(geo);

			var vlatitude = geo_parsed[1];
			var vlongitude = geo_parsed[0];

			if(i == 0) {
				var latitude_region = vlatitude;
				var longitude_region = vlongitude;
			}
			var annotation = Ti.Map.createAnnotation({
				latitude: vlatitude,
				longitude: vlongitude,
				title: _data[i].title,
				subtitle: "",
				pincolor: Titanium.Map.ANNOTATION_RED
			});

			annotations.push(annotation);
		}
	}

	$.content.setAnnotations(annotations);

	$.content.setRegion({
		latitude: latitude_region,
		longitude: longitude_region,
		latitudeDelta: 0.013,
		longitudeDelta: 0.013
	});

	$.content.selectAnnotation(annotations[0]);

	// Under Android, HYBRID_TYPE does not display satellite + roads, but only roads
	// Bug already filed at https://jira.appcelerator.org/browse/TIMOB-9673
	if(Ti.Platform.osname == "android") $.content.mapType = Titanium.Map.SATELLITE_TYPE;

}

// Kick off the init
$.init();