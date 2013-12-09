var APP = require("core");
var UTIL = require("utilities");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};
var SELECTED;

var win = Titanium.UI.createWindow();

$.init = function() {
	APP.log("debug", "tourml_map.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	//$.handleData(MODEL.getAudioTourml(CONFIG.id));

	//$.Wrapper.setBackgroundColor(APP.Settings.colors.primary || "#000");

	var rc = Alloy.Globals.Map.isGooglePlayServicesAvailable();
	switch(rc) {
		case Alloy.Globals.Map.SUCCESS:
			Ti.API.info('Google Play services is installed.');
			break;
		case Alloy.Globals.Map.SERVICE_MISSING:
			alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
			break;
		case Alloy.Globals.Map.SERVICE_VERSION_UPDATE_REQUIRED:
			alert('Google Play services is out of date. Please update Google Play services.');
			break;
		case Alloy.Globals.Map.SERVICE_DISABLED:
			alert('Google Play services is disabled. Please enable Google Play services.');
			break;
		case Alloy.Globals.Map.SERVICE_INVALID:
			alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
			break;
		default:
			alert('Unknown error.');
			break;
	}

	WrapperView = Titanium.UI.createView({
		top: "0",
		height: "50dp",
		width: Ti.UI.FILL
	});
	WrapperView.setBackgroundColor(APP.Settings.colors.primary || "#000");

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {}).getView();

	var backView = Titanium.UI.createView({
		id: "back",
		top: "0dp",
		left: "0dp",
		width: "48dp",
		height: "47dp"
	});
	var backButton = Titanium.UI.createImageView({
		id: "backImage",
		image: '/images/back.png',
		top: "9dp",
		left: "9dp",
		width: "28dp",
		height: "28dp",
		preventDefaultImage: true
	});
	backView.add(backButton);
	WrapperView.add(backView);

	WrapperView.add(navigation);

	win.add(WrapperView);

	backView.addEventListener('click', function(evt) {
		Ti.API.info("tourml_map : Back clicked");
		APP.removeChild();
		win.close();
	});

	// load the Scandit SDK module
	var scanditsdk = require("com.mirasense.scanditsdk");
	// disable the status bar for the camera view on the iphone and ipad
	if(Ti.Platform.osname == 'iphone' || Ti.Platform.osname == 'ipad') {
		Titanium.UI.iPhone.statusBarHidden = true;
	}
	var picker;
	// Create a window to add the picker to and display it.

	// Instantiate the Scandit SDK Barcode Picker view
	picker = scanditsdk.createView({
		top: "50dp",
		width: Ti.UI.FILL,
		height: Ti.UI.FILL,
		backgroundColor: "black"
	});
	// Initialize the barcode picker, remember to paste your own app key here.
	picker.init("t9eMnmAtEeOAZyupLxTF+nYmE++tv8gErEyXdOoMyRk", 0);
	picker.showSearchBar(true);
	// add a tool bar at the bottom of the scan view with a cancel button (iphone/ipad only)
	picker.showToolBar(true);
	// Set callback functions for when scanning succeedes and for when the
	// scanning is canceled.
	picker.searchBarPlaceholderText = "ici";
	picker.setSuccessCallback(function(e) {
		$.handleScanResult(e);
	});
	picker.setCancelCallback(function(e) {
		closeScanner();
	});
	win.add(picker);
	win.addEventListener('open', function(e) {
		// Adjust to the current orientation.
		// since window.orientation returns 'undefined' on ios devices
		// we are using Ti.UI.orientation (which is deprecated and no longer
		// working on Android devices.)
		if(Ti.Platform.osname == 'iphone' || Ti.Platform.osname == 'ipad') {
			picker.setOrientation(Ti.UI.orientation);
		} else {
			picker.setOrientation(win.orientation);
		}
		picker.setSize(Ti.Platform.displayCaps.platformWidth,
		Ti.Platform.displayCaps.platformHeight);
		picker.startScanning(); // startScanning() has to be called after the window is opened.
	});
	win.open();

	// Stops the scanner, removes it from the window and closes the latter.
	var closeScanner = function() {
		if(picker != null) {
			picker.stopScanning();
			win.remove(picker);
		}
		win.close();
	};

	// Changes the picker dimensions and the video feed orientation when the
	// orientation of the device changes.
	Ti.Gesture.addEventListener('orientationchange', function(e) {
		win.orientationModes = [Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT,
		Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT];
		if(picker != null) {
			picker.setOrientation(e.orientation);
			picker.setSize(Ti.Platform.displayCaps.platformWidth,
			Ti.Platform.displayCaps.platformHeight);
			// You can also adjust the interface here if landscape should look
			// different than portrait.
		}
	});

	win.open();

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_map.handleData");

	//$.handleNavigation();

	var longitudes = [];
	var latitudes = [];

	for(var i = 0, x = _data.length; i < x; i++) {
		APP.log("debug", "tourml_map.handleData | Data for " + x + " | " + JSON.stringify(_data[i]));
		if(_data[i].description) {
			if(_data[i].description.length > 40) {
				var _description = _data[i].description.substring(0, 40) + "...";
			} else {
				var _description = _data[i].description;
			}
		} else {
			var _description = "";
		}
		// replacing single quotes with double quotes to allow JSON Parsing of geo tourml data
		var geo_array = JSON.parse(_data[i].geo.replace(/'/g, '"'));
		APP.log("debug", "tourml_map.handleData | Coordinates for " + i + " | " + JSON.stringify(geo_array.coordinates[0]));
		/* Available variables :
				title: data.fieldByName("title"),
				tourmltype: data.fieldByName("tourmltype"),
				code: data.fieldByName("tourmlcode"),
				geo: data.fieldByName("tourmlgeo")
		*/
		longitudes[i] = geo_array.coordinates[0];
		latitudes[i] = geo_array.coordinates[1];

	}

	//APP.closeLoading();
	/*
	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				win.close();
				//APP.removeAllChildren();
			}
		});
	}

	$.NavigationBar.showAction({
		callback: function(_event) {
			SOCIAL.share(ACTION.url, $.NavigationBar.right);
		}
	});
	*/
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

$.handleScanResult = function(e) {
	if(e.symbology == "QR") {
		//alert("success : " + e.barcode);
		APP.log("debug", "tourml_qr.scanresult @scan | " + e.barcode);
		if(e.barcode.indexOf(CONFIG.qrcode_prefix) === 0) {
			// QRcode prefix found, removing it
			var result = e.barcode.replace(CONFIG.qrcode_prefix, "");
			temp = MODEL.getIdAndControllerFromCode(result);
			if(temp.id) {
				// id & controller found from code
				win.close();
				APP.removeChild();
				APP.addChild(temp.controller, {
					id: temp.id,
					index: CONFIG.index
				});
			} else {
				alert("This stop is not in this tour (" + e.barcode + ").");
			};
		} else {
			alert("This QR does not fit the configuration. ");
		};
	}
};

// Handle click events on any annotations on this map.
/*view.addEventListener('click', function(evt) {
	Ti.API.info("Annotation clicksource " + evt.clicksource);

	if(evt.clicksource === "rightPane") {
		Ti.API.info("Annotation " + evt.title + " clicked, id: " + evt.annotation.myid + " | " + JSON.stringify(evt.annotation));
		// Define which controller is called a click

		switch(evt.annotation.tourmltype) {
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
		win.close();
		APP.removeChild();
		APP.addChild(controller, {
			id: evt.annotation.myid,
			index: CONFIG.index
		});

	}

});
*/
// Kick off the init
$.init();