import FamilyControls
import Foundation

@MainActor
final class AppBlockingViewModel: ObservableObject {
    @Published var selection = FamilyActivitySelection()
    @Published var isAuthorized = false
    @Published var isBlocking = false
    @Published var errorMessage: String?

    private let service = AppBlockingService.shared
    private let defaultsKey = "appBlockingSelection"

    init() {
        loadSelection()
        isAuthorized = service.isAuthorized
    }

    var hasSelection: Bool {
        !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty
    }

    func requestAuthorization() {
        Task {
            do {
                try await service.requestAuthorization()
                isAuthorized = service.isAuthorized
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func saveSelection() {
        guard let data = try? JSONEncoder().encode(selection) else { return }
        UserDefaults.standard.set(data, forKey: defaultsKey)
    }

    func startBlocking() {
        guard isAuthorized, hasSelection else { return }
        service.startBlocking(selection: selection)
        isBlocking = true
    }

    func stopBlocking() {
        guard isBlocking else { return }
        service.stopBlocking()
        isBlocking = false
    }

    private func loadSelection() {
        guard
            let data = UserDefaults.standard.data(forKey: defaultsKey),
            let decoded = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
        else { return }
        selection = decoded
    }
}
