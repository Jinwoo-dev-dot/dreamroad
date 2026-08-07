import FirebaseAuth
import FirebaseFirestore
import Foundation

@MainActor
final class UserSessionViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var errorMessage: String?

    private var listener: ListenerRegistration?
    private let firestoreService = FirestoreService.shared

    var userId: String? {
        Auth.auth().currentUser?.uid
    }

    func startObservingProfile() {
        guard listener == nil, let userId else { return }
        listener = firestoreService.observeProfile(userId: userId) { [weak self] result in
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

    func stopObservingProfile() {
        listener?.remove()
        listener = nil
    }
}
