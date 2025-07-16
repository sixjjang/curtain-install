import React, { useState } from "react";
import { shareKakaoMessage } from "../utils/kakaoSDK";

const KakaoShare = ({ jobData, className = "" }) => {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!jobData) {
      alert("공유할 작업 정보가 없습니다.");
      return;
    }

    try {
      setLoading(true);

      // 긴급 수수료 정보 확인
      const urgentFeeInfo = getUrgentFeeInfo(jobData);
      const hasUrgentFee = urgentFeeInfo && urgentFeeInfo.current > 0;

      // 공유 메시지 데이터 구성
      const messageData = {
        title: hasUrgentFee 
          ? `🚨 긴급! ${jobData.siteName || jobData.title}`
          : `${jobData.siteName || jobData.title}`,
        description: hasUrgentFee
          ? `긴급 시공이 필요한 작업입니다.\n긴급 수수료: ${urgentFeeInfo.current}%\n기본 시공비: ${jobData.baseFee?.toLocaleString()}원`
          : `커튼 설치 작업이 등록되었습니다.\n기본 시공비: ${jobData.baseFee?.toLocaleString()}원`,
        imageUrl: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=커튼+설치+매칭",
        link: `${window.location.origin}/jobs/${jobData.id}`
      };

      await shareKakaoMessage(messageData);
      console.log("카카오 공유 성공");

    } catch (error) {
      console.error("카카오 공유 실패:", error);
      alert("카카오 공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 긴급 수수료 정보 추출 함수
  const getUrgentFeeInfo = (job) => {
    // 10분 간격 시스템
    if (job.urgentFeeEnabled !== undefined) {
      return {
        current: job.currentUrgentFeePercent || job.urgentFeePercent || 0,
        system: "10분 간격"
      };
    }
    
    // 1시간 간격 시스템
    if (job.baseUrgentFeePercent !== undefined) {
      return {
        current: job.currentUrgentFeePercent || job.baseUrgentFeePercent || 0,
        system: "1시간 간격"
      };
    }
    
    return null;
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
        loading
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-yellow-400 hover:bg-yellow-500 text-black"
      } ${className}`}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
          공유 중...
        </div>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c5.799 0 10.5 4.701 10.5 10.5S17.799 24 12 24S1.5 19.299 1.5 13.5S6.201 3 12 3m0 1.5c-4.971 0-9 4.029-9 9s4.029 9 9 9s9-4.029 9-9s-4.029-9-9-9z"/>
            <path d="M12 6.75c-3.314 0-6 2.686-6 6s2.686 6 6 6s6-2.686 6-6s-2.686-6-6-6zm0 1.5c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5z"/>
          </svg>
          카카오톡 공유
        </>
      )}
    </button>
  );
};

export default KakaoShare; 