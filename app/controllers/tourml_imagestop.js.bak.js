var APP = require("core");
var SOCIAL = require("social");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};

var titouchgallery = require('com.gbaldera.titouchgallery');

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
		$.footer_label.text = "tap to zoom";
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
	var imageURL = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, image_file).nativePath;

	var win = Ti.UI.createWindow({
		backgroundColor: '#000000'
	});
	/*var wintactile = Ti.UI.createWindow({
		backgroundColor: 'transparent'
	});*/
	var view = Ti.UI.createView({});
	var imageview = Ti.UI.createImageView({
		image: imageURL,
		width: "100%"
	});
	var closebutton = Ti.UI.createImageView({
		image: "/icons/videos5.png",
		top: "4dp",
		right: "4dp"
	});
	imageview.addEventListener('pinch', function(e) {
		var t = Ti.UI.create2DMatrix().scale(e.scale);
		imageview.transform = t;
	});

	var olt = Titanium.UI.create2DMatrix(),
		curX, curY;
	/*
	wintactile.addEventListener('touchstart', function(e) {
		APP.log("debug", "tourml_imagestop.imageview.touchstart " + JSON.stringify(e.x) + " " + JSON.stringify(e.y));
		APP.log("debug", "top : " + JSON.stringify(imageview.top) + " | left : " + JSON.stringify(imageview.left));
		APP.log("debug", "bottom : " + JSON.stringify(imageview.bottom) + " | right : " + JSON.stringify(imageview.right));
		APP.log("debug", "height : " + JSON.stringify(imageview.bottom - imageview.top) + " | width : " + JSON.stringify(imageview.right - imageview.left));
	});
	wintactile.addEventListener('touchmove', function(e) {
		//APP.log("debug", "tourml_imagestop.imageview.touchmove " + JSON.stringify(win) + " " + JSON.stringify(e.x) + " " + JSON.stringify(imageview.center));
		var deltaX = e.x - curX,
			deltaY = e.y - curY;
		//olt = olt.translate(deltaX, deltaY, 0);
		//imageview.animate({transform: olt,duration: 100});
		APP.log("debug", "x : " + Math.floor(e.x) + " | y : " + Math.floor(e.y));
		APP.log("debug", "top : " + JSON.stringify(imageview.top) + " | left : " + JSON.stringify(imageview.left));
		imageview.setTop(Math.floor(e.y));
		imageview.setLeft(Math.floor(e.x));
	});
*/
	closebutton.addEventListener('click', function(e) {
		win.close();
	});

	view.add(closebutton);
	view.add(imageview);
	win.add(view);
	win.open();
	//wintactile.open();

	//$.artwork.image = imageURL;
	imageview.addEventListener('pinch', function(e) {
		var t = Ti.UI.create2DMatrix().scale(e.scale);
		$.artwork.transform = t;
	});

	win.addEventListener('android:back', function(e) {
		APP.log("debug", "back pressed : win " + JSON.stringify(win));
		win.close();
	});

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

	/*
	if(OS_ANDROID) {

		$.artwork.addEventListener("singletap", function(e) {
			$.titouchgallery(image_file);
		});

	}
	*/
};

$.titouchgallery = function(image_file) {
	var win = Ti.UI.createWindow({
		backgroundColor: '#000'
	});

	var titouchgallery = require('com.gbaldera.titouchgallery');

	var proxy = titouchgallery.createTouchGallery({
		images: [image_file]
	});
	proxy.addEventListener("scroll", function(e) {
		Ti.API.debug("Scroll event fired: " + JSON.stringify(e));
	});
	proxy.addEventListener("singletap", function(e) {
		alert("Page: " + e.currentPage);
		Ti.API.debug("SingleTap event fired: " + JSON.stringify(e));
	});
	proxy.addEventListener("longpress", function(e) {
		win.close();
	});

	win.add(proxy);
	win.open();
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

// Kick off the init

$.init();

/*
if(OS_ANDROID) {
	var win = Ti.UI.createWindow({
		backgroundColor: '#000'
	});

	var titouchgallery = require('com.gbaldera.titouchgallery');

	var proxy = titouchgallery.createTouchGallery({
		images: [
					"http://cs407831.userapi.com/v407831207/18f6/jBaVZFDhXRA.jpg",
					"http://cs407831.userapi.com/v407831207/1906/oxoP6URjFtA.jpg",
					"http://cs407831.userapi.com/v407831207/190e/2Sz9A774hUc.jpg",
					"http://cs407831.userapi.com/v407831207/1916/Ua52RjnKqjk.jpg",
					"http://cs407831.userapi.com/v407831207/191e/QEQE83Ok0lQ.jpg"
				]
	});
	proxy.addEventListener("scroll", function(e) {
		Ti.API.debug("Scroll event fired: " + JSON.stringify(e));
	});
	proxy.addEventListener("singletap", function(e) {
		alert("Page: " + e.currentPage);
		Ti.API.debug("SingleTap event fired: " + JSON.stringify(e));
	});
	proxy.addEventListener("longpress", function(e) {
		alert("Page: " + e.currentPage);
		Ti.API.debug("LongPress event fired: " + JSON.stringify(e));
	});

	win.add(proxy);
	win.open();
}
*/