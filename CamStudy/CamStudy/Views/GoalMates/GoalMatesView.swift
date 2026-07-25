import SwiftUI

struct GoalMatesView: View {
    @EnvironmentObject private var session: UserSessionViewModel
    @StateObject private var viewModel = GoalMatesViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if let goal = session.profile?.goal, !goal.isEmpty {
                    if viewModel.mates.isEmpty {
                        emptyState(goal: goal)
                    } else {
                        List(viewModel.mates) { mate in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(mate.nickname)
                                    .font(.headline)
                                Text(mate.goal)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                } else {
                    noGoalState
                }
            }
            .navigationTitle("목표메이트")
            .onAppear {
                guard let goal = session.profile?.goal, !goal.isEmpty, let userId = session.userId else { return }
                viewModel.loadMates(goal: goal, excludingUserId: userId)
            }
        }
    }

    private func emptyState(goal: String) -> some View {
        VStack(spacing: 8) {
            Text("\"\(goal)\"을(를) 목표로 하는 다른 사용자가 아직 없어요")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private var noGoalState: some View {
        Text("프로필에 목표를 설정하면 같은 목표를 가진 사용자를 볼 수 있어요")
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    GoalMatesView()
        .environmentObject(UserSessionViewModel())
}
