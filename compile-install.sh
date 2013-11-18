#!/bin/bash
cd ~/CloudStation/Titanium/workspace/TourGuide
#Alloy compile --config platform=android
titanium build --platform=android --build-only
adb -s 192.168.56.101:5555 shell pm uninstall io.tourguide
adb -s 192.168.56.101:5555 install -r build/android/bin/app.apk
