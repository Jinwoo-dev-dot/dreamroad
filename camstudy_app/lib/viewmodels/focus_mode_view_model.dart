import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Soft "focus mode": lets the user pick apps to avoid while studying and shows a
/// reminder banner during a study session. This does NOT enforce anything at the OS
/// level (unlike the iOS-only Screen Time integration in the original Swift app) — it
/// works the same, non-enforced way on every platform including Windows.
class FocusModeViewModel extends ChangeNotifier {
  static const presetApps = ['유튜브', '인스타그램', '게임'];
  static const _prefsKey = 'focusModeSelectedApps';

  Set<String> selectedApps = {};
  bool isActive = false;

  FocusModeViewModel() {
    _loadSelection();
  }

  bool get hasSelection => selectedApps.isNotEmpty;

  void toggleApp(String app) {
    if (selectedApps.contains(app)) {
      selectedApps.remove(app);
    } else {
      selectedApps.add(app);
    }
    notifyListeners();
    _saveSelection();
  }

  void start() {
    if (!hasSelection) return;
    isActive = true;
    notifyListeners();
  }

  void stop() {
    isActive = false;
    notifyListeners();
  }

  Future<void> _loadSelection() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_prefsKey);
    if (saved != null) {
      selectedApps = saved.toSet();
      notifyListeners();
    }
  }

  Future<void> _saveSelection() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefsKey, selectedApps.toList());
  }
}
