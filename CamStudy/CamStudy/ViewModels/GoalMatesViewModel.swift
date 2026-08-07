import Foundation

@MainActor
final class GoalMatesViewModel: ObservableObject {
    @Published var mates: [UserProfile] = []
    @Published var errorMessage: String?
    @Published var isLoading = false

    private let firestoreService = FirestoreService.shared

    func loadMates(goal: String, excludingUserId: String) {
        isLoading = true
        errorMessage = nil
        firestoreService.fetchGoalMates(goal: goal, excludingUserId: excludingUserId) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success(let mates):
                    self.mates = mates
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}
