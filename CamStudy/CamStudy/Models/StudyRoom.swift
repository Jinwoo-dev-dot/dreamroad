import Foundation

struct StudyRoom: Identifiable, Codable {
    var id: String
    var name: String
    var hostId: String
    var hostNickname: String
    var maxParticipants: Int
    var participantIds: [String]
    var participantNicknames: [String: String]
    var createdAt: Date
    var isActive: Bool

    var participantCount: Int { participantIds.count }
    var isFull: Bool { participantCount >= maxParticipants }
}
