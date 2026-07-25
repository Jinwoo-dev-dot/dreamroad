import SwiftUI

struct StudyRoomView: View {
    @EnvironmentObject private var session: UserSessionViewModel
    @EnvironmentObject private var appBlocking: AppBlockingViewModel
    @StateObject private var viewModel: StudyRoomViewModel
    @Environment(\.dismiss) private var dismiss

    init(room: StudyRoom) {
        _viewModel = StateObject(wrappedValue: StudyRoomViewModel(room: room))
    }

    var body: some View {
        VStack(spacing: 12) {
            Text(viewModel.room.name)
                .font(.title2.bold())

            Text(formattedElapsed)
                .font(.system(size: 36, weight: .bold, design: .monospaced))

            if appBlocking.isBlocking {
                Label("앱 잠금 중", systemImage: "lock.fill")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }

            participantsRow

            Divider()

            messagesList

            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            messageInputBar

            Button(role: .destructive) {
                dismiss()
            } label: {
                Text("나가기")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .padding(.horizontal)
        }
        .padding(.top, 16)
        .navigationTitle("스터디룸")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard let userId = session.userId else { return }
            viewModel.enter(userId: userId, nickname: session.profile?.nickname ?? "익명")
            appBlocking.startBlocking()
        }
        .onDisappear {
            if let userId = session.userId {
                viewModel.leave(userId: userId)
            }
            viewModel.stopObserving()
            appBlocking.stopBlocking()
        }
    }

    private var participantsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(sortedParticipants, id: \.self) { nickname in
                    Text(nickname)
                        .font(.caption)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(.thinMaterial, in: Capsule())
                }
            }
            .padding(.horizontal)
        }
    }

    private var messagesList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 8) {
                    ForEach(viewModel.messages) { message in
                        ChatBubble(message: message, isMine: message.senderId == session.userId)
                            .id(message.id)
                    }
                }
                .padding(.horizontal)
            }
            .onChange(of: viewModel.messages.count) { _ in
                if let lastId = viewModel.messages.last?.id {
                    withAnimation {
                        proxy.scrollTo(lastId, anchor: .bottom)
                    }
                }
            }
        }
    }

    private var messageInputBar: some View {
        HStack {
            TextField("메시지 입력", text: $viewModel.draftMessage)
                .textFieldStyle(.roundedBorder)

            Button {
                sendMessage()
            } label: {
                Image(systemName: "paperplane.fill")
            }
            .disabled(viewModel.draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.horizontal)
    }

    private func sendMessage() {
        guard let userId = session.userId else { return }
        viewModel.sendMessage(senderId: userId, senderNickname: session.profile?.nickname ?? "익명")
    }

    private var sortedParticipants: [String] {
        viewModel.room.participantNicknames.values.sorted()
    }

    private var formattedElapsed: String {
        let hours = viewModel.elapsedSeconds / 3600
        let minutes = (viewModel.elapsedSeconds % 3600) / 60
        let seconds = viewModel.elapsedSeconds % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }
}

private struct ChatBubble: View {
    let message: ChatMessage
    let isMine: Bool

    var body: some View {
        VStack(alignment: isMine ? .trailing : .leading, spacing: 2) {
            if !isMine {
                Text(message.senderNickname)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text(message.text)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    isMine ? Color.accentColor : Color.secondary.opacity(0.15),
                    in: RoundedRectangle(cornerRadius: 14)
                )
                .foregroundStyle(isMine ? Color.white : Color.primary)
        }
        .frame(maxWidth: .infinity, alignment: isMine ? .trailing : .leading)
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
    .environmentObject(AppBlockingViewModel())
}
