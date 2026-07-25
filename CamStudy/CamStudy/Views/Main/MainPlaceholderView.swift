import SwiftUI

struct MainPlaceholderView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.green)
            Text("로그인 완료!")
                .font(.title2.bold())
            Text("다음 단계에서 스터디룸 기능을 구현할게요.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    MainPlaceholderView()
}
