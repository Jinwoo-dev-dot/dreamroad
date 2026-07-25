import 'package:flutter/foundation.dart';

import '../models/study_room.dart';
import '../services/firestore_service.dart';

class CreateStudyRoomViewModel extends ChangeNotifier {
  String name = '';
  int maxParticipants = 6;
  bool isLoading = false;
  String? errorMessage;
  StudyRoom? createdRoom;

  final _firestoreService = FirestoreService.shared;

  void setMaxParticipants(int value) {
    maxParticipants = value;
    notifyListeners();
  }

  Future<void> createRoom({
    required String hostId,
    required String hostNickname,
  }) async {
    if (name.trim().isEmpty) {
      errorMessage = '방 이름을 입력해주세요.';
      notifyListeners();
      return;
    }
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      createdRoom = await _firestoreService.createStudyRoom(
        name: name,
        hostId: hostId,
        hostNickname: hostNickname,
        maxParticipants: maxParticipants,
      );
    } catch (e) {
      errorMessage = e.toString();
    }
    isLoading = false;
    notifyListeners();
  }
}
