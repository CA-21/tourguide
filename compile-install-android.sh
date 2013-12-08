#!/bin/bash
titanium build --platform=android --build-only
adb -s 192.168.56.102:5555 shell pm uninstall io.tourguide.test
adb -s 192.168.56.102:5555 install -r build/android/bin/app.apk
adb shell am force-stop io.tourguide.test
adb shell am start -a android.intent.action.MAIN -n io.tourguide.test/.TourguideActivity
