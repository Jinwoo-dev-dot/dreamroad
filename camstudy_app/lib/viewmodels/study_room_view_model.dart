import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/chat_message.dart';
import '../models/study_room.dart';
import '../services/firestore_service.dart';

class StudyRoomViewModel extends ChangeNotifier {
  StudyRoom room;
  String? errorMessage;
  int elapsedSeconds = 0;
  List<ChatMessage> messages = [];
  String draftMessage = '';

  StreamSubscription<StudyRoom>? _roomSubscription;
  StreamSubscription<List<ChatMessage>>? _messagesSubscription;
  Timer? _timer;
  DateTime? _enteredAt;
  final _firestoreService = FirestoreService.shared;

  StudyRoomViewModel({required this.room});

  Future<void> enter({required String userId, required String nickname}) async {
    _enteredAt = DateTime.now();
    elapsedSeconds = 0;
    _startTimer();

    try {
      await _firestoreService.joinStudyRoom(
        roomId: room.id,
        userId: userId,
        nickname: nickname,
      );
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
    }

    _observeRoom();
    _observeMessages();
  }

  Future<void> sendMessage({
    required String senderId,
    required String senderNickname,
  }) async {
    final trimmed = draftMessage.trim();
    if (trimmed.isEmpty) return;
    draftMessage = '';
    notifyListeners();

    try {
      await _firestoreService.sendMessage(
        roomId: room.id,
        senderId: senderId,
        senderNickname: senderNickname,
        text: trimmed,
      );
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<void> leave(String userId) async {
    _stopTimer();
    await _saveSession(userId);

    try {
      await _firestoreService.leaveStudyRoom(roomId: room.id, userId: userId);
    } catch (e) {
      errorMessage = e.toString();
    }
  }

  void stopObserving() {
    _roomSubscription?.cancel();
    _roomSubscription = null;
    _messagesSubscription?.cancel();
    _messagesSubscription = null;
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      elapsedSeconds += 1;
      notifyListeners();
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _saveSession(String userId) async {
    final enteredAt = _enteredAt;
    if (enteredAt == null || elapsedSeconds <= 0) return;

    try {
      await _firestoreService.saveStudySession(
        userId: userId,
        roomId: room.id,
        roomName: room.name,
        startedAt: enteredAt,
        endedAt: DateTime.now(),
        durationSeconds: elapsedSeconds,
      );
      await _firestoreService.incrementTotalStudySeconds(
        userId: userId,
        seconds: elapsedSeconds,
      );
    } catch (e) {
      errorMessage = e.toString();
      notifyListeners();
    }
  }

  void _observeRoom() {
    _roomSubscription = _firestoreService
        .observeStudyRoom(room.id)
        .listen(
          (updatedRoom) {
            room = updatedRoom;
            notifyListeners();
          },
          onError: (Object error) {
            errorMessage = error.toString();
            notifyListeners();
          },
        );
  }

  void _observeMessages() {
    _messagesSubscription = _firestoreService
        .observeMessages(room.id)
        .listen(
          (updatedMessages) {
            messages = updatedMessages;
            notifyListeners();
          },
          onError: (Object error) {
            errorMessage = error.toString();
            notifyListeners();
          },
        );
  }

  @override
  void dispose() {
    _stopTimer();
    stopObserving();
    super.dispose();
  }
}
