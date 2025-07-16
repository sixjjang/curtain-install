import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { assignContractor, validateAssignment } from "../utils/contractorAssignment";
import { getGradeStyle } from "../utils/gradeCalculator";

const ContractorAssignment = ({ job, onAssignmentComplete }) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState({
    maxDistance: 50,
    minRating: 0,
    requireExperience: false,
    priority: "grade",
    maxCandidates: 10,
    autoAssign: false
  });

  // 시공기사 데이터 로드
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const contractorsRef = collection(db, "contractors");
        const q = query(contractorsRef, where("active", "==", true));
        const snapshot = await getDocs(q);
        
        const contractorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setContractors(contractorsData);
      } catch (error) {
        console.error("시공기사 데이터 로드 오류:", error);
        setError("시공기사 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  // 배정 실행
  const handleAssignment = async () => {
    try {
      setLoading(true);
      setError("");

      const result = assignContractor(contractors, job, assignmentOptions);
      setAssignmentResult(result);

      if (result.success && result.assignment) {
        // 자동 배정된 경우
        const validation = validateAssignment(result.assignment, job);
        if (validation.isValid) {
          onAssignmentComplete?.(result.assignment);
        } else {
          setError(`배정 검증 실패: ${validation.errors.join(", ")}`);
        }
      }
    } catch (error) {
      console.error("배정 오류:", error);
      setError("배정 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 수동 배정
  const handleManualAssignment = (contractor) => {
    const assignment = {
      contractorId: contractor.id,
      contractorName: contractor.name,
      jobId: job.id,
      jobTitle: job.title,
      assignedAt: new Date(),
      status: 'assigned',
      estimatedCost: contractor.estimatedCost || job.budget * 0.8,
      estimatedDuration: job.duration || 8,
      notes: `수동 배정: ${contractor.grade}등급, 평점 ${contractor.averageRating}`
    };

    const validation = validateAssignment(assignment, job);
    if (validation.isValid) {
      onAssignmentComplete?.(assignment);
    } else {
      setError(`배정 검증 실패: ${validation.errors.join(", ")}`);
    }
  };

  if (loading && contractors.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6 border mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">시공기사 배정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">작업 정보</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>제목:</strong> {job.title}</p>
              <p><strong>날짜:</strong> {job.date?.toLocaleDateString()}</p>
              <p><strong>예산:</strong> {job.budget?.toLocaleString()}원</p>
              <p><strong>위치:</strong> {job.location?.address || "위치 정보 없음"}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">배정 옵션</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">최대 거리:</label>
                <input
                  type="number"
                  value={assignmentOptions.maxDistance}
                  onChange={(e) => setAssignmentOptions(prev => ({
                    ...prev,
                    maxDistance: parseInt(e.target.value)
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-500">km</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">최소 평점:</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={assignmentOptions.minRating}
                  onChange={(e) => setAssignmentOptions(prev => ({
                    ...prev,
                    minRating: parseFloat(e.target.value)
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">우선순위:</label>
                <select
                  value={assignmentOptions.priority}
                  onChange={(e) => setAssignmentOptions(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="grade">등급순</option>
                  <option value="distance">거리순</option>
                  <option value="rating">평점순</option>
                  <option value="composite">종합순</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배정 버튼 */}
      <div className="bg-white rounded-xl shadow-md p-6 border mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">배정 실행</h3>
            <p className="text-sm text-gray-600">
              조건에 맞는 시공기사를 찾아 배정합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAssignment}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "배정 중..." : "자동 배정"}
            </button>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignmentOptions.autoAssign}
                onChange={(e) => setAssignmentOptions(prev => ({
                  ...prev,
                  autoAssign: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">즉시 배정</span>
            </label>
          </div>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 배정 결과 */}
      {assignmentResult && (
        <div className="bg-white rounded-xl shadow-md p-6 border mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">배정 결과</h3>
          
          {assignmentResult.success ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">{assignmentResult.message}</p>
              </div>

              {/* 통계 */}
              {assignmentResult.stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {assignmentResult.stats.totalCandidates}
                    </div>
                    <div className="text-sm text-blue-600">후보 수</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {assignmentResult.stats.averageRating?.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-600">평균 평점</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {assignmentResult.stats.averageDistance?.toFixed(1)}km
                    </div>
                    <div className="text-sm text-yellow-600">평균 거리</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {assignmentResult.stats.topGrade}
                    </div>
                    <div className="text-sm text-purple-600">최고 등급</div>
                  </div>
                </div>
              )}

              {/* 후보 목록 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">추천 시공기사</h4>
                <div className="space-y-3">
                  {assignmentResult.candidates.map((contractor, index) => {
                    const gradeStyle = getGradeStyle(contractor.grade || "C");
                    
                    return (
                      <div key={contractor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {contractor.profileImage ? (
                                <img 
                                  src={contractor.profileImage} 
                                  alt="프로필" 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg">👷</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900">
                                  {contractor.name || "이름 없음"}
                                </h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
                                  {contractor.grade || "C"}등급
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>평점: {contractor.averageRating || 0}</span>
                                <span>거리: {contractor.distance?.toFixed(1)}km</span>
                                <span>예상 비용: {contractor.estimatedCost?.toLocaleString()}원</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contractor.compositeScore && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  종합 점수: {contractor.compositeScore}
                                </div>
                                <div className="text-xs text-gray-500">
                                  순위: {index + 1}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => handleManualAssignment(contractor)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              배정하기
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">{assignmentResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* 전체 시공기사 목록 (디버깅용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">전체 시공기사 ({contractors.length}명)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractors.map(contractor => {
              const gradeStyle = getGradeStyle(contractor.grade || "C");
              
              return (
                <div key={contractor.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{contractor.name}</span>
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
                      {contractor.grade || "C"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>평점: {contractor.averageRating || 0}</div>
                    <div>활성: {contractor.active ? "예" : "아니오"}</div>
                    <div>가용일: {contractor.availableDates?.length || 0}일</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorAssignment; 