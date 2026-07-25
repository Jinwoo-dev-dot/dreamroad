import SwiftUI

struct LoginView: View {
    @ObservedObject var viewModel: AuthViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer(minLength: 60)

                VStack(spacing: 8) {
                    Text("캠스터디")
                        .font(.largeTitle.bold())
                    Text("함께 공부하는 시간")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 12) {
                    TextField("이메일", text: $viewModel.loginEmail)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)

                    SecureField("비밀번호", text: $viewModel.loginPassword)
                        .textFieldStyle(.roundedBorder)
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Button {
                    viewModel.login()
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("로그인")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading)

                Button("계정이 없으신가요? 회원가입") {
                    viewModel.startSignUp()
                }
                .font(.footnote)

                Spacer()
            }
            .padding(24)
        }
    }
}

#Preview {
    LoginView(viewModel: AuthViewModel())
}
