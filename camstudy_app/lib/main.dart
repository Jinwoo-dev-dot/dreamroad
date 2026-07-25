import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'screens/main/root_screen.dart';
import 'viewmodels/auth_view_model.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const CamStudyApp());
}

class CamStudyApp extends StatelessWidget {
  const CamStudyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthViewModel(),
      child: MaterialApp(
        title: '캠스터디',
        theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
        home: const RootScreen(),
      ),
    );
  }
}
