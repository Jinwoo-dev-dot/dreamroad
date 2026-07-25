import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/auth_view_model.dart';
import '../auth/login_screen.dart';
import '../auth/phone_verification_screen.dart';
import '../auth/sign_up_screen.dart';
import 'main_tab_screen.dart';

class RootScreen extends StatelessWidget {
  const RootScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authViewModel = context.watch<AuthViewModel>();

    if (authViewModel.isAuthenticated) {
      return const MainTabScreen();
    }

    switch (authViewModel.step) {
      case AuthStep.login:
        return const LoginScreen();
      case AuthStep.signUp:
        return const SignUpScreen();
      case AuthStep.phoneVerification:
        return const PhoneVerificationScreen();
    }
  }
}
