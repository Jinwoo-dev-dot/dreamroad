import Foundation

struct UserProfile: Identifiable, Codable {
    var id: String
    var nickname: String
    var goal: String
    var email: String?
    var phoneNumber: String?
    var isPhoneVerified: Bool
    var totalStudySeconds: Int
    var createdAt: Date
}
