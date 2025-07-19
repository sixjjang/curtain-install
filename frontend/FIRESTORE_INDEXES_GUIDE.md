# Firestore 인덱스 생성 가이드

## 🔧 현재 필요한 인덱스들

### 1. 작업 주문 목록 인덱스

#### 판매자용 인덱스
```
컬렉션: workOrders
필드: sellerId (Ascending), createdAt (Descending)
```

#### 시공자용 인덱스
```
컬렉션: workOrders
필드: contractorId (Ascending), status (Ascending), createdAt (Descending)
```

#### 상태별 인덱스
```
컬렉션: workOrders
필드: status (Ascending), createdAt (Descending)
```

## 📋 인덱스 생성 방법

### 방법 1: Firebase Console에서 직접 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. 프로젝트 선택: `curtain-install`
3. Firestore Database → 인덱스 탭
4. "복합 인덱스 만들기" 클릭
5. 다음 인덱스들을 순서대로 생성:

#### 인덱스 1: 판매자 작업 주문
- 컬렉션 ID: `workOrders`
- 필드:
  - `sellerId` (Ascending)
  - `createdAt` (Descending)

#### 인덱스 2: 시공자 작업 주문
- 컬렉션 ID: `workOrders`
- 필드:
  - `contractorId` (Ascending)
  - `status` (Ascending)
  - `createdAt` (Descending)

#### 인덱스 3: 상태별 작업 주문
- 컬렉션 ID: `workOrders`
- 필드:
  - `status` (Ascending)
  - `createdAt` (Descending)

### 방법 2: 오류 메시지 링크 사용

오류 메시지에 포함된 링크를 클릭하면 자동으로 인덱스 생성 페이지로 이동합니다:

```
https://console.firebase.google.com/v1/r/project/curtain-install/firestore/indexes?create_composite=...
```

## ⏱️ 인덱스 생성 시간

- **소규모 데이터**: 몇 분 내 완료
- **대규모 데이터**: 최대 1시간 소요
- **진행 상황**: Firebase Console에서 실시간 확인 가능

## 🔍 인덱스 상태 확인

1. Firebase Console → Firestore Database → 인덱스
2. 상태 확인:
   - 🟢 **사용 가능**: 인덱스 생성 완료
   - 🟡 **빌드 중**: 인덱스 생성 진행 중
   - 🔴 **오류**: 인덱스 생성 실패

## 📝 임시 해결책

인덱스가 생성되는 동안 현재는 클라이언트 사이드 필터링을 사용합니다:

1. 모든 작업 주문을 가져옴
2. JavaScript로 사용자 역할에 따라 필터링
3. 성능상 최적은 아니지만 임시로 작동

## 🚀 최적화 후 변경사항

인덱스 생성 완료 후에는 서버 사이드 필터링으로 변경하여 성능을 개선할 수 있습니다.

---

**참고**: 인덱스 생성은 일회성 작업이며, 생성 완료 후에는 자동으로 사용됩니다. 