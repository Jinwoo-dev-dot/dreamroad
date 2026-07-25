# CamStudy (캠스터디)

열품타 스타일 캠스터디 iOS 앱. 영상 스트리밍 대신 **텍스트 채팅** 기반으로 방향을 잡았습니다. 현재 구현된 범위는 **로그인 / 회원가입(프로필 생성) / 전화번호 SMS 인증 / 목표메이트 리스트 / 스터디룸 목록·생성·입장·채팅 / 공부 타이머 / 마이페이지·통계 / 스터디 중 앱 잠금**입니다.

> ⚠️ **앱 잠금 기능은 Apple의 Family Controls entitlement 승인이 필요합니다.** 아래 "앱 잠금 (Screen Time) 설정" 항목을 먼저 읽어주세요 — 승인 전에는 이 기능 때문에 빌드/서명이 실패할 수 있습니다.

## 화면 흐름

1. `LoginView` — 이메일/비밀번호 로그인, 회원가입 화면으로 이동
2. `SignUpView` — 이메일, 비밀번호, 닉네임, 목표를 입력받아 Firebase Auth 계정 생성 + Firestore에 프로필 저장
3. `PhoneVerificationView` — 전화번호로 SMS 인증번호 발송 → 인증번호 확인 → 기존 계정에 전화번호 연동(link) 및 Firestore 프로필 업데이트
4. 로그인 완료 후 `MainTabView` (스터디룸 / 목표메이트 / 마이페이지 탭)
   - `GoalMatesView` — 나와 같은 목표(goal)를 가진 다른 사용자 목록을 보여줍니다.
   - `StudyRoomListView` — 열려있는 스터디룸을 실시간으로 보여주고, `CreateStudyRoomView`에서 새 방을 만듭니다.
   - `StudyRoomView` — 방에 입장하면 참여자 목록이 실시간으로 갱신되고, 공부 타이머가 1초마다 올라가며, 참여자끼리 텍스트 채팅을 주고받을 수 있습니다. 방을 나가면 `StudySession`이 Firestore에 저장되고 누적 공부 시간에 더해집니다.
   - `MyPageView` — 닉네임/목표, 누적·오늘 공부 시간, 최근 7일 공부 시간 차트(Swift Charts), 잠글 앱 선택(Screen Time), 로그아웃을 보여줍니다. 스터디룸에 입장해있는 동안 선택한 앱이 잠기고, 나가면 풀립니다.

## 프로젝트 구조

```
CamStudy/
  project.yml                # XcodeGen 프로젝트 정의
  CamStudy/
    App/                     # 앱 진입점, 루트 라우팅
    Models/                  # UserProfile, StudyRoom, StudySession
    Services/                # AuthService(FirebaseAuth), FirestoreService
    ViewModels/              # Auth/UserSession/StudyRoomList/CreateStudyRoom/StudyRoom/Statistics
    Views/Auth/              # LoginView, SignUpView, PhoneVerificationView
    Views/StudyRoom/         # StudyRoomListView, CreateStudyRoomView, StudyRoomView
    Views/Main/              # MainTabView, MyPageView
    Resources/                # GoogleService-Info.plist(직접 추가, gitignore됨)
```

