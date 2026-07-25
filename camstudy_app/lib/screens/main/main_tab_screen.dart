import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodels/focus_mode_view_model.dart';
import '../../viewmodels/user_session_view_model.dart';
import '../goal_mates/goal_mates_screen.dart';
import '../study_room/study_room_list_screen.dart';
import 'my_page_screen.dart';

class MainTabScreen extends StatefulWidget {
  const MainTabScreen({super.key});

  @override
  State<MainTabScreen> createState() => _MainTabScreenState();
}

class _MainTabScreenState extends State<MainTabScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => UserSessionViewModel()..startObservingProfile(),
        ),
        ChangeNotifierProvider(create: (_) => FocusModeViewModel()),
      ],
      child: Scaffold(
        body: IndexedStack(
          index: _selectedIndex,
          children: const [
            StudyRoomListScreen(),
            GoalMatesScreen(),
            MyPageScreen(),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) =>
              setState(() => _selectedIndex = index),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.groups), label: '스터디룸'),
            NavigationDestination(icon: Icon(Icons.school), label: '목표메이트'),
            NavigationDestination(icon: Icon(Icons.person), label: '마이페이지'),
          ],
        ),
      ),
    );
  }
}
