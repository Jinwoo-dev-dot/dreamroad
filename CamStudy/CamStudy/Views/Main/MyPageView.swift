import Charts
import SwiftUI

struct MyPageView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @EnvironmentObject private var session: UserSessionViewModel
    @StateObject private var statisticsViewModel = StatisticsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    profileHeader
                    totalTimeCard
                    weeklyChart
                }
                .padding(24)
            }
            .navigationTitle("마이페이지")
            .onAppear {
                if let userId = session.userId {
                    statisticsViewModel.loadSessions(userId: userId)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("로그아웃", role: .destructive) {
                        authViewModel.signOut()
                    }
                }
            }
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 6) {
            Text(session.profile?.nickname ?? "닉네임")
                .font(.title2.bold())
            if let goal = session.profile?.goal, !goal.isEmpty {
                Text("목표: \(goal)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var totalTimeCard: some View {
        VStack(spacing: 8) {
            Text("누적 공부 시간")
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text(formattedDuration(session.profile?.totalStudySeconds ?? 0))
                .font(.system(size: 32, weight: .bold, design: .monospaced))
            Text("오늘: \(formattedDuration(statisticsViewModel.todaySeconds))")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var weeklyChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("최근 7일")
                .font(.headline)

            Chart(statisticsViewModel.last7Days) { day in
                BarMark(
                    x: .value("날짜", day.date, unit: .day),
                    y: .value("공부 시간(분)", day.seconds / 60)
                )
            }
            .frame(height: 180)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func formattedDuration(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        return "\(hours)시간 \(minutes)분"
    }
}

#Preview {
    MyPageView()
        .environmentObject(AuthViewModel())
        .environmentObject(UserSessionViewModel())
}
