import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/create_study_room_view_model.dart';
import '../../viewmodels/user_session_view_model.dart';

class CreateStudyRoomScreen extends StatefulWidget {
  const CreateStudyRoomScreen({super.key});

  @override
  State<CreateStudyRoomScreen> createState() => _CreateStudyRoomScreenState();
}

class _CreateStudyRoomScreenState extends State<CreateStudyRoomScreen> {
  final _viewModel = CreateStudyRoomViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final session = context.read<UserSessionViewModel>();
    final userId = session.userId;
    if (userId == null) return;
    await _viewModel.createRoom(
      hostId: userId,
      hostNickname: session.profile?.nickname ?? '익명',
    );
    if (_viewModel.createdRoom != null && mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('스터디룸 만들기'),
        actions: [
          ListenableBuilder(
            listenable: _viewModel,
            builder: (context, _) => TextButton(
              onPressed: _viewModel.isLoading ? null : _submit,
              child: Text(_viewModel.isLoading ? '생성 중...' : '만들기'),
            ),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                decoration: const InputDecoration(
                  labelText: '방 이름',
                  border: OutlineInputBorder(),
                ),
                onChanged: (value) => _viewModel.name = value,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('최대 인원'),
                  const Spacer(),
                  IconButton(
                    onPressed: _viewModel.maxParticipants > 2
                        ? () => _viewModel.setMaxParticipants(
                            _viewModel.maxParticipants - 1,
                          )
                        : null,
                    icon: const Icon(Icons.remove_circle_outline),
                  ),
                  Text('${_viewModel.maxParticipants}명'),
                  IconButton(
                    onPressed: _viewModel.maxParticipants < 20
                        ? () => _viewModel.setMaxParticipants(
                            _viewModel.maxParticipants + 1,
                          )
                        : null,
                    icon: const Icon(Icons.add_circle_outline),
                  ),
                ],
              ),
              if (_viewModel.errorMessage != null) ...[
                const SizedBox(height: 12),
                Text(
                  _viewModel.errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
