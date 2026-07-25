import FirebaseFirestore
import Foundation

@MainActor
final class StudyRoomViewModel: ObservableObject {
    @Published var room: StudyRoom
    @Published var errorMessage: String?

    private var listener: ListenerRegistration?
    private let firestoreService = FirestoreService.shared

    init(room: StudyRoom) {
        self.room = room
    }

    func enter(userId: String, nickname: String) {
        firestoreService.joinStudyRoom(roomId: room.id, userId: userId, nickname: nickname) { [weak self] result in
            Task { @MainActor in
                if case .failure(let error) = result {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
        observeRoom()
    }

    func leave(userId: String) {
        firestoreService.leaveStudyRoom(roomId: room.id, userId: userId) { [weak self] result in
            Task { @MainActor in
                if case .failure(let error) = result {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func stopObserving() {
        listener?.remove()
        listener = nil
    }

    private func observeRoom() {
        listener = firestoreService.observeStudyRoom(roomId: room.id) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success(let room):
                    self.room = room
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}
