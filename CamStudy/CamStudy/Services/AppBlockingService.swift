import FamilyControls
import ManagedSettings

/// Wraps Apple's Screen Time APIs (FamilyControls + ManagedSettings) to shield chosen
/// apps/categories while a study session is active. Requires the com.apple.developer.family-controls
/// entitlement, which Apple must separately approve, and only works on a physical device.
final class AppBlockingService {
    static let shared = AppBlockingService()

    private let store = ManagedSettingsStore()

    private init() {}

    var isAuthorized: Bool {
        AuthorizationCenter.shared.authorizationStatus == .approved
    }

    func requestAuthorization() async throws {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
    }

    func startBlocking(selection: FamilyActivitySelection) {
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? nil
            : .specific(selection.categoryTokens)
    }

    func stopBlocking() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
    }
}
