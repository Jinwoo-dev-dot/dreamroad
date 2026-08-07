import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/goal_mates_view_model.dart';
import '../../viewmodels/user_session_view_model.dart';

class GoalMatesScreen extends StatefulWidget {
  const GoalMatesScreen({super.key});

  @override
  State<GoalMatesScreen> createState() => _GoalMatesScreenState();
}

class _GoalMatesScreenState extends State<GoalMatesScreen> {
  final _viewModel = GoalMatesViewModel();
  bool _requested = false;

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<UserSessionViewModel>();
    final goal = session.profile?.goal;
    final userId = session.userId;

    if (!_requested && goal != null && goal.isNotEmpty && userId != null) {
      _requested = true;
      _viewModel.loadMates(goal: goal, excludingUserId: userId);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('목표메이트')),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) => _buildBody(goal),
      ),
    );
  }

  Widget _buildBody(String? goal) {
    if (goal == null || goal.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            '프로필에 목표를 설정하면 같은 목표를 가진 사용자를 볼 수 있어요',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }
    if (_viewModel.mates.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            '"$goal"을(를) 목표로 하는 다른 사용자가 아직 없어요',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.grey),
          ),
        ),
      );
    }
    return ListView.builder(
      itemCount: _viewModel.mates.length,
      itemBuilder: (context, index) {
        final mate = _viewModel.mates[index];
        return ListTile(title: Text(mate.nickname), subtitle: Text(mate.goal));
      },
    );
  }
}
