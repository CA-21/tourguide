var CONFIG = arguments[0] || {};

if(CONFIG.navkeypad && typeof CONFIG.navkeypad == "function") {
	$.navkeypad.addEventListener("click", CONFIG.navkeypad);
} else {
	$.navkeypad.opacity = 0.4;
}

if(CONFIG.navlist && typeof CONFIG.navlist == "function") {
	$.navlist.addEventListener("click", CONFIG.navlist);
} else {
	$.navlist.opacity = 0.4;
}

if(CONFIG.navmap && typeof CONFIG.navmap == "function") {
	$.navmap.addEventListener("click", CONFIG.navmap);
} else {
	$.navmap.opacity = 0.4;
}