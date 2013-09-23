var APP = require("core");

var CONFIG = arguments[0] || {};

$.row.id = CONFIG.id || 0;
$.heading.text = CONFIG.heading || "";
$.subHeading.color = APP.Settings.colors.primary || "#000";
$.subHeading.text = CONFIG.subHeading || "";
$.code.text = CONFIG.code || "";
$.row.tourmltype = CONFIG.tourmltype || "";