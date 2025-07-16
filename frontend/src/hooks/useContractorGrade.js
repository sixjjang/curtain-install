import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { calculateDetailedGrade, getGradeBenefits, getGradeStyle } from "../utils/gradeCalculator";

/**
 * 시공기사 등급 관리 훅
 * 실시간 등급 업데이트, 수동 등급 계산, 알림 발송 기능을 제공합니다.
 */
export const useContractorGrade = (contractorId) => {
  const [contractor, setContractor] = useState(null);
  const [gradeDetails, setGradeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const functions = getFunctions();

  // 실시간 시공기사 데이터 구독
  useEffect(() => {
    if (!contractorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      doc(db, "contractors", contractorId),
      (doc) => {
        if (doc.exists()) {
          const contractorData = doc.data();
          setContractor(contractorData);

          // 등급 상세 정보 계산
          if (contractorData.ratings && contractorData.ratings.length > 0) {
            const details = calculateDetailedGrade(contractorData.ratings);
            setGradeDetails(details);
          } else {
            setGradeDetails({
              grade: "C",
              averageRating: 0,
              totalRatings: 0,
              categoryScores: {},
              recommendations: ["평가 데이터가 없습니다."]
            });
          }
        } else {
          setContractor(null);
          setGradeDetails(null);
          setError("시공기사를 찾을 수 없습니다.");
        }
        setLoading(false);
      },
      (error) => {
        console.error("시공기사 데이터 구독 오류:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [contractorId]);

  // 수동 등급 업데이트
  const updateGrade = useCallback(async () => {
    if (!contractorId) return;

    setIsUpdating(true);
    setError("");

    try {
      const manualUpdateGrade = httpsCallable(functions, 'manualUpdateContractorGrade');
      const result = await manualUpdateGrade({ contractorId });
      
      console.log("등급 업데이트 결과:", result.data);
      return result.data;
    } catch (error) {
      console.error("등급 업데이트 오류:", error);
      setError("등급 업데이트 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [contractorId, functions]);

  // 평가 추가 및 등급 재계산
  const addRating = useCallback(async (ratingData) => {
    if (!contractorId) return;

    setIsUpdating(true);
    setError("");

    try {
      const contractorRef = doc(db, "contractors", contractorId);
      
      // 평가 데이터 추가
      await updateDoc(contractorRef, {
        ratings: arrayUnion(ratingData),
        lastRatingDate: new Date()
      });

      console.log("평가가 추가되었습니다.");
      return true;
    } catch (error) {
      console.error("평가 추가 오류:", error);
      setError("평가 추가 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [contractorId]);

  // 등급 히스토리 조회
  const getGradeHistory = useCallback(() => {
    if (!contractor?.gradeHistory) return [];
    
    return contractor.gradeHistory
      .sort((a, b) => b.date?.toDate?.() - a.date?.toDate?.())
      .map(history => ({
        ...history,
        date: history.date?.toDate?.() || new Date(history.date?.seconds * 1000)
      }));
  }, [contractor]);

  // 등급 변경 여부 확인
  const hasGradeChanged = useCallback(() => {
    if (!contractor?.gradeHistory || contractor.gradeHistory.length === 0) return false;
    
    const latestChange = contractor.gradeHistory[contractor.gradeHistory.length - 1];
    const changeDate = latestChange.date?.toDate?.() || new Date(latestChange.date?.seconds * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return changeDate > oneDayAgo;
  }, [contractor]);

  // 등급 상승 여부 확인
  const isGradeUpgrade = useCallback(() => {
    if (!contractor?.gradeHistory || contractor.gradeHistory.length < 2) return false;
    
    const latest = contractor.gradeHistory[contractor.gradeHistory.length - 1];
    const previous = contractor.gradeHistory[contractor.gradeHistory.length - 2];
    
    const gradePriority = { A: 4, B: 3, C: 2, D: 1 };
    return gradePriority[latest.toGrade] > gradePriority[previous.toGrade];
  }, [contractor]);

  // 등급별 혜택 정보
  const gradeBenefits = useMemo(() => {
    if (!gradeDetails?.grade) return null;
    return getGradeBenefits(gradeDetails.grade);
  }, [gradeDetails?.grade]);

  // 등급 스타일 정보
  const gradeStyle = useMemo(() => {
    if (!gradeDetails?.grade) return getGradeStyle("C");
    return getGradeStyle(gradeDetails.grade);
  }, [gradeDetails?.grade]);

  // 최근 평가 트렌드
  const recentTrend = useMemo(() => {
    if (!contractor?.ratings || contractor.ratings.length < 2) {
      return { trend: "stable", change: 0 };
    }

    const recentRatings = contractor.ratings.slice(-5);
    const olderRatings = contractor.ratings.slice(0, -5);

    if (olderRatings.length === 0) return { trend: "stable", change: 0 };

    const recentAverage = recentRatings.reduce((sum, rating) => {
      const ratingData = rating.ratings || rating;
      const values = Object.values(ratingData);
      return sum + (values.reduce((a, b) => a + b, 0) / values.length);
    }, 0) / recentRatings.length;

    const olderAverage = olderRatings.reduce((sum, rating) => {
      const ratingData = rating.ratings || rating;
      const values = Object.values(ratingData);
      return sum + (values.reduce((a, b) => a + b, 0) / values.length);
    }, 0) / olderRatings.length;

    const change = recentAverage - olderAverage;

    return {
      trend: change > 0.5 ? "improving" : change < -0.5 ? "declining" : "stable",
      change: Math.round(change * 10) / 10
    };
  }, [contractor?.ratings]);

  // 평점 분포 계산
  const ratingDistribution = useMemo(() => {
    if (!contractor?.ratings) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    contractor.ratings.forEach(rating => {
      const ratingData = rating.ratings || rating;
      const values = Object.values(ratingData);
      const average = values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
      const roundedAverage = Math.round(average);
      distribution[roundedAverage] = (distribution[roundedAverage] || 0) + 1;
    });

    return distribution;
  }, [contractor?.ratings]);

  // 만족도 계산 (4-5점 비율)
  const satisfactionRate = useMemo(() => {
    if (!contractor?.ratings || contractor.ratings.length === 0) return 0;

    const total = contractor.ratings.length;
    const satisfied = ratingDistribution[4] + ratingDistribution[5];
    
    return Math.round((satisfied / total) * 100);
  }, [contractor?.ratings, ratingDistribution]);

  // 최근 평가 (최근 5개)
  const recentRatings = useMemo(() => {
    if (!contractor?.ratings) return [];

    return contractor.ratings
      .slice(-5)
      .map(rating => ({
        ...rating,
        date: rating.date?.toDate?.() || new Date(rating.date?.seconds * 1000)
      }))
      .reverse();
  }, [contractor?.ratings]);

  return {
    // 상태
    contractor,
    gradeDetails,
    loading,
    error,
    isUpdating,

    // 등급 정보
    gradeBenefits,
    gradeStyle,
    recentTrend,
    ratingDistribution,
    satisfactionRate,
    recentRatings,

    // 히스토리
    gradeHistory: getGradeHistory(),
    hasGradeChanged: hasGradeChanged(),
    isGradeUpgrade: isGradeUpgrade(),

    // 액션
    updateGrade,
    addRating,

    // 유틸리티
    calculateGrade: () => gradeDetails ? calculateDetailedGrade(contractor?.ratings || []) : null
  };
};

/**
 * 모든 시공기사 등급 관리 훅
 * 관리자용으로 모든 시공기사의 등급을 관리합니다.
 */
export const useAllContractorGrades = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const functions = getFunctions();

  // 모든 시공기사 등급 업데이트
  const updateAllGrades = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const promises = contractors.map(contractor => 
        httpsCallable(functions, 'manualUpdateContractorGrade')({ contractorId: contractor.id })
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      console.log(`등급 업데이트 완료: 성공 ${successful.length}건, 실패 ${failed.length}건`);

      return {
        total: contractors.length,
        successful: successful.length,
        failed: failed.length,
        results: successful.map(result => result.value.data)
      };
    } catch (error) {
      console.error("전체 등급 업데이트 오류:", error);
      setError("등급 업데이트 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contractors, functions]);

  // 등급별 통계
  const gradeStats = useMemo(() => {
    const stats = { A: 0, B: 0, C: 0, D: 0, total: 0 };
    
    contractors.forEach(contractor => {
      const grade = contractor.grade || 'C';
      stats[grade]++;
      stats.total++;
    });

    return stats;
  }, [contractors]);

  // 평균 평점 통계
  const averageRatingStats = useMemo(() => {
    if (contractors.length === 0) return { average: 0, min: 0, max: 0 };

    const ratings = contractors
      .map(contractor => contractor.averageRating || 0)
      .filter(rating => rating > 0);

    if (ratings.length === 0) return { average: 0, min: 0, max: 0 };

    return {
      average: Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10,
      min: Math.min(...ratings),
      max: Math.max(...ratings)
    };
  }, [contractors]);

  return {
    contractors,
    loading,
    error,
    updateAllGrades,
    gradeStats,
    averageRatingStats
  };
};

export default useContractorGrade; 