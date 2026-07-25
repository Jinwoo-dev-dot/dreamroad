import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/auth_view_model.dart';
import '../../viewmodels/focus_mode_view_model.dart';
import '../../viewmodels/statistics_view_model.dart';
import '../../viewmodels/user_session_view_model.dart';

class MyPageScreen extends StatefulWidget {
  const MyPageScreen({super.key});

  @override
  State<MyPageScreen> createState() => _MyPageScreenState();
}

class _MyPageScreenState extends State<MyPageScreen> {
  final _statisticsViewModel = StatisticsViewModel();
  bool _requested = false;

  @override
  void dispose() {
    _statisticsViewModel.dispose();
    super.dispose();
  }

  String _formattedDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    return '$hours시간 $minutes분';
  }

  Widget _profileHeader(UserSessionViewModel session) {
    final goal = session.profile?.goal;
    return Column(
      children: [
        Text(
          session.profile?.nickname ?? '닉네임',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        if (goal != null && goal.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              '목표: $goal',
              style: const TextStyle(color: Colors.grey),
            ),
          ),
      ],
    );
  }

  Widget _totalTimeCard(UserSessionViewModel session) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            '누적 공부 시간',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            _formattedDuration(session.profile?.totalStudySeconds ?? 0),
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            '오늘: ${_formattedDuration(_statisticsViewModel.todaySeconds)}',
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _weeklyChart() {
    final days = _statisticsViewModel.last7Days;
    final maxMinutes = days.fold<int>(
      1,
      (max, day) => (day.seconds ~/ 60) > max ? (day.seconds ~/ 60) : max,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('최근 7일', style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: BarChart(
            BarChartData(
              maxY: maxMinutes * 1.2,
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      final index = value.toInt();
                      if (index < 0 || index >= days.length) {
                        return const SizedBox.shrink();
                      }
                      final date = days[index].date;
                      return Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          '${date.month}/${date.day}',
                          style: const TextStyle(fontSize: 10),
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              gridData: const FlGridData(show: false),
              barGroups: List.generate(days.length, (index) {
                return BarChartGroupData(
                  x: index,
                  barRods: [
                    BarChartRodData(
                      toY: days[index].seconds / 60,
                      width: 16,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                );
              }),
            ),
          ),
        ),
      ],
    );
  }

  Widget _focusModeSection(FocusModeViewModel focusMode) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '공부 중 집중 모드',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: FocusModeViewModel.presetApps.map((app) {
              final selected = focusMode.selectedApps.contains(app);
              return FilterChip(
                label: Text(app),
                selected: selected,
                onSelected: (_) => focusMode.toggleApp(app),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          const Text(
            '스터디룸에 들어가 있는 동안 선택한 앱을 사용하지 않도록 안내 배너를 보여줘요. 실제로 앱을 차단하지는 않아요.',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authViewModel = context.read<AuthViewModel>();
    final session = context.watch<UserSessionViewModel>();
    final focusMode = context.watch<FocusModeViewModel>();

    final userId = session.userId;
    if (!_requested && userId != null) {
      _requested = true;
      _statisticsViewModel.loadSessions(userId);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('마이페이지'),
        actions: [
          TextButton(
            onPressed: authViewModel.signOut,
            child: const Text('로그아웃', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: _statisticsViewModel,
        builder: (context, _) => SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              _profileHeader(session),
              const SizedBox(height: 24),
              _totalTimeCard(session),
              const SizedBox(height: 24),
              _weeklyChart(),
              const SizedBox(height: 24),
              _focusModeSection(focusMode),
            ],
          ),
        ),
      ),
    );
  }
}
