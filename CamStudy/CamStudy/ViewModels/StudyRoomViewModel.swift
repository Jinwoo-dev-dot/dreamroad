import Combine
import FirebaseFirestore
import Foundation

@MainActor
final class StudyRoomViewModel: ObservableObject {
    @Published var room: StudyRoom
    @Published var errorMessage: String?
    @Published var elapsedSeconds = 0

    private var listener: ListenerRegistration?
    private var timerCancellable: AnyCancellable?
    private var enteredAt: Date?
    private let firestoreService = FirestoreService.shared

    init(room: StudyRoom) {
        self.room = room
    }

    func enter(userId: String, nickname: String) {
        enteredAt = Date()
        elapsedSeconds = 0
        startTimer()

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
        stopTimer()
        saveSession(userId: userId)

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

    private func startTimer() {
        timerCancellable = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.elapsedSeconds += 1
            }
    }

    private func stopTimer() {
        timerCancellable?.cancel()
        timerCancellable = nil
    }

    private func saveSession(userId: String) {
        guard let enteredAt, elapsedSeconds > 0 else { return }

        let session = StudySession(
            id: UUID().uuidString,
            userId: userId,
            roomId: room.id,
            roomName: room.name,
            startedAt: enteredAt,
            endedAt: Date(),
            durationSeconds: elapsedSeconds
        )

        firestoreService.saveStudySession(session) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                switch result {
                case .success:
                    self.firestoreService.incrementTotalStudySeconds(userId: userId, by: session.durationSeconds) { result in
                        if case .failure(let error) = result {
                            Task { @MainActor in
                                self.errorMessage = error.localizedDescription
                            }
                        }
                    }
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
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
