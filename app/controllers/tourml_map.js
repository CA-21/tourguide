var APP = require("core");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};
var KEYPAD = {};

$.init = function() {
	APP.log("debug", "tourml_map.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	//$.handleData(MODEL.getAudioTourml(CONFIG.id));

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(CONFIG.isChild === true) {
		$.NavigationBar.showBack();
	}

	//$.handleNavigation();

};

$.handleNavigation = function(_id) {

	ACTION.map = null;
	ACTION.list = null;
	ACTION.keypad = null;

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {}).getView();

	$.NavigationBar.addNavigation(navigation);
};

// Kick off the init
$.init();