이 저장소에는 `.xcodeproj`를 직접 커밋하지 않고, [XcodeGen](https://github.com/yonaskolb/XcodeGen)으로 `project.yml`에서 생성합니다.

## 시작하기 (macOS + Xcode 필요)

1. XcodeGen 설치 (최초 1회)
   ```bash
   brew install xcodegen
   ```
2. Firebase 콘솔(https://console.firebase.google.com)에서
   - iOS 앱 등록 (Bundle ID: `com.camstudy.app`, `project.yml`에서 변경 가능)
   - `GoogleService-Info.plist` 다운로드 후 `CamStudy/Resources/GoogleService-Info.plist`로 저장
   - Authentication → 로그인 방법에서 **이메일/비밀번호**와 **전화번호** 둘 다 활성화
   - Firestore Database 생성 (테스트 모드로 시작 가능)
3. 전화번호 인증(SMS)을 실제로 받으려면 Firebase 콘솔의 iOS 앱 설정에서 APNs 인증 키를 등록해야 합니다 (그렇지 않으면 reCAPTCHA 방식으로 대체됩니다). 개발 중에는 Firebase 콘솔 → Authentication → Sign-in method → 전화번호 → "테스트용 전화번호"에 테스트 번호/인증코드를 등록해두면 실제 SMS 없이 테스트할 수 있습니다.
4. 프로젝트 생성 후 열기
   ```bash
   cd CamStudy
   xcodegen generate
   open CamStudy.xcodeproj
   ```
5. Xcode에서 Signing & Capabilities에 본인 Apple Developer Team을 지정한 뒤 빌드/실행합니다.

## 앱 잠금 (Screen Time) 설정 — 승인 필요, 필수 확인

공부 중 유튜브/인스타그램/게임 등을 잠그는 기능은 Apple의 **Family Controls** entitlement(`com.apple.developer.family-controls`)를 사용합니다. 이 entitlement은:

- **Apple Developer 계정에서 별도로 신청하고 승인받아야** 사용할 수 있습니다 ([신청 폼](https://developer.apple.com/contact/request/family-controls-distribution)). 승인까지 시간이 걸리고, 승인이 거절될 수도 있습니다.
- 승인받기 전에는 `project.yml`에 이미 포함되어 있는 `entitlements` 블록 때문에 Xcode에서 서명이 실패할 수 있습니다. 승인 전까지 이 기능을 빼고 빌드하려면 `project.yml`의 `entitlements` 블록과 `AppBlockingService.swift`/`AppBlockingViewModel.swift`, `MyPageView`의 `appBlockingSection`, `StudyRoomView`의 `appBlocking.startBlocking()/stopBlocking()` 호출을 주석 처리하거나 제거하세요.
- **시뮬레이터에서는 권한 요청(`AuthorizationCenter.requestAuthorization`)이 동작하지 않습니다.** 실기기에서만 테스트할 수 있습니다.
- 잠글 앱/카테고리 선택은 `FamilyActivityPicker`로 선택하며, 선택 결과(`FamilyActivitySelection`)는 기기 로컬(`UserDefaults`)에만 저장됩니다 — 토큰이 opaque하고 기기별로 의미가 달라서 Firestore 등 서버에는 저장하지 않습니다.
- 이 저장소는 코드 구조만 만들어둔 상태이며, 실제 entitlement 승인·실기기 테스트는 직접 진행해야 확인 가능합니다.

## Firestore 데이터 구조

`users/{uid}` 문서에 다음 필드를 저장합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| nickname | string | 닉네임 |
| goal | string | 목표 (예: 목표 대학) |
| email | string? | 가입 이메일 |
| phoneNumber | string? | E.164 형식 전화번호 (인증 완료 시 저장) |
| isPhoneVerified | bool | 전화번호 인증 여부 |
| totalStudySeconds | int | 누적 공부 시간(초). 스터디룸 퇴장 시 `FieldValue.increment`로 갱신 |
| createdAt | timestamp | 가입일 |

`studyRooms/{roomId}` 문서:

| 필드 | 타입 | 설명 |
|---|---|---|
| name | string | 방 이름 |
| hostId / hostNickname | string | 방장 |
| maxParticipants | int | 최대 인원 (클라이언트 측 체크만 있어 동시 입장 시 초과될 수 있음 — MVP 한계) |
| participantIds | [string] | 참여자 uid 목록 |
| participantNicknames | map | uid → 닉네임 |
| createdAt | timestamp | 생성일 |
| isActive | bool | 목록 노출 여부 |

`studySessions/{sessionId}` 문서: `userId`, `roomId`, `roomName`, `startedAt`, `endedAt`, `durationSeconds`.

`studyRooms/{roomId}/messages/{messageId}` 서브컬렉션: `senderId`, `senderNickname`, `text`, `sentAt`.
