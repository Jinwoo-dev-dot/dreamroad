import 'package:flutter/foundation.dart';

import '../models/study_session.dart';
import '../services/firestore_service.dart';

class DailyStudyTotal {
  final DateTime date;
  final int seconds;

  const DailyStudyTotal({required this.date, required this.seconds});
}

class StatisticsViewModel extends ChangeNotifier {
  List<StudySession> sessions = [];
  String? errorMessage;
  bool isLoading = false;

  final _firestoreService = FirestoreService.shared;

  Future<void> loadSessions(String userId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      sessions = await _firestoreService.fetchStudySessions(userId);
    } catch (e) {
      errorMessage = e.toString();
    }
    isLoading = false;
    notifyListeners();
  }

  int get todaySeconds {
    final now = DateTime.now();
    return sessions
        .where((session) => _isSameDay(session.startedAt, now))
        .fold(0, (sum, session) => sum + session.durationSeconds);
  }

  List<DailyStudyTotal> get last7Days {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return List.generate(7, (index) {
      final day = today.subtract(Duration(days: 6 - index));
      final seconds = sessions
          .where((session) => _isSameDay(session.startedAt, day))
          .fold(0, (sum, session) => sum + session.durationSeconds);
      return DailyStudyTotal(date: day, seconds: seconds);
    });
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
