import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/chat_message.dart';
import '../models/study_room.dart';
import '../models/study_session.dart';
import '../models/user_profile.dart';

class FirestoreService {
  FirestoreService._();
  static final FirestoreService shared = FirestoreService._();

  // A getter (not a field initializer) so constructing FirestoreService — which happens
  // eagerly via the `shared` singleton — never touches Firebase before it's initialized.
  FirebaseFirestore get _db => FirebaseFirestore.instance;

  static const _usersCollection = 'users';
  static const _studyRoomsCollection = 'studyRooms';
  static const _studySessionsCollection = 'studySessions';

  Future<void> createProfile(UserProfile profile) {
    return _db
        .collection(_usersCollection)
        .doc(profile.id)
        .set(profile.toMap());
  }

  Future<void> updatePhoneVerified({
    required String userId,
    required String phoneNumber,
  }) {
    return _db.collection(_usersCollection).doc(userId).update({
      'phoneNumber': phoneNumber,
      'isPhoneVerified': true,
    });
  }

  Stream<UserProfile> observeProfile(String userId) {
    return _db.collection(_usersCollection).doc(userId).snapshots().map((doc) {
      final data = doc.data();
      if (!doc.exists || data == null) {
        throw Exception('프로필을 찾을 수 없습니다.');
      }
      return UserProfile.fromMap(doc.id, data);
    });
  }

  /// Users sharing the same [goal], excluding the caller. Self-exclusion happens
  /// client-side to avoid needing a composite index for an inequality filter.
  Future<List<UserProfile>> fetchGoalMates({
    required String goal,
    required String excludingUserId,
  }) async {
    if (goal.trim().isEmpty) return [];
    final snapshot = await _db
        .collection(_usersCollection)
        .where('goal', isEqualTo: goal)
        .get();
    return snapshot.docs
        .map((doc) => UserProfile.fromMap(doc.id, doc.data()))
        .where((profile) => profile.id != excludingUserId)
        .toList();
  }

  /// Open study rooms, sorted newest first. Sorted client-side to avoid requiring a
  /// composite index for `isActive == true` + `orderBy(createdAt)`.
  Stream<List<StudyRoom>> observeStudyRooms() {
    return _db
        .collection(_studyRoomsCollection)
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
          final rooms = snapshot.docs
              .map((doc) => StudyRoom.fromMap(doc.id, doc.data()))
              .toList();
          rooms.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          return rooms;
        });
  }

  Stream<StudyRoom> observeStudyRoom(String roomId) {
    return _db.collection(_studyRoomsCollection).doc(roomId).snapshots().map((
      doc,
    ) {
      final data = doc.data();
      if (!doc.exists || data == null) {
        throw Exception('방을 찾을 수 없습니다.');
      }
      return StudyRoom.fromMap(doc.id, data);
    });
  }

  Future<StudyRoom> createStudyRoom({
    required String name,
    required String hostId,
    required String hostNickname,
    required int maxParticipants,
  }) async {
    final docRef = _db.collection(_studyRoomsCollection).doc();
    final room = StudyRoom(
      id: docRef.id,
      name: name,
      hostId: hostId,
      hostNickname: hostNickname,
      maxParticipants: maxParticipants,
      participantIds: [hostId],
      participantNicknames: {hostId: hostNickname},
      createdAt: DateTime.now(),
      isActive: true,
    );
    await docRef.set(room.toMap());
    return room;
  }

  Future<void> joinStudyRoom({
    required String roomId,
    required String userId,
    required String nickname,
  }) {
    return _db.collection(_studyRoomsCollection).doc(roomId).update({
      'participantIds': FieldValue.arrayUnion([userId]),
      'participantNicknames.$userId': nickname,
    });
  }

  Future<void> leaveStudyRoom({
    required String roomId,
    required String userId,
  }) {
    return _db.collection(_studyRoomsCollection).doc(roomId).update({
      'participantIds': FieldValue.arrayRemove([userId]),
      'participantNicknames.$userId': FieldValue.delete(),
    });
  }

  Future<void> saveStudySession({
    required String userId,
    required String roomId,
    required String roomName,
    required DateTime startedAt,
    required DateTime endedAt,
    required int durationSeconds,
  }) {
    final docRef = _db.collection(_studySessionsCollection).doc();
    final session = StudySession(
      id: docRef.id,
      userId: userId,
      roomId: roomId,
      roomName: roomName,
      startedAt: startedAt,
      endedAt: endedAt,
      durationSeconds: durationSeconds,
    );
    return docRef.set(session.toMap());
  }

  Future<void> incrementTotalStudySeconds({
    required String userId,
    required int seconds,
  }) {
    return _db.collection(_usersCollection).doc(userId).update({
      'totalStudySeconds': FieldValue.increment(seconds),
    });
  }

  /// All sessions for a user, sorted newest first client-side (avoids requiring a
  /// composite index for `userId == ...` + `orderBy(startedAt)`).
  Future<List<StudySession>> fetchStudySessions(String userId) async {
    final snapshot = await _db
        .collection(_studySessionsCollection)
        .where('userId', isEqualTo: userId)
        .get();
    final sessions = snapshot.docs
        .map((doc) => StudySession.fromMap(doc.id, doc.data()))
        .toList();
    sessions.sort((a, b) => b.startedAt.compareTo(a.startedAt));
    return sessions;
  }

  CollectionReference<Map<String, dynamic>> _messagesCollection(String roomId) {
    return _db
        .collection(_studyRoomsCollection)
        .doc(roomId)
        .collection('messages');
  }

  Stream<List<ChatMessage>> observeMessages(String roomId) {
    return _messagesCollection(roomId).snapshots().map((snapshot) {
      final messages = snapshot.docs
          .map((doc) => ChatMessage.fromMap(doc.id, doc.data()))
          .toList();
      messages.sort((a, b) => a.sentAt.compareTo(b.sentAt));
      return messages;
    });
  }

  Future<void> sendMessage({
    required String roomId,
    required String senderId,
    required String senderNickname,
    required String text,
  }) {
    final docRef = _messagesCollection(roomId).doc();
    final message = ChatMessage(
      id: docRef.id,
      senderId: senderId,
      senderNickname: senderNickname,
      text: text,
      sentAt: DateTime.now(),
    );
    return docRef.set(message.toMap());
  }
}
