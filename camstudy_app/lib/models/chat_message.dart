import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String senderNickname;
  final String text;
  final DateTime sentAt;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderNickname,
    required this.text,
    required this.sentAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'senderNickname': senderNickname,
      'text': text,
      'sentAt': Timestamp.fromDate(sentAt),
    };
  }

  factory ChatMessage.fromMap(String id, Map<String, dynamic> map) {
    return ChatMessage(
      id: id,
      senderId: map['senderId'] as String? ?? '',
      senderNickname: map['senderNickname'] as String? ?? '',
      text: map['text'] as String? ?? '',
      sentAt: (map['sentAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }
}
