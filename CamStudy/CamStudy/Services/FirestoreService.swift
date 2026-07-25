import FirebaseFirestore

final class FirestoreService {
    static let shared = FirestoreService()

    private init() {}

    private let db = Firestore.firestore()
    private let usersCollection = "users"
    private let studyRoomsCollection = "studyRooms"
    private let studySessionsCollection = "studySessions"

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

    /// Listens for open study rooms, sorted newest first. Sorted client-side to avoid
    /// requiring a composite Firestore index for `isActive == true` + `orderBy(createdAt)`.
    func observeStudyRooms(onChange: @escaping (Result<[StudyRoom], Error>) -> Void) -> ListenerRegistration {
        db.collection(studyRoomsCollection)
            .whereField("isActive", isEqualTo: true)
            .addSnapshotListener { snapshot, error in
                if let error {
                    onChange(.failure(error))
                    return
                }
                let rooms = (snapshot?.documents.compactMap { try? $0.data(as: StudyRoom.self) } ?? [])
                    .sorted { $0.createdAt > $1.createdAt }
                onChange(.success(rooms))
            }
    }

    func observeStudyRoom(roomId: String, onChange: @escaping (Result<StudyRoom, Error>) -> Void) -> ListenerRegistration {
        db.collection(studyRoomsCollection).document(roomId).addSnapshotListener { snapshot, error in
            if let error {
                onChange(.failure(error))
                return
            }
            guard let snapshot, snapshot.exists else {
                onChange(.failure(AuthServiceError.unknown))
                return
            }
            do {
                let room = try snapshot.data(as: StudyRoom.self)
                onChange(.success(room))
            } catch {
                onChange(.failure(error))
            }
        }
    }

    func createStudyRoom(_ room: StudyRoom, completion: @escaping (Result<Void, Error>) -> Void) {
        do {
            try db.collection(studyRoomsCollection).document(room.id).setData(from: room) { error in
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

    func joinStudyRoom(roomId: String, userId: String, nickname: String, completion: @escaping (Result<Void, Error>) -> Void) {
        db.collection(studyRoomsCollection).document(roomId).updateData([
            "participantIds": FieldValue.arrayUnion([userId]),
            "participantNicknames.\(userId)": nickname,
        ]) { error in
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }

    func leaveStudyRoom(roomId: String, userId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        db.collection(studyRoomsCollection).document(roomId).updateData([
            "participantIds": FieldValue.arrayRemove([userId]),
            "participantNicknames.\(userId)": FieldValue.delete(),
        ]) { error in
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }

    func saveStudySession(_ session: StudySession, completion: @escaping (Result<Void, Error>) -> Void) {
        do {
            try db.collection(studySessionsCollection).document(session.id).setData(from: session) { error in
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

    func incrementTotalStudySeconds(userId: String, by seconds: Int, completion: @escaping (Result<Void, Error>) -> Void) {
        db.collection(usersCollection).document(userId).updateData([
            "totalStudySeconds": FieldValue.increment(Int64(seconds)),
        ]) { error in
            if let error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }
    }

    /// Fetches all sessions for a user, sorted newest first client-side (avoids requiring
    /// a composite index for `userId == ...` + `orderBy(startedAt)`).
    func fetchStudySessions(userId: String, completion: @escaping (Result<[StudySession], Error>) -> Void) {
        db.collection(studySessionsCollection)
            .whereField("userId", isEqualTo: userId)
            .getDocuments { snapshot, error in
                if let error {
                    completion(.failure(error))
                    return
                }
                let sessions = (snapshot?.documents.compactMap { try? $0.data(as: StudySession.self) } ?? [])
                    .sorted { $0.startedAt > $1.startedAt }
                completion(.success(sessions))
            }
    }
}
