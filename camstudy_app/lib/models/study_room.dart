import 'package:cloud_firestore/cloud_firestore.dart';

class StudyRoom {
  final String id;
  final String name;
  final String hostId;
  final String hostNickname;
  final int maxParticipants;
  final List<String> participantIds;
  final Map<String, String> participantNicknames;
  final DateTime createdAt;
  final bool isActive;

  const StudyRoom({
    required this.id,
    required this.name,
    required this.hostId,
    required this.hostNickname,
    required this.maxParticipants,
    required this.participantIds,
    required this.participantNicknames,
    required this.createdAt,
    required this.isActive,
  });

  int get participantCount => participantIds.length;
  bool get isFull => participantCount >= maxParticipants;

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'hostId': hostId,
      'hostNickname': hostNickname,
      'maxParticipants': maxParticipants,
      'participantIds': participantIds,
      'participantNicknames': participantNicknames,
      'createdAt': Timestamp.fromDate(createdAt),
      'isActive': isActive,
    };
  }

  factory StudyRoom.fromMap(String id, Map<String, dynamic> map) {
    return StudyRoom(
      id: id,
      name: map['name'] as String? ?? '',
      hostId: map['hostId'] as String? ?? '',
      hostNickname: map['hostNickname'] as String? ?? '',
      maxParticipants: (map['maxParticipants'] as num?)?.toInt() ?? 0,
      participantIds: (map['participantIds'] as List<dynamic>? ?? [])
          .map((e) => e as String)
          .toList(),
      participantNicknames: Map<String, String>.from(
        (map['participantNicknames'] as Map<dynamic, dynamic>? ?? {}),
      ),
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      isActive: map['isActive'] as bool? ?? false,
    );
  }
}
