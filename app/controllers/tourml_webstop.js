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

	$.handleData(MODEL.getImageTourml(CONFIG.id));

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
		$.text.value = "ceci est un web stop"; //_data.description;
		subdata = _data.subdata;
		image_file = _data.image;
	} else {
		$.Title.text = "Problem";
		$.text.value = "Impossible to fetch content for this stop. Please contact contact@tourguide.io."
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop._data.image | " + JSON.stringify(image_file));

	if(image_file) {
		var width = APP.Device.width - 60;

		var image_view = Ti.UI.createImageView({
			image: image_file,
			width: width + "dp",
			height: Ti.UI.SIZE,
			preventDefaultImage: true
		});

		$.image.add(image_view);
	} else {
		$.content.remove($.image)
	}

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				APP.removeAllChildren();
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

			APP.addChild("tourml_map2", {
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

// Kick off the init
$.init();