# 관리자 계정 생성 가이드

## 방법 1: Firebase 콘솔에서 직접 생성 (권장)

### 1단계: Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택

### 2단계: Authentication에서 사용자 생성
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Users** 탭 클릭
3. **Add user** 버튼 클릭
4. 이메일과 비밀번호 입력
5. **Add user** 클릭하여 사용자 생성

### 3단계: Firestore에서 관리자 권한 설정
1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **Data** 탭에서 `users` 컬렉션 찾기
3. 방금 생성한 사용자의 문서 찾기
4. 문서 편집하여 다음 필드 추가:

```json
{
  "role": "admin",
  "approvalStatus": "approved",
  "name": "관리자 이름",
  "email": "admin@example.com",
  "phone": "010-1234-5678",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4단계: 로그인 테스트
1. 생성한 이메일과 비밀번호로 로그인
2. 관리자 대시보드 접근 확인

## 방법 2: 코드에서 임시 관리자 생성 기능 추가

### 임시 관리자 생성 페이지 생성
```typescript
// src/shared/components/AdminSetup.tsx
import React, { useState } from 'react';
import { AuthService } from '../services/authService';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const createAdmin = async () => {
    try {
      // Firebase Auth에서 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Firestore에 관리자 정보 저장
      await AuthService.createUser({
        id: userCredential.user.uid,
        email,
        name,
        role: 'admin',
        approvalStatus: 'approved',
        phone: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      alert('관리자 계정이 생성되었습니다!');
    } catch (error) {
      console.error('관리자 생성 실패:', error);
      alert('관리자 생성에 실패했습니다.');
    }
  };

  return (
    <div>
      <h2>관리자 계정 생성</h2>
      <input 
        type="email" 
        placeholder="이메일" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        placeholder="비밀번호" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="이름" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <button onClick={createAdmin}>관리자 생성</button>
    </div>
  );
};
```

## 방법 3: 등록 페이지에 관리자 옵션 추가 (개발용)

### 등록 페이지 수정
```typescript
// src/shared/components/RegisterPage.tsx의 renderRoleSelection 함수 수정

const renderRoleSelection = () => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>
        역할 선택
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        어떤 역할로 가입하시겠습니까?
      </Typography>
    </Grid>
    
    {/* 기존 판매자, 시공자 카드들... */}
    
    {/* 개발용 관리자 옵션 추가 */}
    {process.env.NODE_ENV === 'development' && (
      <Grid item xs={12} md={4}>
        <Card 
          sx={{ 
            cursor: 'pointer', 
            border: formData.role === 'admin' ? 2 : 1,
            borderColor: formData.role === 'admin' ? 'error.main' : 'divider',
            bgcolor: formData.role === 'admin' ? 'error.50' : 'background.paper'
          }}
          onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
        >
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <AdminPanelSettings sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="error">
              관리자 (개발용)
            </Typography>
            <Typography variant="body2" color="textSecondary">
              시스템 관리 및 설정 담당
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    )}
  </Grid>
);
```

## 보안 주의사항

1. **프로덕션 환경에서는 방법 1만 사용**
2. **개발용 관리자 옵션은 개발 환경에서만 활성화**
3. **관리자 계정 생성 후 즉시 비밀번호 변경**
4. **관리자 계정 정보는 안전하게 보관**

## 권장사항

- **초기 설정**: 방법 1 (Firebase 콘솔) 사용
- **개발 중**: 방법 3 (등록 페이지에 임시 옵션 추가)
- **보안**: 관리자 계정 생성 후 즉시 개발용 옵션 제거
