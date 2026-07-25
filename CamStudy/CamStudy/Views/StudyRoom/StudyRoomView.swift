import SwiftUI

struct StudyRoomView: View {
    @EnvironmentObject private var session: UserSessionViewModel
    @StateObject private var viewModel: StudyRoomViewModel
    @Environment(\.dismiss) private var dismiss

    init(room: StudyRoom) {
        _viewModel = StateObject(wrappedValue: StudyRoomViewModel(room: room))
    }

    var body: some View {
        VStack(spacing: 20) {
            Text(viewModel.room.name)
                .font(.title2.bold())

            List(sortedParticipants, id: \.self) { nickname in
                Text(nickname)
            }
            .listStyle(.plain)

            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button(role: .destructive) {
                dismiss()
            } label: {
                Text("나가기")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .padding(.horizontal)
        }
        .padding(.top, 24)
        .navigationTitle("스터디룸")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard let userId = session.userId else { return }
            viewModel.enter(userId: userId, nickname: session.profile?.nickname ?? "익명")
        }
        .onDisappear {
            if let userId = session.userId {
                viewModel.leave(userId: userId)
            }
            viewModel.stopObserving()
        }
    }

    private var sortedParticipants: [String] {
        viewModel.room.participantNicknames.values.sorted()
    }
}

#Preview {
    NavigationStack {
        StudyRoomView(room: StudyRoom(
            id: "preview",
            name: "미리보기 스터디룸",
            hostId: "host",
            hostNickname: "호스트",
            maxParticipants: 6,
            participantIds: ["host"],
            participantNicknames: ["host": "호스트"],
            createdAt: Date(),
            isActive: true
        ))
    }
    .environmentObject(UserSessionViewModel())
}
