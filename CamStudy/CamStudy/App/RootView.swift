import SwiftUI

struct RootView: View {
    @StateObject private var authViewModel = AuthViewModel()

    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
            } else {
                switch authViewModel.step {
                case .login:
                    LoginView(viewModel: authViewModel)
                case .signUp:
                    SignUpView(viewModel: authViewModel)
                case .phoneVerification:
                    PhoneVerificationView(viewModel: authViewModel)
                }
            }
        }
        .animation(.default, value: authViewModel.isAuthenticated)
    }
}

#Preview {
    RootView()
}
