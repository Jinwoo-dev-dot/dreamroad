import 'package:cloud_firestore/cloud_firestore.dart';

class StudySession {
  final String id;
  final String userId;
  final String roomId;
  final String roomName;
  final DateTime startedAt;
  final DateTime endedAt;
  final int durationSeconds;

  const StudySession({
    required this.id,
    required this.userId,
    required this.roomId,
    required this.roomName,
    required this.startedAt,
    required this.endedAt,
    required this.durationSeconds,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'roomId': roomId,
      'roomName': roomName,
      'startedAt': Timestamp.fromDate(startedAt),
      'endedAt': Timestamp.fromDate(endedAt),
      'durationSeconds': durationSeconds,
    };
  }

  factory StudySession.fromMap(String id, Map<String, dynamic> map) {
    return StudySession(
      id: id,
      userId: map['userId'] as String? ?? '',
      roomId: map['roomId'] as String? ?? '',
      roomName: map['roomName'] as String? ?? '',
      startedAt: (map['startedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      endedAt: (map['endedAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      durationSeconds: (map['durationSeconds'] as num?)?.toInt() ?? 0,
    );
  }
}
