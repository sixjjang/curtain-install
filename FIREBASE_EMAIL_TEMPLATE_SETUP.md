# Firebase Auth 이메일 템플릿 커스터마이징 가이드

## 비밀번호 재설정 이메일 템플릿 설정

### 1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. `curtain-install` 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** 클릭
4. **Templates** 탭 클릭

### 2. 비밀번호 재설정 이메일 템플릿 수정

#### 제목 (Subject)
```
[전문가의 손길] 비밀번호 재설정 안내
```

#### 이메일 내용 (HTML)
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>비밀번호 재설정</title>
    <style>
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1565c0;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .link {
            word-break: break-all;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">전문가의 손길</div>
            <h2>비밀번호 재설정 안내</h2>
        </div>
        
        <div class="content">
            <p>안녕하세요.</p>
            
            <p>다음 링크를 통해 <strong>{{email}}</strong> 계정의 '전문가의 손길' 비밀번호를 재설정하세요.</p>
            
            <div style="text-align: center;">
                <a href="{{link}}" class="button">비밀번호 재설정</a>
            </div>
            
            <p style="margin-top: 20px;">
                위 버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣기 해주세요:
            </p>
            <p class="link">{{link}}</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ 주의사항:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>비밀번호 재설정 링크는 <strong>1시간 후 만료</strong>됩니다</li>
                <li>링크는 <strong>한 번만 사용</strong>할 수 있습니다</li>
                <li>비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시하셔도 됩니다</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>감사합니다.</p>
            <p><strong>전문가의 손길 팀</strong></p>
            <p style="font-size: 12px; color: #999;">
                이 이메일은 {{email}} 계정의 비밀번호 재설정 요청으로 발송되었습니다.
            </p>
        </div>
    </div>
</body>
</html>
```

#### 이메일 내용 (텍스트)
```
안녕하세요.

다음 링크를 통해 {{email}} 계정의 '전문가의 손길' 비밀번호를 재설정하세요.

{{link}}

주의사항:
• 비밀번호 재설정 링크는 1시간 후 만료됩니다
• 링크는 한 번만 사용할 수 있습니다
• 비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시하셔도 됩니다

감사합니다.

전문가의 손길 팀

이 이메일은 {{email}} 계정의 비밀번호 재설정 요청으로 발송되었습니다.
```

### 3. 발신자 정보 설정

#### 발신자 이름 (Sender name)
```
전문가의 손길
```

#### 발신자 이메일 (Sender email)
```
noreply@curtain-install.firebaseapp.com
```

### 4. 추가 설정

#### 이메일 언어
- **기본 언어**: 한국어 (ko)
- **대체 언어**: 영어 (en)

#### 이메일 서명
```
--
전문가의 손길
커튼 설치 전문 플랫폼
https://curtain-install.firebaseapp.com
```

### 5. 테스트

설정 완료 후:
1. **Test** 버튼을 클릭하여 테스트 이메일 발송
2. 실제 사용자 계정으로 비밀번호 재설정 테스트
3. 이메일 디자인과 링크 작동 확인

### 6. 주의사항

- 이메일 템플릿 수정 후 즉시 적용됩니다
- HTML 이메일은 모든 이메일 클라이언트에서 제대로 표시되지 않을 수 있으므로 텍스트 버전도 함께 제공
- 링크는 HTTPS로 시작해야 보안 경고를 피할 수 있습니다
- 이메일 내용에 개인정보나 민감한 정보를 포함하지 마세요

### 7. 커스터마이징 가능한 변수

- `{{email}}`: 사용자 이메일 주소
- `{{link}}`: 비밀번호 재설정 링크
- `{{app_name}}`: 앱 이름 (Firebase 설정에서 정의)
- `{{action_code}}`: 액션 코드 (고급 사용자용)

이 설정을 완료하면 사용자가 요청한 형태의 한글 비밀번호 재설정 이메일을 받을 수 있습니다.
