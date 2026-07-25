import Foundation

@MainActor
final class CreateStudyRoomViewModel: ObservableObject {
    @Published var name = ""
    @Published var maxParticipants = 6
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var createdRoom: StudyRoom?

    private let firestoreService = FirestoreService.shared

    func createRoom(hostId: String, hostNickname: String) {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "방 이름을 입력해주세요."
            return
        }
        isLoading = true
        errorMessage = nil

        let room = StudyRoom(
            id: UUID().uuidString,
            name: name,
            hostId: hostId,
            hostNickname: hostNickname,
            maxParticipants: maxParticipants,
            participantIds: [hostId],
            participantNicknames: [hostId: hostNickname],
            createdAt: Date(),
            isActive: true
        )

        firestoreService.createStudyRoom(room) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success:
                    self.createdRoom = room
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}
