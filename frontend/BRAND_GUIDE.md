# Insteam 브랜드 가이드

## 🎨 브랜드 개요

**Insteam**은 설치 전문가와 고객을 연결하는 협업 플랫폼입니다. "Install"과 "Team"의 조합으로, 전문가들이 함께 협업하여 최고의 설치 서비스를 제공한다는 의미를 담고 있습니다.

### 브랜드 슬로건
- **"함께하는 설치, Insteam"**
- **"설치의 새로운 기준, Insteam"**
- **"전문가와 함께하는 설치 플랫폼"**

## 🎯 브랜드 컬러

### 메인 컬러
- **Primary Blue**: `#2563eb` - 메인 브랜드 컬러
- **Primary Dark**: `#1e40af` - 다크 버전
- **Primary Light**: `#3b82f6` - 라이트 버전

### 보조 컬러
- **Secondary Gray**: `#64748b` - 텍스트 및 보조 요소
- **Accent Orange**: `#f59e0b` - 강조 및 CTA

### 상태 컬러
- **Success**: `#10b981` - 성공 상태
- **Warning**: `#f59e0b` - 경고 상태
- **Error**: `#ef4444` - 에러 상태
- **Info**: `#3b82f6` - 정보 상태

### 그라데이션
- **Primary Gradient**: `linear-gradient(135deg, #2563eb 0%, #1e40af 100%)`
- **Secondary Gradient**: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
- **Accent Gradient**: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`

## 🔧 로고 사용법

### 로고 구성 요소
1. **렌치 아이콘**: 설치 전문성을 상징
2. **연결선**: 팀워크와 협업을 표현
3. **사람 아이콘**: 전문가들의 협업을 나타냄
4. **텍스트**: "Insteam" 브랜드명

### 로고 크기 가이드
- **Small (sm)**: 32px - 모바일 앱 아이콘
- **Medium (md)**: 48px - 네비게이션, 헤더
- **Large (lg)**: 64px - 메인 페이지, 랜딩
- **Extra Large (xl)**: 80px - 대형 배너, 프레젠테이션

### 로고 사용 규칙
- ✅ 최소 크기 준수 (32px 이상)
- ✅ 배경과의 충분한 대비 확보
- ✅ 로고 주변 여백 유지 (로고 높이의 1/4)
- ❌ 로고 변형 금지 (색상, 비율, 회전)
- ❌ 로고 위에 텍스트나 요소 겹치기 금지

## 📝 타이포그래피

### 폰트 패밀리
- **Primary**: Inter, Arial, sans-serif
- **Fallback**: 시스템 기본 sans-serif

### 폰트 크기
- **Heading 1**: 2.25rem (36px) - 메인 타이틀
- **Heading 2**: 1.875rem (30px) - 섹션 타이틀
- **Heading 3**: 1.5rem (24px) - 서브 타이틀
- **Body**: 1rem (16px) - 본문 텍스트
- **Small**: 0.875rem (14px) - 보조 텍스트
- **Caption**: 0.75rem (12px) - 캡션, 라벨

### 폰트 웨이트
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700
- **Extra-bold**: 800

## 🎨 UI 컴포넌트

### 버튼 스타일
```css
.btn-insteam-primary {
  background: var(--insteam-gradient-primary);
  color: var(--insteam-white);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
```

### 카드 스타일
```css
.insteam-card {
  background: var(--insteam-white);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--insteam-gray-200);
  transition: all 0.2s ease;
}
```

### 배지 스타일
```css
.insteam-badge {
  background: var(--insteam-primary);
  color: var(--insteam-white);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
```

## 📱 반응형 디자인

### 브레이크포인트
- **Mobile**: 0px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px 이상

### 컨테이너 최대 너비
- **Mobile**: 100% - 1rem 패딩
- **Tablet**: 100% - 2rem 패딩
- **Desktop**: 1200px - 4rem 패딩

## 🎭 애니메이션

### 기본 애니메이션
- **Fade In**: 0.5s ease-in-out
- **Slide In**: 0.3s ease-out
- **Spin**: 1s ease-in-out (로딩)

### 호버 효과
- **Button**: translateY(-1px) + shadow
- **Card**: translateY(-2px) + shadow
- **Link**: opacity 0.8

## 📋 사용 예시

### 웹사이트 헤더
```jsx
<header className="insteam-header">
  <div className="insteam-container">
    <InsteamLogo size="md" />
    <nav>
      <a href="/" className="btn-insteam-primary">시작하기</a>
    </nav>
  </div>
</header>
```

### 메인 CTA 버튼
```jsx
<button className="btn-insteam-primary">
  전문가 찾기
</button>
```

### 정보 카드
```jsx
<div className="insteam-card p-6">
  <h3 className="text-lg font-semibold mb-2">전문가 프로필</h3>
  <p className="text-gray-600">설치 경험 10년 이상</p>
  <span className="insteam-badge">인증됨</span>
</div>
```

## 🚫 금지 사항

### 로고 사용 금지
- 로고 색상 변경
- 로고 비율 변경
- 로고 회전
- 로고 위에 텍스트 겹치기
- 로고를 배경으로 사용

### 컬러 사용 금지
- 브랜드 컬러를 다른 용도로 사용
- 브랜드 컬러와 충돌하는 색상 조합
- 너무 많은 색상 동시 사용

### 타이포그래피 금지
- 브랜드 폰트 외 다른 폰트 사용
- 너무 작은 폰트 크기 (12px 미만)
- 과도한 폰트 웨이트 사용

## 📞 문의

브랜드 가이드 관련 문의사항이 있으시면 개발팀에 연락해주세요.

---

**Insteam** - 함께하는 설치, 새로운 기준 