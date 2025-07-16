import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { getGradeStyle } from "../utils/gradeCalculator";

const firestore = getFirestore();

const ContractorReport = ({ contractorId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch contractor data
        const docRef = doc(firestore, "contractors", contractorId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError("시공기사를 찾을 수 없습니다.");
          return;
        }

        const contractorData = docSnap.data();
        setReport(contractorData);

        // Fetch recent evaluations
        const evaluationsRef = collection(firestore, "evaluations");
        const evaluationsQuery = query(
          evaluationsRef,
          where("contractorId", "==", contractorId),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        
        const evaluationsSnap = await getDocs(evaluationsQuery);
        const evaluations = evaluationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentEvaluations(evaluations);

        // Calculate additional statistics
        const calculatedStats = calculateStatistics(contractorData, evaluations);
        setStats(calculatedStats);

      } catch (error) {
        console.error("리포트 로드 오류:", error);
        setError("리포트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [contractorId]);

  const calculateStatistics = (contractorData, evaluations) => {
    const ratings = contractorData.ratings || [];
    const gradeHistory = contractorData.gradeHistory || [];
    
    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      const avgRating = Object.values(rating.ratings || rating).reduce((sum, val) => sum + val, 0) / Object.keys(rating.ratings || rating).length;
      const roundedRating = Math.round(avgRating);
      ratingDistribution[roundedRating]++;
    });

    // Category averages
    const categories = ['quality', 'punctuality', 'costSaving', 'communication', 'professionalism'];
    const categoryAverages = {};
    
    categories.forEach(category => {
      const categoryRatings = ratings
        .map(rating => rating.ratings?.[category] || rating[category])
        .filter(rating => rating !== undefined);
      
      if (categoryRatings.length > 0) {
        categoryAverages[category] = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
      }
    });

    // Recent trend (last 5 evaluations)
    const recentRatings = ratings.slice(-5);
    const recentAverage = recentRatings.length > 0 
      ? recentRatings.reduce((sum, rating) => {
          const avgRating = Object.values(rating.ratings || rating).reduce((sum, val) => sum + val, 0) / Object.keys(rating.ratings || rating).length;
          return sum + avgRating;
        }, 0) / recentRatings.length
      : 0;

    // Grade trend
    const gradeTrend = gradeHistory.length > 1 ? {
      from: gradeHistory[0]?.fromGrade || 'C',
      to: gradeHistory[gradeHistory.length - 1]?.toGrade || contractorData.grade || 'C',
      changes: gradeHistory.length - 1
    } : null;

    return {
      ratingDistribution,
      categoryAverages,
      recentAverage,
      gradeTrend,
      totalJobs: contractorData.completedJobs || 0,
      satisfactionRate: ratings.length > 0 ? (ratingDistribution[4] + ratingDistribution[5]) / ratings.length * 100 : 0
    };
  };

  const getCategoryName = (category) => {
    const names = {
      quality: '품질',
      punctuality: '시간 준수',
      costSaving: '비용 절약',
      communication: '의사소통',
      professionalism: '전문성'
    };
    return names[category] || category;
  };

  const getGradeDescription = (grade) => {
    const descriptions = {
      A: '최고 등급 - 우수한 품질과 서비스',
      B: '우수 등급 - 안정적인 품질',
      C: '일반 등급 - 기본 품질 보장',
      D: '개선 필요 - 품질 향상 필요'
    };
    return descriptions[grade] || '등급 정보 없음';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">시공기사 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const gradeStyle = getGradeStyle(report.grade || 'C');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {report.profile?.name || report.name || '이름 없음'} 평가 리포트
            </h2>
            <p className="text-gray-600">시공기사 ID: {contractorId}</p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
              {report.grade || 'C'}등급
            </span>
            <p className="text-sm text-gray-500 mt-1">{getGradeDescription(report.grade || 'C')}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {report.averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="text-sm text-blue-700">평균 평점</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {report.totalRatings || report.totalEvaluations || 0}
            </div>
            <div className="text-sm text-green-700">평가 건수</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalJobs || 0}
            </div>
            <div className="text-sm text-purple-700">완료 작업</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.satisfactionRate?.toFixed(1) || '0'}%
            </div>
            <div className="text-sm text-orange-700">만족도</div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">평점 분포</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution?.[rating] || 0;
            const total = report.totalRatings || report.totalEvaluations || 1;
            const percentage = (count / total) * 100;
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="w-8 text-sm font-medium text-gray-600">{rating}점</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {count}건 ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Averages */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 평균 평점</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.categoryAverages || {}).map(([category, average]) => (
            <div key={category} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">{getCategoryName(category)}</span>
                <span className="text-lg font-bold text-blue-600">{average.toFixed(1)}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    className={`text-lg ${star <= average ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 평가</h3>
        {recentEvaluations.length > 0 ? (
          <div className="space-y-4">
            {recentEvaluations.map((evaluation, index) => {
              const avgRating = Object.values(evaluation.ratings || evaluation).reduce((sum, val) => sum + val, 0) / Object.keys(evaluation.ratings || evaluation).length;
              
              return (
                <div key={evaluation.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        평가 #{recentEvaluations.length - index}
                      </div>
                      <div className="text-sm text-gray-500">
                        {evaluation.createdAt?.toDate?.().toLocaleDateString() || '날짜 없음'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{avgRating.toFixed(1)}</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star} 
                            className={`text-sm ${star <= avgRating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {evaluation.comment && (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                      "{evaluation.comment}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">최근 평가가 없습니다.</p>
        )}
      </div>

      {/* Grade History */}
      {stats.gradeTrend && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">등급 변동 이력</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.gradeTrend.from}</div>
              <div className="text-sm text-gray-500">이전 등급</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.gradeTrend.to}</div>
              <div className="text-sm text-gray-500">현재 등급</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm text-gray-500">변동 횟수</div>
              <div className="text-lg font-bold text-gray-900">{stats.gradeTrend.changes}회</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trend */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 평가 추이</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.recentAverage?.toFixed(1) || '0.0'}
            </div>
            <div className="text-sm text-gray-500">최근 5건 평균</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">전체 평균 대비</div>
            <div className={`text-lg font-bold ${
              stats.recentAverage > (report.averageRating || 0) 
                ? 'text-green-600' 
                : stats.recentAverage < (report.averageRating || 0) 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {stats.recentAverage > (report.averageRating || 0) ? '↑' : 
               stats.recentAverage < (report.averageRating || 0) ? '↓' : '→'}
              {Math.abs((stats.recentAverage || 0) - (report.averageRating || 0)).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      {report.profile && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.profile.phone && (
              <div>
                <div className="text-sm text-gray-500">전화번호</div>
                <div className="font-medium">{report.profile.phone}</div>
              </div>
            )}
            {report.profile.email && (
              <div>
                <div className="text-sm text-gray-500">이메일</div>
                <div className="font-medium">{report.profile.email}</div>
              </div>
            )}
            {report.profile.address && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">주소</div>
                <div className="font-medium">{report.profile.address}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorReport; 