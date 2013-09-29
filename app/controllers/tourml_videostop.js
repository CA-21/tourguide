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

	//$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		//$.NavigationBar.showBack();
	}

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_stop.handleData");

	//$.handleNavigation();
	APP.log("debug", "tourml_stop._data | " + JSON.stringify(_data));

	/*	var subdata = null;
	var video_file = null;

	if(_data) {
		$.Title.text = _data.title;
		$.text.value = "ceci est un video stop"; //_data.description;
		subdata = _data.subdata;
		video_file = _data.video;
	} else {
		$.Title.text = "Problem";
		$.text.value = "Impossible to fetch content for this stop. Please contact contact@tourguide.io."
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop._data.video | " + JSON.stringify(video_file));
*/
	//$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	/*
	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				$.videoPlayer.stop();
				$.videoPlayer.release();
				APP.removeAllChildren();
			}
		});
	}
	*/
	$.NavigationBar.showAction({
		callback: function(_event) {
			SOCIAL.share(ACTION.url, $.NavigationBar.right);
		}
	});

	// Change to a valid URL
	var contentURL = "/video.mp4";

	//$.videoPlayer.url = contentURL;
	//$.videoPlayer.mediaControlStyle = Titanium.Media.VIDEO_CONTROL_DEFAULT;

};

$.handleNavigation = function(_id) {

	ACTION.map = null;
	ACTION.list = null;
	ACTION.keypad = null;

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {
		navmap: function(_event) {
			STREAM.stop();
			STREAM.release();
			APP.log("debug", "tourml @map");

			APP.addChild("tourml_map2", {
				index: CONFIG.index,
				isChild: true
			});
		},
		navkeypad: function(_event) {
			STREAM.stop();
			STREAM.release();
			APP.log("debug", "tourml @keypad");

			APP.addChild("tourml_keypad", {
				index: CONFIG.index,
				isChild: true
			});
		},
	}).getView();

	//$.NavigationBar.addNavigation(navigation);
};

// Kick off the init
//$.init();

//WORKING
var vidWin = Titanium.UI.createWindow({
	title: 'Video',
	backgroundColor: '#fff'
});

var videoPlayer = Titanium.Media.createVideoPlayer({
	//top: "20dp",
	autoplay: true,
	backgroundColor: 'black',
	//bottom: "100dp",
	//width: Ti.UI.FILL,
	mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT,
	//scalingMode: Titanium.Media.VIDEO_SCALING_ASPECT_FIT,
	fullscreen: true
});

videoPlayer.url = '/video.mp4';

videoPlayer.addEventListener('fullscreen', function(e) {
	if(e.entering === false) {
		// left fullscreen AKA done may have been pressed.  
		videoPlayer.stop();
		videoPlayer.release();
		APP.removeAllChildren();
		vidWin.close();
	}
});

videoPlayer.addEventListener('android:back', function(e) {
	// left fullscreen AKA done may have been pressed.  
	videoPlayer.stop();
	videoPlayer.release();
	APP.removeAllChildren();
	vidWin.close();
});

vidWin.add(videoPlayer);
vidWin.open();