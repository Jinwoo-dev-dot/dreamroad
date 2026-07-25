import SwiftUI

struct PhoneVerificationView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 8) {
                    Text("전화번호 인증")
                        .font(.title.bold())
                    Text("본인 확인을 위해 전화번호를 인증해주세요")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 32)

                VStack(spacing: 12) {
                    HStack {
                        TextField("전화번호 (예: 010-1234-5678)", text: $viewModel.phoneNumber)
                            .keyboardType(.phonePad)
                            .textFieldStyle(.roundedBorder)
                            .disabled(viewModel.isCodeSent)

                        Button(viewModel.isCodeSent ? "재전송" : "인증번호 받기") {
                            viewModel.sendVerificationCode()
                        }
                        .disabled(viewModel.isLoading || viewModel.phoneNumber.isEmpty)
                    }

                    if viewModel.isCodeSent {
                        TextField("인증번호 6자리", text: $viewModel.verificationCode)
                            .keyboardType(.numberPad)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if viewModel.isCodeSent {
                    Button {
                        viewModel.verifyCode()
                    } label: {
                        if viewModel.isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("인증 완료")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.isLoading)
                }

                Button("나중에 인증하기") {
                    viewModel.skipPhoneVerificationForNow()
                }
                .font(.footnote)
                .foregroundStyle(.secondary)

                Spacer()
            }
            .padding(24)
        }
    }
}

#Preview {
    PhoneVerificationView(viewModel: AuthViewModel())
}
