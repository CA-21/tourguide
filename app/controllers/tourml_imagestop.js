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
		$.title.text = _data.title;
		$.footer_label.text = "Ceci est un image stop."; //_data.description;
		subdata = _data.subdata;
		image_file = _data.image;
	} else {
		$.title.text = "Problem";
		$.footer_label.text = "Impossible to fetch content for this stop. Please contact contact@tourguide.io."
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop._data.image | " + JSON.stringify(image_file));

	if(!image_file) {
		image_file = "/images/fond-no-image.png";
	}
	$.artwork.image = image_file;

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

$.artwork.addEventListener("pinch", function(_event) {
	var t = Ti.UI.create2DMatrix().scale(_event.scale);
	$.artwork.transform = t;
});

// Kick off the init
$.init();