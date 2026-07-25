import SwiftUI

struct MainTabView: View {
    @StateObject private var session = UserSessionViewModel()

    var body: some View {
        TabView {
            StudyRoomListView()
                .tabItem { Label("스터디룸", systemImage: "person.2.fill") }

            MyPageView()
                .tabItem { Label("마이페이지", systemImage: "person.crop.circle") }
        }
        .environmentObject(session)
        .onAppear { session.startObservingProfile() }
        .onDisappear { session.stopObservingProfile() }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthViewModel())
}
