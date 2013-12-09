#!/bin/bash
adb -s 192.168.56.102:5555 shell pm uninstall io.tourguide.test
adb -s 192.168.56.102:5555 install -r build/android/bin/app.apk
