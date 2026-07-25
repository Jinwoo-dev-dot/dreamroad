import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/auth_view_model.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(title: const Text('회원가입')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                '프로필 정보를 입력해주세요',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 20),
              TextField(
                decoration: const InputDecoration(
                  labelText: '이메일',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                onChanged: (value) => viewModel.signUpEmail = value,
              ),
              const SizedBox(height: 12),
              TextField(
                decoration: const InputDecoration(
                  labelText: '비밀번호 (6자 이상)',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                onChanged: (value) => viewModel.signUpPassword = value,
              ),
              const SizedBox(height: 12),
              TextField(
                decoration: const InputDecoration(
                  labelText: '비밀번호 확인',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                onChanged: (value) => viewModel.signUpPasswordConfirm = value,
              ),
              const SizedBox(height: 20),
              const Divider(),
              const SizedBox(height: 8),
              TextField(
                decoration: const InputDecoration(
                  labelText: '닉네임',
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => viewModel.nickname = value,
              ),
              const SizedBox(height: 12),
              TextField(
                decoration: const InputDecoration(
                  labelText: '목표 (예: OO대학교 합격)',
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => viewModel.goal = value,
              ),
              if (viewModel.errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  viewModel.errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
              const SizedBox(height: 20),
              FilledButton(
                onPressed: viewModel.isLoading
                    ? null
                    : viewModel.submitSignUpProfile,
                child: viewModel.isLoading
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('다음 (전화번호 인증)'),
              ),
              TextButton(
                onPressed: viewModel.backToLogin,
                child: const Text('이미 계정이 있으신가요? 로그인'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
