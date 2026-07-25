# CamStudy (Flutter)

`CamStudy/`(SwiftUI, iOS 전용, Xcode 필요)와 별개로 만든 **크로스플랫폼** 버전입니다. 하나의 코드베이스로 Windows 데스크톱 앱과 iOS/Android 앱을 만듭니다. 개발 도구로 Xcode는 필요 없고, VS Code나 Android Studio 등에서 작업할 수 있습니다.

## 지금까지 구현된 것

- 로그인 / 회원가입(닉네임·목표 프로필 생성) / 전화번호 SMS 인증 (Firebase Auth)
- 목표메이트: 같은 목표(goal)를 가진 사용자 목록
- 스터디룸 목록·생성·입장, 실시간 참여자 목록, 텍스트 채팅 (Firestore)
- 공부 타이머: 방에 있는 동안 시간 측정, 나가면 기록 저장 + 누적 시간 갱신
- 마이페이지: 누적/오늘 공부 시간, 최근 7일 차트(fl_chart), 로그아웃
- 집중 모드: 유튜브/인스타그램/게임 등 원하는 항목을 고르면 스터디룸에 있는 동안 안내 배너를 보여줌. **실제로 앱을 차단하지는 않습니다** (모든 플랫폼 동일, 강제 없음). iOS에만 있는 진짜 차단 기능은 `CamStudy/`(Swift, Family Controls)에만 있습니다.

## 왜 Flutter인가

"앱 자체가 윈도우 PC에서도 실행돼야 한다"는 요구사항 때문에 SwiftUI를 버리고 Flutter로 다시 만들었습니다. Flutter는 하나의 코드베이스로 `flutter build windows`(진짜 설치되는 .exe), `flutter build ios`, `flutter build apk`를 모두 만들 수 있습니다. 개발/테스트 대부분은 Windows PC에서 할 수 있고, iOS용 최종 빌드·배포 단계만 Mac(또는 Codemagic 같은 클라우드 Mac 서비스)이 한 번 필요합니다.

## 시작하기

### 1. Flutter SDK 설치 (Windows)

https://docs.flutter.dev/get-started/install/windows 안내대로 설치하고, `flutter doctor`로 확인하세요. Windows 데스크톱 빌드는 Visual Studio("Desktop development with C++" workload)가 추가로 필요합니다.

```powershell
flutter config --enable-windows-desktop
```

### 2. 의존성 설치

```bash
cd camstudy_app
flutter pub get
```

### 3. Firebase 프로젝트 연결 (필수)

이 저장소의 `lib/firebase_options.dart`는 **가짜 값이 들어있는 placeholder**입니다 (분석/빌드 도구가 바로 동작하도록 커밋해둔 것). 실제로 앱을 실행하려면:

1. https://console.firebase.google.com 에서 프로젝트 생성
2. Authentication → 이메일/비밀번호, 전화번호 로그인 방법 활성화
3. Firestore Database 생성 (테스트 모드로 시작 가능)
4. [FlutterFire CLI](https://firebase.google.com/docs/flutter/setup) 설치 후 아래 명령으로 `firebase_options.dart`를 실제 값으로 덮어쓰기:
   ```bash
   dart pub global activate flutterfire_cli
   flutterfire configure
   ```
   Windows/macOS/Linux 데스크톱을 선택하면 GA 상태가 아니라는 경고가 뜰 수 있지만 진행하면 됩니다.

### 4. 실행

```bash
flutter run -d windows   # 윈도우 데스크톱
flutter run -d chrome    # 웹 미리보기 (참고용, 공식 타겟 아님)
flutter run               # 연결된 iOS/Android 기기 또는 시뮬레이터
```

## 전화번호 인증(SMS)에 대한 제약

Firebase Auth의 전화번호 인증은 **Android/iOS/Web에서만 지원**됩니다. Windows/macOS/Linux 데스크톱에서는 지원되지 않아서, 이 플랫폼에서는 인증 화면에 안내 문구만 뜨고 "나중에 인증하기"로 건너뛰게 되어 있습니다 (`lib/viewmodels/platform_support.dart`의 `isPhoneAuthSupported` 참고).

## 검증한 것 / 못한 것

이 환경(Linux 컨테이너)에서 확인한 것:

- `flutter analyze` — 이슈 없음
- `flutter test` — 통과
- `flutter build linux --debug` — 빌드 성공 (Windows와 같은 데스크톱 계열 빌드라 유사한 신뢰도로 참고할 수 있지만, Windows 자체 빌드는 아닙니다)

**Windows용 실제 빌드(`flutter build windows`)는 Windows 머신에서만 가능**해서 이 환경에서는 못 해봤습니다. 위 3단계를 마친 뒤 Windows PC에서 `flutter run -d windows`로 직접 확인해주세요.

## 프로젝트 구조

```
camstudy_app/
  lib/
    models/          # UserProfile, StudyRoom, StudySession, ChatMessage
    services/        # AuthService(FirebaseAuth), FirestoreService
    viewmodels/       # ChangeNotifier 기반 뷰모델 (Swift 버전의 ViewModel과 1:1 대응)
    screens/
      auth/            # LoginScreen, SignUpScreen, PhoneVerificationScreen
      main/            # RootScreen, MainTabScreen, MyPageScreen
      goal_mates/      # GoalMatesScreen
      study_room/      # StudyRoomListScreen, CreateStudyRoomScreen, StudyRoomScreen
    firebase_options.dart  # placeholder — flutterfire configure로 교체
  test/
    widget_test.dart  # LoginScreen 스모크 테스트
```

## Firestore 데이터 구조

`CamStudy/`(Swift) 버전과 동일한 컬렉션/필드를 그대로 사용합니다 — 같은 Firebase 프로젝트를 공유해도 됩니다.

- `users/{uid}`: nickname, goal, email, phoneNumber, isPhoneVerified, totalStudySeconds, createdAt
- `studyRooms/{roomId}`: name, hostId, hostNickname, maxParticipants, participantIds, participantNicknames, createdAt, isActive
- `studyRooms/{roomId}/messages/{messageId}`: senderId, senderNickname, text, sentAt
- `studySessions/{sessionId}`: userId, roomId, roomName, startedAt, endedAt, durationSeconds
