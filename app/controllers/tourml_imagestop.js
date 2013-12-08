var APP = require("core");
var SOCIAL = require("social");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};

var descriptionHeight = 0;
var descriptionVisible = true;

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
		$.description.text = _data.description ? _data.description : "";
		//subdata = _data.subdata;
		image_file = "/" + _data.image;
		//$.description.text += image_file;
	} else {
		$.title.text = "Problem";
		$.description.text = "Impossible to fetch content for this stop. Please contact contact@tourguide.io.";
	}

	if(!$.description.text) $.description.hide();

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	if(!image_file) {
		image_file = "/images/fond-no-image.png";
	}
	APP.log("debug", "tourml_stop.image_file | " + JSON.stringify(image_file));

	//image_file = "/images/fond-no-image.png";
	//var imageURL = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, image_file).nativePath;

	if(image_file.substring(0, 1) == '/') {
		image_file = image_file.substring(1);
	}

	var html = "<html><head><meta name='viewport' content='initial-scale=1, minimum-scale=0.3, maximum-scale=3.0, user-scalable=yes' />";
	html += "";
	html += "</head>";
	html += "<style type='text/css'>body, html {margin:0;padding:0;background:black;height:100%;} img {margin: auto 0 auto 0;width: 100%;} </style>";
	html += "<body onload='init();'><table style='height:100%;width:100%;'><tr><td style='vertical-align:middle;text-align:center;'><img id='image' src='" + image_file + "'/></td></tr></table></body>";
	html += "</html>";

	APP.log("debug", "tourml_imagestop.handleData html | " + html);

	$.imageWebview.setHtml(html);

	APP.log("debug", "tourml_stop.image_file inside webview | " + JSON.stringify($.imageWebview.image_file));

	//$.artwork.setEnableZoomControls(true);
	$.imageWebview.setScalesPageToFit(true);

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

// Event listeners
var postLayoutCallback = function(_event) {
	descriptionHeight = $.description.rect.height;
	APP.log("debug", "tourml_stop.description.rect | " + JSON.stringify($.description.rect));
	Ti.App.fireEvent('app:fromTitanium', {
		sourceimage: $.imageWebview.image_file
	});
	$.description.removeEventListener('postlayout', postLayoutCallback);
	// When layout is ok, send img src
};
$.description.addEventListener('postlayout', postLayoutCallback);

$.meta.addEventListener("singletap", function(_event) {
	if($.description.text) {
		if(descriptionVisible) {
			descriptionVisible = false;
			$.description.animate({
				duration: 500,
				height: 0
			});
		} else {
			descriptionVisible = true;
			$.description.animate({
				duration: 500,
				height: descriptionHeight
			});
		}
	}
});

// Kick off the init
$.init();