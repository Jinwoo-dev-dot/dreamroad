import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';

class UserSessionViewModel extends ChangeNotifier {
  UserProfile? profile;
  String? errorMessage;

  StreamSubscription<UserProfile>? _subscription;
  final _firestoreService = FirestoreService.shared;

  String? get userId => AuthService.shared.currentUser?.uid;

  void startObservingProfile() {
    final id = userId;
    if (id == null || _subscription != null) return;
    _subscription = _firestoreService
        .observeProfile(id)
        .listen(
          (profile) {
            this.profile = profile;
            notifyListeners();
          },
          onError: (Object error) {
            errorMessage = error.toString();
            notifyListeners();
          },
        );
  }

  void stopObservingProfile() {
    _subscription?.cancel();
    _subscription = null;
  }

  @override
  void dispose() {
    stopObservingProfile();
    super.dispose();
  }
}
