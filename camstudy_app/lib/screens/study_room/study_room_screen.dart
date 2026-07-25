import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/chat_message.dart';
import '../../models/study_room.dart';
import '../../viewmodels/focus_mode_view_model.dart';
import '../../viewmodels/study_room_view_model.dart';
import '../../viewmodels/user_session_view_model.dart';

class StudyRoomScreen extends StatefulWidget {
  final StudyRoom room;

  const StudyRoomScreen({super.key, required this.room});

  @override
  State<StudyRoomScreen> createState() => _StudyRoomScreenState();
}

class _StudyRoomScreenState extends State<StudyRoomScreen> {
  late final StudyRoomViewModel _viewModel;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _viewModel = StudyRoomViewModel(room: widget.room);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final session = context.read<UserSessionViewModel>();
      final focusMode = context.read<FocusModeViewModel>();
      final userId = session.userId;
      if (userId != null) {
        _viewModel.enter(
          userId: userId,
          nickname: session.profile?.nickname ?? '익명',
        );
      }
      focusMode.start();
    });
  }

  @override
  void dispose() {
    final session = context.read<UserSessionViewModel>();
    final userId = session.userId;
    if (userId != null) {
      _viewModel.leave(userId);
    }
    _viewModel.stopObserving();
    _viewModel.dispose();
    context.read<FocusModeViewModel>().stop();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
  }

  void _sendMessage(UserSessionViewModel session) {
    final userId = session.userId;
    if (userId == null) return;
    _viewModel.sendMessage(
      senderId: userId,
      senderNickname: session.profile?.nickname ?? '익명',
    );
    _messageController.clear();
  }

  String _formattedElapsed(int totalSeconds) {
    final hours = (totalSeconds ~/ 3600).toString().padLeft(2, '0');
    final minutes = ((totalSeconds % 3600) ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<UserSessionViewModel>();
    final focusMode = context.watch<FocusModeViewModel>();

    return Scaffold(
      appBar: AppBar(title: Text(_viewModel.room.name)),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          WidgetsBinding.instance.addPostFrameCallback(
            (_) => _scrollToBottom(),
          );
          return Column(
            children: [
              const SizedBox(height: 8),
              Text(
                _formattedElapsed(_viewModel.elapsedSeconds),
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (focusMode.isActive && focusMode.hasSelection) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.orange.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '집중 모드: ${focusMode.selectedApps.join(", ")} 사용을 자제해보세요',
                    style: const TextStyle(color: Colors.orange, fontSize: 12),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: _viewModel.room.participantNicknames.values
                      .map(
                        (nickname) => Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Chip(label: Text(nickname)),
                        ),
                      )
                      .toList(),
                ),
              ),
              const Divider(height: 24),
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _viewModel.messages.length,
                  itemBuilder: (context, index) {
                    final message = _viewModel.messages[index];
                    return _ChatBubble(
                      message: message,
                      isMine: message.senderId == session.userId,
                    );
                  },
                ),
              ),
              if (_viewModel.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    _viewModel.errorMessage!,
                    style: const TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          hintText: '메시지 입력',
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) => _viewModel.draftMessage = value,
                        onSubmitted: (_) => _sendMessage(session),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.send),
                      onPressed: _viewModel.draftMessage.trim().isEmpty
                          ? null
                          : () => _sendMessage(session),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12, left: 12, right: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('나가기'),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMine;

  const _ChatBubble({required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMine
              ? Theme.of(context).colorScheme.primary
              : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: isMine
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            if (!isMine)
              Text(
                message.senderNickname,
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
            Text(
              message.text,
              style: TextStyle(color: isMine ? Colors.white : Colors.black87),
            ),
          ],
        ),
      ),
    );
  }
}
