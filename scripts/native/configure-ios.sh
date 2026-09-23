#!/usr/bin/env bash
set -euo pipefail

ruby -e "require 'xcodeproj'" 2> /dev/null \
  || { echo "configure-ios.sh needs the xcodeproj gem for the ruby on PATH: gem install --user-install xcodeproj" >&2; exit 1; }

podfile=ios/App/Podfile
sed -i.orig "s|^  # Add your Pods here$|  pod 'CapacitorFirebaseAuthentication/Google', :path => '../../node_modules/@capacitor-firebase/authentication'|" "$podfile"
rm "$podfile.orig"
grep -q "pod 'CapacitorFirebaseAuthentication/Google'" "$podfile"

plist=ios/App/App/Info.plist
plutil -replace NSCameraUsageDescription -string 'Todo List uses the camera to attach a photo to a task.' "$plist"
plutil -replace NSPhotoLibraryUsageDescription -string 'Todo List reads your photo library to attach a photo to a task.' "$plist"
plutil -replace NSPhotoLibraryAddUsageDescription -string 'Todo List saves the photos you take to your photo library.' "$plist"
plutil -replace NSMicrophoneUsageDescription -string 'Todo List uses the microphone to dictate a task.' "$plist"
plutil -replace NSSpeechRecognitionUsageDescription -string 'Todo List turns your speech into the text of a task.' "$plist"
plutil -lint "$plist"

# A fresh project has no shared scheme, and xcodebuild -scheme App needs one.
ruby - ios/App/App.xcodeproj <<'RUBY'
require 'xcodeproj'
project_path = ARGV.fetch(0)
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'App' } or abort('App target not found')
scheme = Xcodeproj::XCScheme.new
scheme.configure_with_targets(target, nil, launch_target: true)
scheme.save_as(project_path, 'App', true)
RUBY
test -f ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme

npx --yes @capacitor/assets@3.0.5 generate --ios --iosProject ios/App \
  --assetPath resources \
  --iconBackgroundColor '#e91e63' --iconBackgroundColorDark '#e91e63' \
  --splashBackgroundColor '#ffffff' --splashBackgroundColorDark '#111111'
