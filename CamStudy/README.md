# CamStudy (캠스터디)

열품타 스타일 캠스터디 iOS 앱. 현재 구현된 범위는 **로그인 / 회원가입(프로필 생성) / 전화번호 SMS 인증** 화면입니다.

## 화면 흐름

1. `LoginView` — 이메일/비밀번호 로그인, 회원가입 화면으로 이동
2. `SignUpView` — 이메일, 비밀번호, 닉네임, 목표를 입력받아 Firebase Auth 계정 생성 + Firestore에 프로필 저장
3. `PhoneVerificationView` — 전화번호로 SMS 인증번호 발송 → 인증번호 확인 → 기존 계정에 전화번호 연동(link) 및 Firestore 프로필 업데이트

인증에 성공하면 (또는 "나중에 인증하기"를 누르면) `MainPlaceholderView`로 이동합니다. 스터디룸/캠스터디 화면 등 다음 단계는 아직 구현되지 않았습니다.

## 프로젝트 구조

```
CamStudy/
  project.yml                # XcodeGen 프로젝트 정의
  CamStudy/
    App/                     # 앱 진입점, 루트 라우팅
    Models/                  # UserProfile
    Services/                # AuthService(FirebaseAuth), FirestoreService
    ViewModels/              # AuthViewModel (로그인/회원가입/전화인증 상태 관리)
    Views/Auth/              # LoginView, SignUpView, PhoneVerificationView
    Views/Main/              # MainPlaceholderView
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
| totalStudySeconds | int | 누적 공부 시간(초). 추후 타이머 기능에서 갱신 예정 |
| createdAt | timestamp | 가입일 |

## 다음 단계

`PLAN.md` 성격의 상위 계획(스터디룸, Agora 영상, 공부 타이머, 통계) 기준으로, 로그인 이후 스터디룸 목록/생성/입장 화면을 이어서 구현할 예정입니다.
