import 'package:camstudy_app/screens/auth/login_screen.dart';
import 'package:camstudy_app/viewmodels/auth_view_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('LoginScreen shows the app name and a sign up link', (
    tester,
  ) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthViewModel(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('캠스터디'), findsOneWidget);
    expect(find.text('계정이 없으신가요? 회원가입'), findsOneWidget);
  });
}
