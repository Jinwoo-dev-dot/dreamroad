import Foundation

struct ChatMessage: Identifiable, Codable {
    var id: String
    var senderId: String
    var senderNickname: String
    var text: String
    var sentAt: Date
}
