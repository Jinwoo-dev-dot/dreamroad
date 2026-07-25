import Foundation

enum AuthFlowStep {
    case login
    case signUp
    case phoneVerification
}

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var step: AuthFlowStep = .login
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    @Published var loginEmail = ""
    @Published var loginPassword = ""

    @Published var signUpEmail = ""
    @Published var signUpPassword = ""
    @Published var signUpPasswordConfirm = ""
    @Published var nickname = ""
    @Published var goal = ""

    @Published var phoneNumber = ""
    @Published var verificationCode = ""
    @Published var isCodeSent = false

    private var verificationID: String?

    private let authService = AuthService.shared
    private let firestoreService = FirestoreService.shared

    func login() {
        guard !loginEmail.isEmpty, !loginPassword.isEmpty else {
            errorMessage = "이메일과 비밀번호를 입력해주세요."
            return
        }
        isLoading = true
        errorMessage = nil
        authService.signIn(email: loginEmail, password: loginPassword) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success:
                    self.isAuthenticated = true
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func startSignUp() {
        errorMessage = nil
        step = .signUp
    }

    func submitSignUpProfile() {
        guard !signUpEmail.isEmpty, !signUpPassword.isEmpty else {
            errorMessage = "이메일과 비밀번호를 입력해주세요."
            return
        }
        guard signUpPassword == signUpPasswordConfirm else {
            errorMessage = "비밀번호가 일치하지 않습니다."
            return
        }
        guard signUpPassword.count >= 6 else {
            errorMessage = "비밀번호는 6자 이상이어야 합니다."
            return
        }
        guard !nickname.isEmpty else {
            errorMessage = "닉네임을 입력해주세요."
            return
        }

        isLoading = true
        errorMessage = nil
        authService.signUp(email: signUpEmail, password: signUpPassword) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let user):
                    let profile = UserProfile(
                        id: user.uid,
                        nickname: self.nickname,
                        goal: self.goal,
                        email: user.email,
                        phoneNumber: nil,
                        isPhoneVerified: false,
                        totalStudySeconds: 0,
                        createdAt: Date()
                    )
                    self.firestoreService.createProfile(profile) { result in
                        Task { @MainActor in
                            self.isLoading = false
                            switch result {
                            case .success:
                                self.step = .phoneVerification
                            case .failure(let error):
                                self.errorMessage = error.localizedDescription
                            }
                        }
                    }
                case .failure(let error):
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func sendVerificationCode() {
        guard !phoneNumber.isEmpty else {
            errorMessage = "전화번호를 입력해주세요."
            return
        }
        isLoading = true
        errorMessage = nil
        authService.sendPhoneVerificationCode(phoneNumber: normalizedPhoneNumber(phoneNumber)) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success(let verificationID):
                    self.verificationID = verificationID
                    self.isCodeSent = true
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func verifyCode() {
        guard let verificationID else {
            errorMessage = "인증번호를 먼저 요청해주세요."
            return
        }
        guard !verificationCode.isEmpty else {
            errorMessage = "인증번호를 입력해주세요."
            return
        }
        isLoading = true
        errorMessage = nil
        authService.verifyPhoneCode(
            verificationID: verificationID,
            code: verificationCode,
            linkToCurrentUser: true
        ) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let user):
                    self.firestoreService.updatePhoneVerified(
                        userId: user.uid,
                        phoneNumber: self.normalizedPhoneNumber(self.phoneNumber)
                    ) { result in
                        Task { @MainActor in
                            self.isLoading = false
                            switch result {
                            case .success:
                                self.isAuthenticated = true
                            case .failure(let error):
                                self.errorMessage = error.localizedDescription
                            }
                        }
                    }
                case .failure(let error):
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func skipPhoneVerificationForNow() {
        errorMessage = nil
        isAuthenticated = true
    }

    func backToLogin() {
        errorMessage = nil
        step = .login
    }

    /// Converts a Korean local number ("010-1234-5678") to E.164 ("+821012345678").
    /// Numbers already starting with "+" are passed through unchanged.
    private func normalizedPhoneNumber(_ raw: String) -> String {
        if raw.hasPrefix("+") { return raw }
        var digits = raw.filter(\.isNumber)
        if digits.hasPrefix("0") {
            digits.removeFirst()
        }
        return "+82" + digits
    }
}
