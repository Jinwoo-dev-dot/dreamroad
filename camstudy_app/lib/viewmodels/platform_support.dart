import 'dart:io';

/// Firebase Auth's phone (SMS) provider is only available on Android/iOS (and Web,
/// which this app doesn't target). Desktop platforms (Windows/macOS/Linux) fall back
/// to skipping phone verification.
bool get isPhoneAuthSupported => Platform.isAndroid || Platform.isIOS;
