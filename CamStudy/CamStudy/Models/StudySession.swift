import Foundation

struct StudySession: Identifiable, Codable {
    var id: String
    var userId: String
    var roomId: String
    var roomName: String
    var startedAt: Date
    var endedAt: Date
    var durationSeconds: Int
}
