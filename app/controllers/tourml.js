var APP = require("core");
var UTIL = require("utilities");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0];
var ACTION = {};
var SELECTED;

var offset = 0;
var refreshLoading = false;
var refreshEngaged = false;

$.init = function() {
	APP.log("debug", "tourml.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(CONFIG.isChild === true) {
		// if the window is a child, show a back button in navigation
		$.NavigationBar.showBack();
		$.handleData(MODEL.getAllStopsWithCode());
	} else {
		// if no parent window, the data are not available : initialize first & show the menu/settings
		$.retrieveData();
		if(APP.Settings.useSlideMenu) {
			$.NavigationBar.showMenu();
		} else {
			$.NavigationBar.showSettings();
		}
	}
};

$.retrieveData = function(_force, _callback) {
	APP.openLoading();

	MODEL.fetch({
		url: CONFIG.feed,
		cache: _force ? 0 : CONFIG.cache,
		defaultLanguage: CONFIG.defaultLanguage,
		callback: function() {
			$.handleData(MODEL.getAllStopsWithCode());

			if(typeof _callback !== "undefined") {
				_callback();
			}
		},
		error: function() {
			alert("Unable to connect. Please try again later.");

			APP.closeLoading();

			if(OS_IOS) {
				pullToRefresh.hide();
			}
		}
	});
};

$.handleData = function(_data) {
	APP.log("debug", "tourml.handleData");

	var rows = [];

	$.handleNavigation();

	for(var i = 0, x = _data.length; i < x; i++) {
		if(_data[i].description.length > 40) {
			var _description = _data[i].description.substring(0, 40) + "...";
		} else {
			var _description = _data[i].description;
		}
		var row = Alloy.createController("tourml_row", {
			id: _data[i].id,
			code: _data[i].code,
			heading: _data[i].title,
			subHeading: _description,
			tourmltype: _data[i].tourmltype
		}).getView();

		rows.push(row);
	}

	$.container.setData(rows);

	APP.closeLoading();

	if(APP.Device.isTablet && !SELECTED) {
		SELECTED = _data[0].id;

		APP.addChild("tourml_stop", {
			id: _data[0].id,
			index: CONFIG.index
		});
	}
};

$.container.addEventListener("click", function(_event) {
	APP.log("debug", "tourml @click " + _event.row.id);

	if(APP.Device.isTablet) {
		if(_event.row.id == SELECTED) {
			return;
		} else {
			SELECTED = _event.row.id;
		}
	}

	APP.log("debug", "_event.row.tourmltype " + JSON.stringify(_event.row.tourmltype));

	// Define which controller is called with the click
	switch(_event.row.tourmltype) {
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

	APP.addChild(controller, {
		id: _event.row.id,
		index: CONFIG.index,
		map: CONFIG.map,
		keypad: CONFIG.keypad,
		qrcode: CONFIG.qrcode,
		qrcode_prefix: CONFIG.qrcode_prefix
	});
});

$.handleNavigation = function(_id) {

	ACTION.list = null;

	if(CONFIG.map) {
		ACTION.map = function(_event) {
			APP.log("debug", "tourml @map");
			APP.addChild("tourml_map", {
				index: CONFIG.index,
				isChild: true
			});
		};
	} else {
		ACTION.map = null;
	}

	if(CONFIG.qrcode) {
		ACTION.keypad = function(_event) {
			APP.log("debug", "tourml @keypad");
			APP.addChild("tourml_keypad", {
				index: CONFIG.index
			});
		};
	} else {
		ACTION.keypad = null;
	}

	if(CONFIG.qrcode) {
		ACTION.qrcode = function(_event) {
			APP.log("debug", "tourml @qr");
			APP.addChild("tourml_qr", {
				index: CONFIG.index,
				isChild: true,
				qrcode: CONFIG.qrcode,
				qrcode_prefix: CONFIG.qrcode_prefix
			});
		};
	} else {
		ACTION.qrcode = null;
	}

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {
		navmap: ACTION.map,
		navqr: ACTION.qrcode,
		navkeypad: ACTION.keypad
	}).getView();

	$.NavigationBar.addNavigation(navigation);
};

if(OS_IOS) {
	var pullToRefresh = Alloy.createWidget("nl.fokkezb.pullToRefresh", null, {
		table: $.container,
		backgroundColor: "#EEE",
		fontColor: "#AAA",
		indicator: "dark",
		image: "/images/ptrArrow.png",
		refresh: function(_callback) {
			$.retrieveData(true, function() {
				_callback(true);
			});
		}
	});

	if(CONFIG.feed) {
		pullToRefresh.date(DATE(parseInt(UTIL.lastUpdate(CONFIG.feed), 10)).toDate());
	}
}

// Kick off the init
$.init();