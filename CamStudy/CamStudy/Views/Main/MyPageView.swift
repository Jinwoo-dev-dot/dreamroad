import SwiftUI

struct MyPageView: View {
    @EnvironmentObject private var session: UserSessionViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 8) {
                Text(session.profile?.nickname ?? "닉네임")
                    .font(.title2.bold())
                if let goal = session.profile?.goal, !goal.isEmpty {
                    Text("목표: \(goal)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Text("통계는 다음 단계에서 추가할게요.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.top, 8)
            }
            .navigationTitle("마이페이지")
        }
    }
}

#Preview {
    MyPageView()
        .environmentObject(UserSessionViewModel())
}
