#!/bin/bash
adb -d shell pm uninstall io.tourguide.test
adb -d install -r build/android/bin/app.apk
