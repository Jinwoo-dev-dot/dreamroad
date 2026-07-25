import FirebaseAuth
import Foundation

@MainActor
final class UserSessionViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var errorMessage: String?

    private let firestoreService = FirestoreService.shared

    var userId: String? {
        Auth.auth().currentUser?.uid
    }

    func loadProfile() {
        guard let userId else { return }
        firestoreService.fetchProfile(userId: userId) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let profile):
                    self.profile = profile
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}
