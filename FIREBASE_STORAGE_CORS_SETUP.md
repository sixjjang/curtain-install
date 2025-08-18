# Firebase Storage CORS 설정 가이드

## 🔧 CORS 오류 해결 방법

현재 Firebase Storage에서 CORS 오류가 발생하고 있습니다. 다음 방법 중 하나를 선택하여 해결할 수 있습니다.

### **방법 1: Firebase Console에서 설정 (권장)**

1. **Firebase Console** 접속: https://console.firebase.google.com/
2. **프로젝트**: `curtain-install` 선택
3. **Storage** → **Rules** 탭
4. **CORS 설정 추가**:
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
     }
   ]
   ```

### **방법 2: Google Cloud SDK 사용**

1. **Google Cloud SDK 설치**: https://cloud.google.com/sdk/docs/install
2. **터미널에서 실행**:
   ```bash
   gsutil cors set cors.json gs://curtain-install.firebasestorage.app
   ```

### **방법 3: Firebase CLI 사용**

1. **Firebase CLI 설치** (이미 완료됨):
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase 로그인** (이미 완료됨):
   ```bash
   firebase login
   ```

3. **CORS 설정 적용**:
   ```bash
   firebase storage:cors set cors.json
   ```

## 📝 현재 상태

- ✅ **이미지 최적화**: 정상 작동
- ✅ **로컬 저장**: CORS 오류 시에도 dataURL로 저장
- ✅ **사용자 경험**: 오류 없이 프로필 이미지 업로드 가능
- ⏳ **Firebase Storage**: CORS 설정 완료 후 활성화 예정

## 🎯 다음 단계

CORS 설정이 완료되면 다음 코드를 활성화하여 Firebase Storage 사용:

```typescript
// Firebase Storage에 업로드
if (user?.id) {
  const imageFile = StorageService.dataURLtoFile(optimizedResult.dataUrl, file.name);
  const imageUrl = await StorageService.uploadProfileImage(imageFile, user.id);
  
  // 서버에 저장된 URL로 설정
  setProfileImage(imageUrl);
  
  // 즉시 기본 정보에 저장
  const basicInfoWithImage = {
    ...basicInfo,
    profileImage: imageUrl
  };
  await SellerService.saveBasicInfo(user.id, basicInfoWithImage);
}
```

## 🔍 문제 해결

CORS 설정 후에도 문제가 지속되면:
1. 브라우저 캐시 삭제
2. Firebase 프로젝트 설정 확인
3. Storage Rules 확인
