import FirebaseAuth

enum AuthServiceError: LocalizedError {
    case unknown

    var errorDescription: String? {
        switch self {
        case .unknown:
            return "알 수 없는 오류가 발생했습니다."
        }
    }
}

final class AuthService {
    static let shared = AuthService()

    private init() {}

    var currentUser: User? {
        Auth.auth().currentUser
    }

    func signUp(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
        Auth.auth().createUser(withEmail: email, password: password) { result, error in
            if let error {
                completion(.failure(error))
                return
            }
            guard let user = result?.user else {
                completion(.failure(AuthServiceError.unknown))
                return
            }
            completion(.success(user))
        }
    }

    func signIn(email: String, password: String, completion: @escaping (Result<User, Error>) -> Void) {
        Auth.auth().signIn(withEmail: email, password: password) { result, error in
            if let error {
                completion(.failure(error))
                return
            }
            guard let user = result?.user else {
                completion(.failure(AuthServiceError.unknown))
                return
            }
            completion(.success(user))
        }
    }

    func signOut() throws {
        try Auth.auth().signOut()
    }

    /// Sends an SMS verification code to `phoneNumber` (E.164 format, e.g. "+821012345678").
    func sendPhoneVerificationCode(phoneNumber: String, completion: @escaping (Result<String, Error>) -> Void) {
        PhoneAuthProvider.provider().verifyPhoneNumber(phoneNumber, uiDelegate: nil) { verificationID, error in
            if let error {
                completion(.failure(error))
                return
            }
            guard let verificationID else {
                completion(.failure(AuthServiceError.unknown))
                return
            }
            completion(.success(verificationID))
        }
    }

    /// Verifies the SMS code. When `linkToCurrentUser` is true, the phone credential is
    /// linked to the already-signed-in (email/password) account instead of starting a new session.
    func verifyPhoneCode(
        verificationID: String,
        code: String,
        linkToCurrentUser: Bool,
        completion: @escaping (Result<User, Error>) -> Void
    ) {
        let credential = PhoneAuthProvider.provider().credential(
            withVerificationID: verificationID,
            verificationCode: code
        )

        if linkToCurrentUser, let currentUser = Auth.auth().currentUser {
            currentUser.link(with: credential) { result, error in
                if let error {
                    completion(.failure(error))
                    return
                }
                guard let user = result?.user else {
                    completion(.failure(AuthServiceError.unknown))
                    return
                }
                completion(.success(user))
            }
        } else {
            Auth.auth().signIn(with: credential) { result, error in
                if let error {
                    completion(.failure(error))
                    return
                }
                guard let user = result?.user else {
                    completion(.failure(AuthServiceError.unknown))
                    return
                }
                completion(.success(user))
            }
        }
    }
}
