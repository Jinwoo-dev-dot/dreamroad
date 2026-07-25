import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/auth_view_model.dart';
import '../../viewmodels/platform_support.dart';

class PhoneVerificationScreen extends StatelessWidget {
  const PhoneVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<AuthViewModel>();

    return Scaffold(
      appBar: AppBar(title: const Text('전화번호 인증')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                '본인 확인을 위해 전화번호를 인증해주세요',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 20),
              if (!isPhoneAuthSupported)
                const Text('이 플랫폼에서는 전화번호 인증을 지원하지 않아요. 나중에 모바일 앱에서 인증할 수 있어요.')
              else ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          labelText: '전화번호 (예: 010-1234-5678)',
                        ),
                        keyboardType: TextInputType.phone,
                        enabled: !viewModel.isCodeSent,
                        onChanged: (value) => viewModel.phoneNumber = value,
                      ),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed:
                          viewModel.isLoading || viewModel.phoneNumber.isEmpty
                          ? null
                          : viewModel.sendVerificationCode,
                      child: Text(viewModel.isCodeSent ? '재전송' : '인증번호 받기'),
                    ),
                  ],
                ),
                if (viewModel.isCodeSent) ...[
                  const SizedBox(height: 12),
                  TextField(
                    decoration: const InputDecoration(labelText: '인증번호 6자리'),
                    keyboardType: TextInputType.number,
                    onChanged: (value) => viewModel.verificationCode = value,
                  ),
                ],
              ],
              if (viewModel.errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  viewModel.errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
              const SizedBox(height: 20),
              if (isPhoneAuthSupported && viewModel.isCodeSent)
                FilledButton(
                  onPressed: viewModel.isLoading ? null : viewModel.verifyCode,
                  child: viewModel.isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('인증 완료'),
                ),
              TextButton(
                onPressed: viewModel.skipPhoneVerificationForNow,
                child: const Text('나중에 인증하기'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
