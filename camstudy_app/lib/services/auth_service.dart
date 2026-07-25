import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  AuthService._();
  static final AuthService shared = AuthService._();

  // A getter (not a field initializer) so constructing AuthService — which happens
  // eagerly via the `shared` singleton — never touches Firebase before it's initialized.
  FirebaseAuth get _auth => FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;

  Future<User> signUp({required String email, required String password}) async {
    final result = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    final user = result.user;
    if (user == null) throw Exception('알 수 없는 오류가 발생했습니다.');
    return user;
  }

  Future<User> signIn({required String email, required String password}) async {
    final result = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    final user = result.user;
    if (user == null) throw Exception('알 수 없는 오류가 발생했습니다.');
    return user;
  }

  Future<void> signOut() => _auth.signOut();

  /// Sends an SMS verification code to [phoneNumber] (E.164 format, e.g. "+821012345678").
  /// Only supported on Android/iOS/Web — see PlatformSupport.isPhoneAuthSupported.
  Future<String> sendPhoneVerificationCode(String phoneNumber) {
    final completer = Completer<String>();
    _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (_) {},
      verificationFailed: (FirebaseAuthException error) {
        if (!completer.isCompleted) completer.completeError(error);
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!completer.isCompleted) completer.complete(verificationId);
      },
      codeAutoRetrievalTimeout: (_) {},
    );
    return completer.future;
  }

  /// Verifies the SMS code. When [linkToCurrentUser] is true, the phone credential is
  /// linked to the already-signed-in (email/password) account instead of starting a new session.
  Future<User> verifyPhoneCode({
    required String verificationId,
    required String smsCode,
    required bool linkToCurrentUser,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );

    if (linkToCurrentUser && currentUser != null) {
      final result = await currentUser!.linkWithCredential(credential);
      final user = result.user;
      if (user == null) throw Exception('알 수 없는 오류가 발생했습니다.');
      return user;
    }

    final result = await _auth.signInWithCredential(credential);
    final user = result.user;
    if (user == null) throw Exception('알 수 없는 오류가 발생했습니다.');
    return user;
  }
}
