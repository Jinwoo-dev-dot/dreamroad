import 'package:cloud_firestore/cloud_firestore.dart';

class UserProfile {
  final String id;
  final String nickname;
  final String goal;
  final String? email;
  final String? phoneNumber;
  final bool isPhoneVerified;
  final int totalStudySeconds;
  final DateTime createdAt;

  const UserProfile({
    required this.id,
    required this.nickname,
    required this.goal,
    this.email,
    this.phoneNumber,
    required this.isPhoneVerified,
    required this.totalStudySeconds,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'nickname': nickname,
      'goal': goal,
      'email': email,
      'phoneNumber': phoneNumber,
      'isPhoneVerified': isPhoneVerified,
      'totalStudySeconds': totalStudySeconds,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  factory UserProfile.fromMap(String id, Map<String, dynamic> map) {
    return UserProfile(
      id: id,
      nickname: map['nickname'] as String? ?? '',
      goal: map['goal'] as String? ?? '',
      email: map['email'] as String?,
      phoneNumber: map['phoneNumber'] as String?,
      isPhoneVerified: map['isPhoneVerified'] as bool? ?? false,
      totalStudySeconds: (map['totalStudySeconds'] as num?)?.toInt() ?? 0,
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
