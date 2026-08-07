import 'package:flutter/foundation.dart';

import '../models/user_profile.dart';
import '../services/firestore_service.dart';

class GoalMatesViewModel extends ChangeNotifier {
  List<UserProfile> mates = [];
  String? errorMessage;
  bool isLoading = false;

  final _firestoreService = FirestoreService.shared;

  Future<void> loadMates({
    required String goal,
    required String excludingUserId,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      mates = await _firestoreService.fetchGoalMates(
        goal: goal,
        excludingUserId: excludingUserId,
      );
    } catch (e) {
      errorMessage = e.toString();
    }
    isLoading = false;
    notifyListeners();
  }
}
