import { useState } from "react";
import { getGradeBenefits, getGradeStyle } from "../utils/gradeCalculator";

const GradeBenefits = ({ selectedGrade = null, showDetails = true }) => {
  const [expandedGrade, setExpandedGrade] = useState(selectedGrade);

  // 등급별 혜택 데이터
  const gradeData = {
    A: {
      title: "A등급 - 우수",
      description: "최고 수준의 서비스 품질을 인정받은 시공기사",
      icon: "🏆",
      color: "green",
      benefits: [
        "우선 고객 배정 (최우선 순위)",
        "프리미엄 요금 적용 가능 (기본 + 20%)",
        "특별 프로모션 참여 자격",
        "고객 추천 우선권",
        "VIP 고객 전용 서비스",
        "월 최대 50건까지 배정 보장"
      ],
      requirements: [
        "평균 평점 4.5 이상",
        "최소 10건 이상의 평가",
        "최근 3개월 내 부정적 평가 없음",
        "고객 만족도 95% 이상"
      ],
      commission: "10%",
      maxAssignments: "50건/월"
    },
    B: {
      title: "B등급 - 양호",
      description: "안정적인 서비스 품질을 제공하는 시공기사",
      icon: "⭐",
      color: "blue",
      benefits: [
        "일반 고객 배정 (우선 순위)",
        "표준 요금 적용",
        "기본 프로모션 참여",
        "정기 고객 배정",
        "서비스 개선 지원"
      ],
      requirements: [
        "평균 평점 3.5 이상",
        "최소 5건 이상의 평가",
        "최근 6개월 내 부정적 평가 1건 이하"
      ],
      commission: "15%",
      maxAssignments: "30건/월"
    },
    C: {
      title: "C등급 - 보통",
      description: "기본적인 서비스 품질을 제공하는 시공기사",
      icon: "📊",
      color: "yellow",
      benefits: [
        "기본 고객 배정",
        "표준 요금 적용",
        "교육 프로그램 참여",
        "멘토링 지원"
      ],
      requirements: [
        "평균 평점 2.5 이상",
        "개선 계획 수립 및 이행",
        "정기 모니터링 참여"
      ],
      commission: "20%",
      maxAssignments: "15건/월"
    },
    D: {
      title: "D등급 - 미흡",
      description: "개선이 필요한 시공기사",
      icon: "⚠️",
      color: "red",
      benefits: [
        "제한적 고객 배정",
        "교육 프로그램 의무 참여",
        "정기 모니터링"
      ],
      requirements: [
        "즉시 개선 계획 수립",
        "교육 프로그램 의무 참여",
        "월 1회 성과 평가",
        "3개월 내 등급 상승 필요"
      ],
      commission: "25%",
      maxAssignments: "5건/월"
    }
  };

  // 등급별 색상 클래스
  const getColorClasses = (color) => {
    const colorMap = {
      green: "border-green-200 bg-green-50 text-green-800",
      blue: "border-blue-200 bg-blue-50 text-blue-800",
      yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
      red: "border-red-200 bg-red-50 text-red-800"
    };
    return colorMap[color] || "border-gray-200 bg-gray-50 text-gray-800";
  };

  // 등급별 배경 색상
  const getBgColorClasses = (color) => {
    const bgColorMap = {
      green: "bg-green-100",
      blue: "bg-blue-100",
      yellow: "bg-yellow-100",
      red: "bg-red-100"
    };
    return bgColorMap[color] || "bg-gray-100";
  };

  // 등급별 텍스트 색상
  const getTextColorClasses = (color) => {
    const textColorMap = {
      green: "text-green-600",
      blue: "text-blue-600",
      yellow: "text-yellow-600",
      red: "text-red-600"
    };
    return textColorMap[color] || "text-gray-600";
  };

  // 등급 카드 컴포넌트
  const GradeCard = ({ grade, data }) => {
    const isExpanded = expandedGrade === grade;
    const isSelected = selectedGrade === grade;

    return (
      <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md hover:shadow-lg'
      }`}>
        {/* 헤더 */}
        <div className={`p-4 ${getBgColorClasses(data.color)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{data.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{data.title}</h3>
                <p className="text-sm opacity-80">{data.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getTextColorClasses(data.color)}`}>
                수수료 {data.commission}
              </div>
              <div className="text-xs opacity-70">
                최대 {data.maxAssignments}
              </div>
            </div>
          </div>
        </div>

        {/* 확장 가능한 내용 */}
        {showDetails && (
          <div className={`transition-all duration-300 ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="p-4 bg-white">
              {/* 혜택 */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  혜택
                </h4>
                <ul className="space-y-1">
                  {data.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-400 mr-2 mt-1">•</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 요구사항 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="text-blue-500 mr-2">📋</span>
                  요구사항
                </h4>
                <ul className="space-y-1">
                  {data.requirements.map((requirement, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-400 mr-2 mt-1">•</span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 토글 버튼 */}
        {showDetails && (
          <div className="p-3 bg-gray-50 border-t">
            <button
              onClick={() => setExpandedGrade(isExpanded ? null : grade)}
              className={`w-full text-sm font-medium ${getTextColorClasses(data.color)} hover:opacity-80 transition-opacity`}
            >
              {isExpanded ? "접기" : "자세히 보기"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">시공기사 등급별 혜택</h2>
        <p className="text-gray-600">서비스 품질에 따른 차등화된 혜택을 제공합니다</p>
      </div>

      {/* 등급 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(gradeData).map(([grade, data]) => (
          <GradeCard key={grade} grade={grade} data={data} />
        ))}
      </div>

      {/* 등급 상승 가이드 */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="text-blue-500 mr-2">📈</span>
          등급 상승 가이드
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">⭐</div>
            <h4 className="font-semibold text-blue-900 mb-2">평점 관리</h4>
            <p className="text-sm text-blue-700">
              고객 평가에서 높은 점수를 받기 위해 서비스 품질을 지속적으로 개선하세요
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-green-900 mb-2">평가 수집</h4>
            <p className="text-sm text-green-700">
              충분한 평가를 받아 신뢰할 수 있는 등급을 확보하세요
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-semibold text-purple-900 mb-2">지속 개선</h4>
            <p className="text-sm text-purple-700">
              고객 피드백을 바탕으로 서비스 품질을 지속적으로 개선하세요
            </p>
          </div>
        </div>
      </div>

      {/* FAQ 섹션 */}
      <div className="bg-white rounded-xl shadow-md p-6 border mt-6">
        <h3 className="text-xl font-semibold mb-4">자주 묻는 질문</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">Q: 등급은 언제 업데이트되나요?</h4>
            <p className="text-sm text-gray-600">
              새로운 평가가 추가될 때마다 자동으로 등급이 재계산됩니다. 등급 변경 시 즉시 알림을 받으실 수 있습니다.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">Q: 등급이 하락할 수 있나요?</h4>
            <p className="text-sm text-gray-600">
              네, 평가 점수가 기준 미달로 떨어지면 등급이 하락할 수 있습니다. 지속적인 서비스 개선이 중요합니다.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Q: 등급별 수수료는 어떻게 적용되나요?</h4>
            <p className="text-sm text-gray-600">
              각 등급별로 차등화된 수수료가 적용됩니다. 높은 등급일수록 낮은 수수료를 적용받아 더 많은 수익을 얻을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="bg-blue-50 rounded-xl p-6 mt-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">등급 관련 문의</h3>
        <p className="text-blue-700 mb-3">
          등급 시스템에 대한 궁금한 점이 있으시면 언제든 문의해 주세요
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="text-blue-600">📧 support@curtain-install.com</span>
          <span className="text-blue-600">📞 1588-0000</span>
        </div>
      </div>
    </div>
  );
};

export default GradeBenefits; 