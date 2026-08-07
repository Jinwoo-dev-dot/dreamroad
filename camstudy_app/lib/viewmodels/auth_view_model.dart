import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';

enum AuthStep { login, signUp, phoneVerification }

class AuthViewModel extends ChangeNotifier {
  AuthStep step = AuthStep.login;
  bool isAuthenticated = false;
  bool isLoading = false;
  String? errorMessage;

  String loginEmail = '';
  String loginPassword = '';

  String signUpEmail = '';
  String signUpPassword = '';
  String signUpPasswordConfirm = '';
  String nickname = '';
  String goal = '';

  String phoneNumber = '';
  String verificationCode = '';
  bool isCodeSent = false;

  String? _verificationId;

  final _authService = AuthService.shared;
  final _firestoreService = FirestoreService.shared;

  Future<void> login() async {
    if (loginEmail.isEmpty || loginPassword.isEmpty) {
      errorMessage = '이메일과 비밀번호를 입력해주세요.';
      notifyListeners();
      return;
    }
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _authService.signIn(email: loginEmail, password: loginPassword);
      isAuthenticated = true;
    } catch (e) {
      errorMessage = _friendlyMessage(e);
    }
    isLoading = false;
    notifyListeners();
  }

  void startSignUp() {
    errorMessage = null;
    step = AuthStep.signUp;
    notifyListeners();
  }

  Future<void> submitSignUpProfile() async {
    if (signUpEmail.isEmpty || signUpPassword.isEmpty) {
      errorMessage = '이메일과 비밀번호를 입력해주세요.';
      notifyListeners();
      return;
    }
    if (signUpPassword != signUpPasswordConfirm) {
      errorMessage = '비밀번호가 일치하지 않습니다.';
      notifyListeners();
      return;
    }
    if (signUpPassword.length < 6) {
      errorMessage = '비밀번호는 6자 이상이어야 합니다.';
      notifyListeners();
      return;
    }
    if (nickname.isEmpty) {
      errorMessage = '닉네임을 입력해주세요.';
      notifyListeners();
      return;
    }

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.signUp(
        email: signUpEmail,
        password: signUpPassword,
      );
      final profile = UserProfile(
        id: user.uid,
        nickname: nickname,
        goal: goal,
        email: user.email,
        phoneNumber: null,
        isPhoneVerified: false,
        totalStudySeconds: 0,
        createdAt: DateTime.now(),
      );
      await _firestoreService.createProfile(profile);
      step = AuthStep.phoneVerification;
    } catch (e) {
      errorMessage = _friendlyMessage(e);
    }
    isLoading = false;
    notifyListeners();
  }

  Future<void> sendVerificationCode() async {
    if (phoneNumber.isEmpty) {
      errorMessage = '전화번호를 입력해주세요.';
      notifyListeners();
      return;
    }
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      _verificationId = await _authService.sendPhoneVerificationCode(
        _normalizedPhoneNumber(phoneNumber),
      );
      isCodeSent = true;
    } catch (e) {
      errorMessage = _friendlyMessage(e);
    }
    isLoading = false;
    notifyListeners();
  }

  Future<void> verifyCode() async {
    final verificationId = _verificationId;
    if (verificationId == null) {
      errorMessage = '인증번호를 먼저 요청해주세요.';
      notifyListeners();
      return;
    }
    if (verificationCode.isEmpty) {
      errorMessage = '인증번호를 입력해주세요.';
      notifyListeners();
      return;
    }
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final user = await _authService.verifyPhoneCode(
        verificationId: verificationId,
        smsCode: verificationCode,
        linkToCurrentUser: true,
      );
      await _firestoreService.updatePhoneVerified(
        userId: user.uid,
        phoneNumber: _normalizedPhoneNumber(phoneNumber),
      );
      isAuthenticated = true;
    } catch (e) {
      errorMessage = _friendlyMessage(e);
    }
    isLoading = false;
    notifyListeners();
  }

  void skipPhoneVerificationForNow() {
    errorMessage = null;
    isAuthenticated = true;
    notifyListeners();
  }

  void backToLogin() {
    errorMessage = null;
    step = AuthStep.login;
    notifyListeners();
  }

  Future<void> signOut() async {
    await _authService.signOut();
    isAuthenticated = false;
    step = AuthStep.login;
    loginEmail = '';
    loginPassword = '';
    notifyListeners();
  }

  /// Converts a Korean local number ("010-1234-5678") to E.164 ("+821012345678").
  /// Numbers already starting with "+" are passed through unchanged.
  String _normalizedPhoneNumber(String raw) {
    if (raw.startsWith('+')) return raw;
    var digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    return '+82$digits';
  }

  String _friendlyMessage(Object error) {
    if (error is FirebaseAuthException) {
      return error.message ?? '오류가 발생했습니다.';
    }
    return error.toString();
  }
}
