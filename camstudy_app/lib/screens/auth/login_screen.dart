import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/auth_view_model.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<AuthViewModel>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  '캠스터디',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                const Text('함께 공부하는 시간', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                TextField(
                  decoration: const InputDecoration(
                    labelText: '이메일',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  onChanged: (value) => viewModel.loginEmail = value,
                ),
                const SizedBox(height: 12),
                TextField(
                  decoration: const InputDecoration(
                    labelText: '비밀번호',
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  onChanged: (value) => viewModel.loginPassword = value,
                ),
                if (viewModel.errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    viewModel.errorMessage!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: viewModel.isLoading ? null : viewModel.login,
                    child: viewModel.isLoading
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('로그인'),
                  ),
                ),
                TextButton(
                  onPressed: viewModel.startSignUp,
                  child: const Text('계정이 없으신가요? 회원가입'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
