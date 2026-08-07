import SwiftUI

struct SignUpView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 8) {
                    Text("회원가입")
                        .font(.title.bold())
                    Text("프로필 정보를 입력해주세요")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 32)

                VStack(spacing: 12) {
                    TextField("이메일", text: $viewModel.signUpEmail)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)

                    SecureField("비밀번호 (6자 이상)", text: $viewModel.signUpPassword)
                        .textFieldStyle(.roundedBorder)

                    SecureField("비밀번호 확인", text: $viewModel.signUpPasswordConfirm)
                        .textFieldStyle(.roundedBorder)

                    Divider().padding(.vertical, 4)

                    TextField("닉네임", text: $viewModel.nickname)
                        .textFieldStyle(.roundedBorder)

                    TextField("목표 (예: OO대학교 합격)", text: $viewModel.goal)
                        .textFieldStyle(.roundedBorder)
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Button {
                    viewModel.submitSignUpProfile()
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("다음 (전화번호 인증)")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading)

                Button("이미 계정이 있으신가요? 로그인") {
                    viewModel.backToLogin()
                }
                .font(.footnote)

                Spacer()
            }
            .padding(24)
        }
    }
}

#Preview {
    SignUpView(viewModel: AuthViewModel())
}
