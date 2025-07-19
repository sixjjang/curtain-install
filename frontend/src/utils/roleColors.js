// 역할별 색상 테마
export const getRoleColors = (role) => {
  switch (role) {
    case 'seller':
      return {
        primary: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100'
      };
    case 'contractor':
      return {
        primary: 'orange',
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100'
      };
    case 'admin':
      return {
        primary: 'purple',
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100'
      };
    default:
      return {
        primary: 'gray',
        gradient: 'from-gray-500 to-gray-600',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100'
      };
  }
};

// 역할별 표시 이름
export const getRoleDisplayName = (role) => {
  switch (role) {
    case 'seller': return '판매자';
    case 'contractor': return '시공자';
    case 'admin': return '관리자';
    default: return '사용자';
  }
};

// 역할별 설명
export const getRoleDescription = (role) => {
  switch (role) {
    case 'seller':
      return '커튼/블라인드 전문 판매업체';
    case 'contractor':
      return '설치 전문가';
    case 'admin':
      return '시스템 관리자';
    default:
      return '일반 사용자';
  }
};

// 역할에 따른 CSS 클래스 가져오기
export const getRoleClasses = (role, type) => {
  const colors = getRoleColors(role);
  
  switch (type) {
    case 'button':
      return colors.button;
    case 'buttonOutline':
      return colors.buttonOutline;
    case 'card':
      return colors.card;
    case 'badge':
      return colors.badge;
    case 'text':
      return colors.text;
    case 'textDark':
      return colors.textDark;
    case 'textLight':
      return colors.textLight;
    case 'bg':
      return colors.bg;
    case 'border':
      return colors.border;
    case 'icon':
      return colors.icon;
    case 'gradient':
      return colors.gradient;
    case 'gradientHover':
      return colors.gradientHover;
    case 'shadow':
      return colors.shadow;
    case 'accent':
      return colors.accent;
    case 'accentLight':
      return colors.accentLight;
    case 'accentText':
      return colors.accentText;
    default:
      return '';
  }
};

// 역할에 따른 배경 그라데이션 클래스
export const getRoleBackground = (role) => {
  const colors = getRoleColors(role);
  return `bg-gradient-to-br from-${colors.primary}-50 via-${colors.primary}-25 to-white`;
};

// 역할에 따른 로고 색상
export const getRoleLogoColor = (role) => {
  const colors = getRoleColors(role);
  return `from-${colors.primary}-500 to-${colors.primary}-600`;
}; 