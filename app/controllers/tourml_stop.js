var APP = require("core");
var SOCIAL = require("social");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};

$.init = function() {
	APP.log("debug", "tourml_stop.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	$.handleData(MODEL.getTourml(CONFIG.id));

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack();
	}

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_stop.handleData");

	$.handleNavigation();
	APP.log("debug", "tourml_stop._data | " + JSON.stringify(_data));

	var subdata = null;
	var image_file = null;

	if(_data) {
		$.Title.text = _data.title;
		$.text.value = _data.description + "\n";
		subdata = _data.subdata;
		image_file = _data.image;
	} else {
		$.Title.text = "Problem";
		$.text.value = "Impossible to fetch content for this stop. Please contact contact@tourguide.io."
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	var rows = [];
	if(subdata) {
		for(var i = 0, x = subdata.length; i < x; i++) {
			var row = Alloy.createController("tourml_row", {
				id: subdata[i].id,
				heading: subdata[i].title,
				tourmltype: subdata[i].tourmltype
			}).getView();

			rows.push(row);
		}
		$.container.setData(rows);
	} else {
		$.content.remove($.container);
	}

	APP.log("debug", "tourml_stop._data.image | " + JSON.stringify(image_file));

	if(image_file) {
		var image_width = APP.Device.width;
		APP.log("debug", "tourml_stop APP.Device.width | " + image_width);
		Ti.API.info(Ti.Platform.displayCaps.platformWidth);
		Ti.API.info(Ti.Platform.displayCaps.platformHeight);
		Ti.API.info(Ti.Platform.displayCaps.density);
		Ti.API.info(Ti.Platform.displayCaps.logicalDensityFactor);

		if(Ti.Platform.osname === 'android') {
			image_width = image_width * Ti.Platform.displayCaps.logicalDensityFactor;
		}

		$.imageContainer.backgroundImage = "/" + image_file;
	} else {
		$.content.remove($.image)
	}

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				//APP.removeAllChildren();
			}
		});
	}

	$.NavigationBar.showAction({
		callback: function(_event) {
			SOCIAL.share(ACTION.url, $.NavigationBar.right);
		}
	});
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

$.container.addEventListener("click", function(_event) {
	APP.log("debug", "tourml @click " + JSON.stringify(_event.row));

	if(APP.Device.isTablet) {
		if(_event.row.id == SELECTED) {
			return;
		} else {
			SELECTED = _event.row.id;
		}
	}

	var controller = "tourml_stop";

	switch(_event.row.tourmltype) {
		case "audio_stop":
			var controller = "tourml_audiostop";
			break;
		case "image_stop":
			controller = "tourml_imagestop";
			break;
		default:
			break;
	}

	APP.addChild(controller, {
		id: _event.row.id,
		index: CONFIG.index
	});
});

// Kick off the init
$.init();