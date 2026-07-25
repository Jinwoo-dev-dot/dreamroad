import Foundation

struct DailyStudyTotal: Identifiable {
    var id: Date { date }
    var date: Date
    var seconds: Int
}

@MainActor
final class StatisticsViewModel: ObservableObject {
    @Published var sessions: [StudySession] = []
    @Published var errorMessage: String?
    @Published var isLoading = false

    private let firestoreService = FirestoreService.shared
    private let calendar = Calendar.current

    func loadSessions(userId: String) {
        isLoading = true
        errorMessage = nil
        firestoreService.fetchStudySessions(userId: userId) { [weak self] result in
            Task { @MainActor in
                guard let self else { return }
                self.isLoading = false
                switch result {
                case .success(let sessions):
                    self.sessions = sessions
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }

    var todaySeconds: Int {
        sessions
            .filter { calendar.isDateInToday($0.startedAt) }
            .reduce(0) { $0 + $1.durationSeconds }
    }

    var last7Days: [DailyStudyTotal] {
        let today = calendar.startOfDay(for: Date())
        return (0..<7).reversed().map { offset in
            let day = calendar.date(byAdding: .day, value: -offset, to: today) ?? today
            let seconds = sessions
                .filter { calendar.isDate($0.startedAt, inSameDayAs: day) }
                .reduce(0) { $0 + $1.durationSeconds }
            return DailyStudyTotal(date: day, seconds: seconds)
        }
    }
}
