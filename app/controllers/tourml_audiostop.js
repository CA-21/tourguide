var APP = require("core");
var SOCIAL = require("social");
var DATE = require("alloy/moment");
var STRING = require("alloy/string");
var MODEL = require("models/tourml")();

var CONFIG = arguments[0] || {};
var ACTION = {};
var STREAM;

var DURATION;
var PAUSED = 0;
var RESTART_TIME;

$.init = function() {
	APP.log("debug", "tourml_stop.init | " + JSON.stringify(CONFIG));

	MODEL.init(CONFIG.index);

	$.handleData(MODEL.getAudioTourml(CONFIG.id));

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack();
	}

};

$.handleData = function(_data) {
	APP.log("debug", "tourml_audiostop.handleData");

	$.handleNavigation();
	APP.log("debug", "tourml_stop._data | " + JSON.stringify(_data));

	var subdata = null;
	var image_file = null;
	var audio_file = null;

	if(_data) {
		$.title.text = _data.title;
		subdata = _data.subdata;
		image_file = _data.image;
		audio_file = _data.audio;
		if(_data.duration) {
			var _duration = _data.duration.split(":");
			APP.log("debug", "tourml_audiostop._duration | " + JSON.stringify(_duration));
			DURATION = ((_duration[0] * 60 + _duration[1]) * 60 + _duration[2]) * 1000;
			APP.log("debug", "tourml_audiostop.DURATION | " + JSON.stringify(DURATION));
		} else {
			DURATION = 0;
		}
	} else {
		$.title.text = "Problem";
	}
	if(!image_file) {
		image_file = "/images/fond-no-image.png";
	}
	$.artwork.image = image_file;

	APP.log("debug", "tourml_stop._data.subdata | " + JSON.stringify(subdata));

	APP.log("debug", "tourml_stop._data.audio | " + JSON.stringify(audio_file));

	if(audio_file) {
		$.createAudioPlayer(audio_file);
		ACTION.url = audio_file;
	}

	$.NavigationBar.setBackgroundColor(APP.Settings.colors.primary || "#000");

	if(APP.Device.isHandheld) {
		$.NavigationBar.showBack({
			callback: function(_event) {
				$.streamStop();

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

$.createAudioPlayer = function(_url) {
	APP.log("debug", "tourml_audiostop.createAudioPlayer(" + _url + ")");

	Ti.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_PLAYBACK;

	var soundURL = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory, _url).nativePath;

	if(OS_IOS) {
		STREAM = Ti.Media.createVideoPlayer({
			url: _url,
			backgroundColor: "#000",
			fullscreen: false,
			allowsAirPlay: true,
			mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
			mediaTypes: Ti.Media.VIDEO_MEDIA_TYPE_AUDIO,
			repeatMode: Ti.Media.VIDEO_REPEAT_MODE_NONE,
			sourceType: Ti.Media.VIDEO_SOURCE_TYPE_STREAMING,
			useApplicationAudioSession: true,
			visible: false
		});

		STREAM.addEventListener("playbackstate", $.streamState);
		STREAM.addEventListener("loadstate", $.streamPlay);
	}
	if(OS_ANDROID) {
		STREAM = Titanium.Media.createAudioPlayer({});
		STREAM.addEventListener("loadstate", $.streamPlay);
		STREAM.setUrl(soundURL);

		$.streamPlay();

		RESTART_TIME = new Date().getTime();
	}

	setInterval($.streamProgress, 500);
};

$.handleNavigation = function(_id) {

	ACTION.map = null;
	ACTION.list = null;
	ACTION.keypad = null;

	var navigation = Alloy.createWidget("com.visitenumerique.tourmlNavigation", null, {
		navmap: function(_event) {
			STREAM.stop();
			STREAM.release();
			APP.log("debug", "tourml_audio @map");

			APP.addChild("tourml_map2", {
				index: CONFIG.index,
				isChild: true
			});
		},
		navkeypad: function(_event) {
			STREAM.stop();
			STREAM.release();
			APP.log("debug", "tourml_audio @keypad");

			APP.addChild("tourml_keypad", {
				index: CONFIG.index,
				isChild: true
			});
		},
	}).getView();

	$.NavigationBar.addNavigation(navigation);
};

$.streamPlay = function(_event) {
	STREAM.play();
	$.play.visible = false;
	$.pause.visible = true;
	RESTART_TIME = new Date().getTime();
};

$.streamPause = function(_event) {
	$.pause.visible = false;
	$.play.visible = true;
	STREAM.pause();
	var newTime = new Date().getTime();
	PAUSED = PAUSED + newTime - RESTART_TIME;
};

$.streamStop = function() {
	$.pause.visible = false;
	$.play.visible = true;
	STREAM.stop();
	STREAM.release();
};

if(OS_IOS) {
	$.streamSeek = function(_event) {
		var x = _event.x;
		var width = $.track.rect.width;
		var percentage = x / width;
		var position = Math.round(STREAM.getDuration() * percentage);

		APP.log("debug", "streamseek " + STREAM.getDuration() + " " + x);

		STREAM.setCurrentPlaybackTime(position);

		$.position.width = (percentage * 100) + "%";
	};
}

if(OS_IOS) {
	$.streamProgress = function(_event) {
		if(STREAM.playbackState == Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING) {
			var percentage = ((STREAM.currentPlaybackTime / STREAM.getDuration()) * 100);
			var time = DATE.duration(STREAM.currentPlaybackTime);

			percentage = percentage >= 1 ? percentage : 1;

			$.position.width = percentage + "%";
			$.time.text = (time.hours() !== 0 ? time.hours() + ":" : "") + time.minutes() + ":" + (time.seconds() < 10 ? "0" : "") + time.seconds();
		}
	};
}

if(OS_ANDROID) {
	$.streamProgress = function(_event) {
		if(STREAM.isPlaying() && !STREAM.isPaused()) {
			var newTime = new Date().getTime();
			var _progress = PAUSED + newTime - RESTART_TIME;
		}
		if(STREAM.isPlaying() && (DURATION > 0)) {
			APP.log("debug", "_progress " + _progress);
			var percentage = ((_progress / DURATION) * 100);
			percentage = percentage >= 1 ? percentage : 1;
			$.position.width = percentage + "%";

			var seconds = Math.floor((_progress / 1000) % 60);
			APP.log("debug", "seconds " + seconds);
			var minutes = Math.floor((_progress / (1000 * 60)) % 60);
			APP.log("debug", "minutes " + minutes);
			var hours = Math.floor((_progress / (1000 * 60 * 60)) % 24);
			$.time.text = (hours !== 0 ? hours + ":" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
		}
	};
}

$.streamState = function(_event) {
	if(_event.playbackState == Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING) {
		$.play.visible = false;
		$.pause.visible = true;
	} else {
		$.pause.visible = false;
		$.play.visible = true;
	}
};

// Event listeners
$.play.addEventListener("click", $.streamPlay);
$.pause.addEventListener("click", $.streamPause);
if(OS_IOS) {
	$.track.addEventListener("click", $.streamSeek);
}

// Kick off the init
$.init();