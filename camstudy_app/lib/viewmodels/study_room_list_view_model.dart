import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/study_room.dart';
import '../services/firestore_service.dart';

class StudyRoomListViewModel extends ChangeNotifier {
  List<StudyRoom> rooms = [];
  String? errorMessage;

  StreamSubscription<List<StudyRoom>>? _subscription;
  final _firestoreService = FirestoreService.shared;

  void startObserving() {
    if (_subscription != null) return;
    _subscription = _firestoreService.observeStudyRooms().listen(
      (rooms) {
        this.rooms = rooms;
        notifyListeners();
      },
      onError: (Object error) {
        errorMessage = error.toString();
        notifyListeners();
      },
    );
  }

  void stopObserving() {
    _subscription?.cancel();
    _subscription = null;
  }

  @override
  void dispose() {
    stopObserving();
    super.dispose();
  }
}
