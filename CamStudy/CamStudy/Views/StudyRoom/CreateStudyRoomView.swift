import SwiftUI

struct CreateStudyRoomView: View {
    @EnvironmentObject private var session: UserSessionViewModel
    @StateObject private var viewModel = CreateStudyRoomViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("방 정보") {
                    TextField("방 이름", text: $viewModel.name)
                    Stepper("최대 인원: \(viewModel.maxParticipants)명", value: $viewModel.maxParticipants, in: 2...20)
                }

                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
            .navigationTitle("스터디룸 만들기")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("취소") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(viewModel.isLoading ? "생성 중..." : "만들기") {
                        guard let userId = session.userId else { return }
                        viewModel.createRoom(hostId: userId, hostNickname: session.profile?.nickname ?? "익명")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .onChange(of: viewModel.createdRoom?.id) { newValue in
                if newValue != nil { dismiss() }
            }
        }
    }
}

#Preview {
    CreateStudyRoomView()
        .environmentObject(UserSessionViewModel())
}
