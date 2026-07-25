# CamStudy (캠스터디)

열품타 스타일 캠스터디 iOS 앱. 현재 구현된 범위는 **로그인 / 회원가입(프로필 생성) / 전화번호 SMS 인증 / 스터디룸 목록·생성·입장 / 공부 타이머 / 마이페이지·통계**입니다. Agora 영상 스트리밍 화면은 아직 구현되지 않았습니다.

## 화면 흐름

1. `LoginView` — 이메일/비밀번호 로그인, 회원가입 화면으로 이동
2. `SignUpView` — 이메일, 비밀번호, 닉네임, 목표를 입력받아 Firebase Auth 계정 생성 + Firestore에 프로필 저장
3. `PhoneVerificationView` — 전화번호로 SMS 인증번호 발송 → 인증번호 확인 → 기존 계정에 전화번호 연동(link) 및 Firestore 프로필 업데이트
4. 로그인 완료 후 `MainTabView` (스터디룸 / 마이페이지 탭)
   - `StudyRoomListView` — 열려있는 스터디룸을 실시간으로 보여주고, `CreateStudyRoomView`에서 새 방을 만듭니다.
   - `StudyRoomView` — 방에 입장하면 참여자 목록이 실시간으로 갱신되고, 공부 타이머가 1초마다 올라갑니다. 방을 나가면 `StudySession`이 Firestore에 저장되고 누적 공부 시간에 더해집니다.
   - `MyPageView` — 닉네임/목표, 누적·오늘 공부 시간, 최근 7일 공부 시간 차트(Swift Charts)를 보여주고 로그아웃할 수 있습니다.

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

## 다음 단계

Agora SDK를 이용한 실시간 영상 캠스터디 화면이 남아있습니다.
