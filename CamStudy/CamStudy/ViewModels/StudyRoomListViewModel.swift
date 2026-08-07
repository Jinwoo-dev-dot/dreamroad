import FirebaseFirestore
import Foundation

@MainActor
final class StudyRoomListViewModel: ObservableObject {
    @Published var rooms: [StudyRoom] = []
    @Published var errorMessage: String?

    private var listener: ListenerRegistration?
    private let firestoreService = FirestoreService.shared

    func startObserving() {
        guard listener == nil else { return }
        listener = firestoreService.observeStudyRooms { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let rooms):
                    self.rooms = rooms
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func stopObserving() {
        listener?.remove()
        listener = nil
    }
}
