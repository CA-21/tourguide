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
		image_file = "/" + _data.image;
	} else {
		$.title.text = "Problem";
		$.footer_label.text = "Impossible to fetch content for this stop. Please contact contact@tourguide.io."
	}

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop.image_file | " + JSON.stringify(image_file));

	if(!image_file) {
		image_file = "/images/fond-no-image.png";
	}
	//image_file = "/images/fond-no-image.png";
	//var imageURL = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, image_file).nativePath;

	$.artwork.image = image_file;
	$.artwork.setEnableZoomControls(true);

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

	/*var webview = Titanium.UI.createWebView();
	var window = Titanium.UI.createWindow();
	webview.setHtml("<html><body>
		<div><canvas id='mycanvas' style='width: 100%; height: 100%'></canvas></div>
		<script src='lib/img-touch-canvas/img-touch-canvas.js'></script>
		<script>
			var gesturableImg = new ImgTouchCanvas({
				canvas: document.getElementById('mycanvas'),
				path: '" + image_file + "'
			});
		</script>
		</body></html>");
	window.add(webview);
	window.open({
		modal: true
	});*/

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