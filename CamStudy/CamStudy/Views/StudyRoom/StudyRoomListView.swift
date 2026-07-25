import SwiftUI

struct StudyRoomListView: View {
    @StateObject private var viewModel = StudyRoomListViewModel()
    @State private var isPresentingCreateRoom = false

    private var errorAlertBinding: Binding<Bool> {
        Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.rooms.isEmpty {
                    emptyState
                } else {
                    List(viewModel.rooms) { room in
                        NavigationLink {
                            StudyRoomView(room: room)
                        } label: {
                            StudyRoomRow(room: room)
                        }
                    }
                }
            }
            .navigationTitle("스터디룸")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingCreateRoom = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $isPresentingCreateRoom) {
                CreateStudyRoomView()
            }
            .onAppear { viewModel.startObserving() }
            .onDisappear { viewModel.stopObserving() }
            .alert("오류", isPresented: errorAlertBinding) {
                Button("확인", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.2.slash")
                .font(.system(size: 40))
                .foregroundStyle(.secondary)
            Text("열려있는 스터디룸이 없어요")
                .font(.headline)
            Text("새 스터디룸을 만들어보세요")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct StudyRoomRow: View {
    let room: StudyRoom

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(room.name)
                    .font(.headline)
                Text("방장: \(room.hostNickname)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(room.participantCount)/\(room.maxParticipants)")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(room.isFull ? .red : .secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    StudyRoomListView()
        .environmentObject(UserSessionViewModel())
}
