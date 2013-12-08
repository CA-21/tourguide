var APP = require("core");

var CONFIG = arguments[0] || {};

$.row.id = CONFIG.id || 0;
$.heading.text = CONFIG.heading || "";
$.subHeading.color = APP.Settings.colors.primary || "#000";
$.row.backgroundGradient = {
	type: 'linear',
	colors: [{
		color: '#f1f1f1',
		position: 0.0
	}, {
		color: '#d3d3d3',
		position: 1.0
	}]
};
$.subHeading.text = CONFIG.subHeading || "";
$.code.text = CONFIG.code || "";
$.row.tourmltype = CONFIG.tourmltype || "";

if($.row.tourmltype == "audio_stop") {
	$.type_icon.image = "/images/ic_device_access_volume_on.png";
}
if($.row.tourmltype == "image_stop") {
	$.type_icon.image = "/images/ic_device_access_camera.png";
}
if($.row.tourmltype == "video_stop") {
	$.type_icon.image = "/images/ic_av_play_over_video.png";
}

if($.row.tourmltype == "stop_group") {
	$.type_icon.image = "/images/ic_social_share.png";
}