import FirebaseFirestore

final class FirestoreService {
    static let shared = FirestoreService()

    private init() {}

    private let db = Firestore.firestore()
    private let usersCollection = "users"

    func createProfile(_ profile: UserProfile, completion: @escaping (Result<Void, Error>) -> Void) {
        do {
            try db.collection(usersCollection).document(profile.id).setData(from: profile) { error in
                if let error {
                    completion(.failure(error))
                } else {
                    completion(.success(()))
                }
            }
        } catch {
            completion(.failure(error))
        }
    }

    func updatePhoneVerified(userId: String, phoneNumber: String, completion: @escaping (Result<Void, Error>) -> Void) {
        db.collection(usersCollection).document(userId).updateData([
            "phoneNumber": phoneNumber,
            "isPhoneVerified": true,
        ]) { error in
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }

    func fetchProfile(userId: String, completion: @escaping (Result<UserProfile, Error>) -> Void) {
        db.collection(usersCollection).document(userId).getDocument { snapshot, error in
            if let error {
                completion(.failure(error))
                return
            }
            do {
                guard let profile = try snapshot?.data(as: UserProfile.self) else {
                    completion(.failure(AuthServiceError.unknown))
                    return
                }
                completion(.success(profile))
            } catch {
                completion(.failure(error))
            }
        }
    }
}
