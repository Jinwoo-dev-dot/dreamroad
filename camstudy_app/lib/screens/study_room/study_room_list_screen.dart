import 'package:flutter/material.dart';

import '../../viewmodels/study_room_list_view_model.dart';
import 'create_study_room_screen.dart';
import 'study_room_screen.dart';

class StudyRoomListScreen extends StatefulWidget {
  const StudyRoomListScreen({super.key});

  @override
  State<StudyRoomListScreen> createState() => _StudyRoomListScreenState();
}

class _StudyRoomListScreenState extends State<StudyRoomListScreen> {
  final _viewModel = StudyRoomListViewModel();

  @override
  void initState() {
    super.initState();
    _viewModel.startObserving();
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('스터디룸'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CreateStudyRoomScreen()),
            ),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.errorMessage != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!mounted || _viewModel.errorMessage == null) return;
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(_viewModel.errorMessage!)));
              _viewModel.errorMessage = null;
            });
          }
          if (_viewModel.rooms.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.group_off, size: 40, color: Colors.grey),
                    SizedBox(height: 12),
                    Text(
                      '열려있는 스터디룸이 없어요',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '새 스터디룸을 만들어보세요',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            );
          }
          return ListView.builder(
            itemCount: _viewModel.rooms.length,
            itemBuilder: (context, index) {
              final room = _viewModel.rooms[index];
              return ListTile(
                title: Text(room.name),
                subtitle: Text('방장: ${room.hostNickname}'),
                trailing: Text(
                  '${room.participantCount}/${room.maxParticipants}',
                  style: TextStyle(
                    color: room.isFull ? Colors.red : Colors.grey,
                  ),
                ),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => StudyRoomScreen(room: room),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
