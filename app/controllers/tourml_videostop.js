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

	$.handleData(MODEL.getVideoTourml(CONFIG.id));

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
	var video_file = null;

	if(_data) {
		$.title.text = _data.title;
		$.footer_label.text = _data.description;
		subdata = _data.subdata;
		video_file = "/" + _data.video;
	} else {
		$.title.text = "Problem";
		$.footer_label.text = "Impossible to fetch content for this stop. Please contact contact@tourguide.io.";
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop._data.video | " + JSON.stringify(video_file));

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

	$.image.addEventListener('click', function(e) {
		$.launchVideoPlayer(video_file);
	});

	if(video_file) {
		$.launchVideoPlayer(video_file);
	}

};

$.handleNavigation = function(_id) {

	ACTION.list = function(_event) {
		APP.log("debug", "tourml @list");
		STREAM.stop();
		STREAM.release();
		APP.addChild("tourml", {
			index: CONFIG.index,
			isChild: true
		});
	};

	if(CONFIG.map) {
		ACTION.map = function(_event) {
			APP.log("debug", "tourml @map");
			STREAM.stop();
			STREAM.release();
			APP.addChild("tourml_map", {
				index: CONFIG.index,
				isChild: true
			});
		};
	} else {
		ACTION.map = null;
	}

	if(CONFIG.keypad) {
		ACTION.keypad = function(_event) {
			APP.log("debug", "tourml @keypad");
			STREAM.stop();
			STREAM.release();
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
			STREAM.stop();
			STREAM.release();
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
		navlist: ACTION.list,
		navmap: ACTION.map,
		navqr: ACTION.qrcode,
		navkeypad: ACTION.keypad
	}).getView();

	$.NavigationBar.addNavigation(navigation);
};

$.launchVideoPlayer = function(_video) {
	var videoPlayer = Titanium.Media.createVideoPlayer({
		//top: "20dp",
		autoplay: true,
		backgroundColor: 'black',
		mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT,
		fullscreen: true
	});

	videoPlayer.url = _video;

	videoPlayer.addEventListener('fullscreen', function(e) {
		if(e.entering === false) {
			// left fullscreen AKA done may have been pressed.  
			videoPlayer.stop();
			videoPlayer.release();
			//APP.removeAllChildren();
		}
	});

	videoPlayer.addEventListener('android:back', function(e) {
		APP.log("debug", "back pressed : win " + JSON.stringify(win));
		videoPlayer.stop();
		videoPlayer.release();
		//APP.removeAllChildren();
	});
};

// Kick off the init
$.init();