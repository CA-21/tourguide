var APP = require("core");
var UTIL = require("utilities");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};
var SELECTED;

var win = Titanium.UI.createWindow();

var mapview = Alloy.Globals.Map.createView({
	mapType: Alloy.Globals.Map.HYBRID_TYPE,
	/*region: {
		longitude: 2.36,
		latitude: 49.67,
		latitudeDelta: 0.01,
		longitudeDelta: 0.01
	},*/
	animate: true,
	regionFit: true,
	userLocation: true,
	top: "50dp",
	height: Ti.UI.FILL,
	width: Ti.UI.FILL
});

var median = function(values) {
	values.sort(function(a, b) {
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if(values.length % 2) return values[half];
	else return(values[half - 1] + values[half]) / 2.0;
};

$.init = function() {
	APP.log("debug", "tourml_map.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	//$.handleData(MODEL.getAudioTourml(CONFIG.id));

	//$.Wrapper.setBackgroundColor(APP.Settings.colors.primary || "#000");

	var rc = Alloy.Globals.Map.isGooglePlayServicesAvailable();
	switch(rc) {
		case Alloy.Globals.Map.SUCCESS:
			Ti.API.info('Google Play services is installed.');
			break;
		case Alloy.Globals.Map.SERVICE_MISSING:
			alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
			break;
		case Alloy.Globals.Map.SERVICE_VERSION_UPDATE_REQUIRED:
			alert('Google Play services is out of date. Please update Google Play services.');
			break;
		case Alloy.Globals.Map.SERVICE_DISABLED:
			alert('Google Play services is disabled. Please enable Google Play services.');
			break;
		case Alloy.Globals.Map.SERVICE_INVALID:
			alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
			break;
		default:
			alert('Unknown error.');
			break;
	}

	$.handleData(MODEL.getGeoStops());

	win.add(mapview);

	WrapperView = Titanium.UI.createView({
		top: "0",
		height: "50dp",
		width: Ti.UI.FILL
	});
	WrapperView.setBackgroundColor(APP.Settings.colors.primary || "#000");

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {}).getView();

	var backView = Titanium.UI.createView({
		id: "back",
		top: "0dp",
		left: "0dp",
		width: "48dp",
		height: "47dp"
	});
	var backButton = Titanium.UI.createImageView({
		id: "backImage",
		image: '/images/back.png',
		top: "9dp",
		left: "9dp",
		width: "28dp",
		height: "28dp",
		preventDefaultImage: true
	});
	backView.add(backButton);
	WrapperView.add(backView);

	WrapperView.add(navigation);

	win.add(WrapperView);

	backView.addEventListener('click', function(evt) {
		Ti.API.info("tourml_map : Back clicked");
		APP.removeChild();
		win.close();
	});

	win.open();

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_map.handleData");

	//$.handleNavigation();

	var longitudes = [];
	var latitudes = [];

	for(var i = 0, x = _data.length; i < x; i++) {
		APP.log("debug", "tourml_map.handleData | Data for " + x + " | " + JSON.stringify(_data[i]));
		if(_data[i].description) {
			if(_data[i].description.length > 40) {
				var _description = _data[i].description.substring(0, 40) + "...";
			} else {
				var _description = _data[i].description;
			}
		} else {
			var _description = "";
		}
		// replacing single quotes with double quotes to allow JSON Parsing of geo tourml data
		var geo_array = JSON.parse(_data[i].geo.replace(/'/g, '"'));
		APP.log("debug", "tourml_map.handleData | Coordinates for " + i + " | " + JSON.stringify(geo_array.coordinates[0]));
		/* Available variables :
				title: data.fieldByName("title"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("tourmlcode"),
				geo: data.fieldByName("tourmlgeo")
		*/
		longitudes[i] = geo_array.coordinates[0];
		latitudes[i] = geo_array.coordinates[1];

		mapview.addAnnotation(
		Alloy.Globals.Map.createAnnotation({
			longitude: geo_array.coordinates[0],
			latitude: geo_array.coordinates[1],
			title: _data[i].title,
			//subtitle: _data[i].code,
			pincolor: Alloy.Globals.Map.ANNOTATION_RED,
			rightView: Ti.UI.createButton({
				title: '>'
			}),
			tourmltype: _data[i].tourmltype,
			myid: _data[i].id // Custom property to uniquely identify this annotation.
		}));
	}

	mapview.region = {
		longitude: median(longitudes),
		latitude: median(latitudes),
		latitudeDelta: 1.3 * (Math.max.apply(null, latitudes) - Math.min.apply(null, latitudes)),
		longitudeDelta: 1.3 * (Math.max.apply(null, longitudes) - Math.min.apply(null, longitudes))
	};

	//APP.closeLoading();
	/*
	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				win.close();
				//APP.removeAllChildren();
			}
		});
	}

	$.NavigationBar.showAction({
		callback: function(_event) {
			SOCIAL.share(ACTION.url, $.NavigationBar.right);
		}
	});
	*/
};

$.handleNavigation = function(_id) {

	ACTION.map = null;
	ACTION.list = null;
	ACTION.keypad = null;

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {
		navmap: function(_event) {
			APP.log("debug", "tourml @map");

			APP.addChild("tourml_map", {
				index: CONFIG.index,
				isChild: true
			});
		},
		navkeypad: function(_event) {
			APP.log("debug", "tourml @keypad");

			APP.addChild("tourml_keypad", {
				index: CONFIG.index,
				isChild: true
			});
		},
	}).getView();

	$.NavigationBar.addNavigation(navigation);
};

// Handle click events on any annotations on this map.
mapview.addEventListener('click', function(evt) {
	Ti.API.info("Annotation clicksource " + evt.clicksource);

	if(evt.clicksource === "rightPane") {
		Ti.API.info("Annotation " + evt.title + " clicked, id: " + evt.annotation.myid + " | " + JSON.stringify(evt.annotation));
		// Define which controller is called a click

		switch(evt.annotation.tourmltype) {
			case "audio_stop":
				var controller = "tourml_audiostop";
				break;
			case "image_stop":
				var controller = "tourml_imagestop";
				break;
			case "video_stop":
				var controller = "tourml_videostop";
				break;
			default:
				var controller = "tourml_stop";
				break;
		}
		win.close();
		APP.removeChild();
		APP.addChild(controller, {
			id: evt.annotation.myid,
			index: CONFIG.index
		});

	}

});

// Kick off the init
$.init();