export const getGradeBenefits = (grade) => {
  const benefits = {
    'A': [
      {
        title: '최우선 배정',
        description: '새로운 프로젝트에 최우선으로 배정됩니다.'
      },
      {
        title: '프리미엄 수수료',
        description: '기본 수수료보다 20% 높은 프리미엄 수수료를 받습니다.'
      },
      {
        title: 'VIP 고객 우선',
        description: 'VIP 고객의 프로젝트에 우선 배정됩니다.'
      },
      {
        title: '마케팅 지원',
        description: '플랫폼에서 우선적으로 마케팅 지원을 받습니다.'
      },
      {
        title: '교육 프로그램',
        description: '무료 고급 기술 교육 프로그램에 참여할 수 있습니다.'
      }
    ],
    'B': [
      {
        title: '우선 배정',
        description: '새로운 프로젝트에 우선적으로 배정됩니다.'
      },
      {
        title: '보너스 수수료',
        description: '기본 수수료보다 10% 높은 보너스 수수료를 받습니다.'
      },
      {
        title: '고객 추천',
        description: '플랫폼에서 고객에게 우선적으로 추천됩니다.'
      },
      {
        title: '기술 지원',
        description: '기술적 문제 해결을 위한 전문 지원을 받습니다.'
      }
    ],
    'C': [
      {
        title: '일반 배정',
        description: '새로운 프로젝트에 일반적으로 배정됩니다.'
      },
      {
        title: '기본 수수료',
        description: '표준 수수료율을 적용받습니다.'
      },
      {
        title: '기본 지원',
        description: '기본적인 고객 지원 서비스를 받습니다.'
      }
    ],
    'D': [
      {
        title: '제한적 배정',
        description: '프로젝트 배정이 제한적입니다.'
      },
      {
        title: '감액 수수료',
        description: '기본 수수료보다 10% 낮은 수수료율이 적용됩니다.'
      },
      {
        title: '개선 필요',
        description: '평점 개선이 필요합니다.'
      }
    ]
  };

  return benefits[grade] || benefits['D'];
};

export const getGradeRequirements = (grade) => {
  const requirements = {
    'A': [
      '평균 평점 4.5 이상',
      '최소 50개 이상의 프로젝트 완료',
      '고객 만족도 95% 이상',
      '시간 준수율 98% 이상',
      '연간 매출 1억원 이상'
    ],
    'B': [
      '평균 평점 4.0 이상',
      '최소 30개 이상의 프로젝트 완료',
      '고객 만족도 90% 이상',
      '시간 준수율 95% 이상',
      '연간 매출 5천만원 이상'
    ],
    'C': [
      '평균 평점 3.5 이상',
      '최소 10개 이상의 프로젝트 완료',
      '고객 만족도 80% 이상',
      '시간 준수율 90% 이상'
    ],
    'D': [
      '평균 평점 3.0 미만',
      '프로젝트 완료 수 부족',
      '고객 만족도 80% 미만',
      '시간 준수율 90% 미만'
    ]
  };

  return requirements[grade] || requirements['D'];
};

export const getGradeColor = (grade) => {
  const colors = {
    'A': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    'B': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    'C': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    'D': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    }
  };

  return colors[grade] || colors['D'];
};

export const getGradeIcon = (grade) => {
  const icons = {
    'A': '🏆',
    'B': '🥈',
    'C': '🥉',
    'D': '⚠️'
  };

  return icons[grade] || icons['D'];
};

export const getGradeDescription = (grade) => {
  const descriptions = {
    'A': '최고 등급 - 우수한 품질과 서비스로 고객 만족도가 매우 높은 시공기사',
    'B': '우수 등급 - 안정적인 품질과 서비스로 고객 만족도가 높은 시공기사',
    'C': '일반 등급 - 기본적인 품질과 서비스를 제공하는 시공기사',
    'D': '개선 필요 등급 - 품질과 서비스 개선이 필요한 시공기사'
  };

  return descriptions[grade] || descriptions['D'];
}; 