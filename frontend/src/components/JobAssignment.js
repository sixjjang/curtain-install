import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { assignJob, assignContractor, gradeRank, matchJob } from '../utils/contractorAssignment';
import { getGradeStyle } from '../utils/gradeCalculator';

const JobAssignment = ({ job, onAssignmentComplete }) => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignmentMode, setAssignmentMode] = useState('simple'); // 'simple' or 'comprehensive'
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState({
    maxDistance: 50,
    minRating: 0,
    requireExperience: false,
    priority: 'grade',
    maxCandidates: 10,
    autoAssign: false
  });

  // 시공기사 데이터 로드
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const contractorsRef = collection(db, 'contractors');
        const q = query(contractorsRef, where('active', '==', true));
        const snapshot = await getDocs(q);
        
        const contractorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          available: true // 기본값 설정
        }));
        
        setContractors(contractorsData);
      } catch (error) {
        console.error('시공기사 데이터 로드 오류:', error);
        setError('시공기사 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  // 간단한 배정 실행
  const handleSimpleAssignment = () => {
    try {
      setError('');
      setAssignmentResult(null);

      const assignedContractorId = assignJob(job, contractors);
      
      if (assignedContractorId) {
        const assignedContractor = contractors.find(c => c.id === assignedContractorId);
        setAssignmentResult({
          success: true,
          message: `시공기사가 배정되었습니다: ${assignedContractor.name} (${assignedContractor.grade}등급)`,
          assignment: {
            contractorId: assignedContractorId,
            contractorName: assignedContractor.name,
            grade: assignedContractor.grade,
            estimatedCost: assignedContractor.estimatedCost || job.budget * 0.8
          }
        });
        
        onAssignmentComplete?.({
          contractorId: assignedContractorId,
          contractorName: assignedContractor.name,
          jobId: job.id,
          assignedAt: new Date()
        });
      } else {
        setAssignmentResult({
          success: false,
          message: '조건을 만족하는 시공기사가 없습니다.'
        });
      }
    } catch (error) {
      console.error('간단한 배정 오류:', error);
      setError('배정 처리 중 오류가 발생했습니다.');
    }
  };

  // 종합 배정 실행
  const handleComprehensiveAssignment = async () => {
    try {
      setError('');
      setAssignmentResult(null);

      const result = assignContractor(contractors, job, assignmentOptions);
      setAssignmentResult(result);

      if (result.success && result.assignment) {
        onAssignmentComplete?.(result.assignment);
      }
    } catch (error) {
      console.error('종합 배정 오류:', error);
      setError('배정 처리 중 오류가 발생했습니다.');
    }
  };

  // 배정 실행
  const handleAssignment = () => {
    if (assignmentMode === 'simple') {
      handleSimpleAssignment();
    } else {
      handleComprehensiveAssignment();
    }
  };

  // 수동 배정
  const handleManualAssignment = (contractor) => {
    const assignment = {
      contractorId: contractor.id,
      contractorName: contractor.name,
      jobId: job.id,
      assignedAt: new Date(),
      estimatedCost: contractor.estimatedCost || job.budget * 0.8
    };

    onAssignmentComplete?.(assignment);
    setAssignmentResult({
      success: true,
      message: `수동 배정 완료: ${contractor.name}`,
      assignment
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 배정 모드 선택 */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">시공기사 배정</h3>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setAssignmentMode('simple')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              assignmentMode === 'simple'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            간단한 배정
          </button>
          <button
            onClick={() => setAssignmentMode('comprehensive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              assignmentMode === 'comprehensive'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            종합 배정
          </button>
        </div>

        {/* 배정 옵션 (종합 모드) */}
        {assignmentMode === 'comprehensive' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최대 거리 (km)
              </label>
              <input
                type="number"
                value={assignmentOptions.maxDistance}
                onChange={(e) => setAssignmentOptions(prev => ({
                  ...prev,
                  maxDistance: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 평점
              </label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                우선순위
              </label>
              <select
                value={assignmentOptions.priority}
                onChange={(e) => setAssignmentOptions(prev => ({
                  ...prev,
                  priority: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="grade">등급 우선</option>
                <option value="distance">거리 우선</option>
                <option value="rating">평점 우선</option>
                <option value="composite">종합 점수</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최대 후보 수
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={assignmentOptions.maxCandidates}
                onChange={(e) => setAssignmentOptions(prev => ({
                  ...prev,
                  maxCandidates: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAssign"
                checked={assignmentOptions.autoAssign}
                onChange={(e) => setAssignmentOptions(prev => ({
                  ...prev,
                  autoAssign: e.target.checked
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoAssign" className="ml-2 block text-sm text-gray-900">
                자동 배정
              </label>
            </div>
          </div>
        )}

        {/* 배정 실행 버튼 */}
        <button
          onClick={handleAssignment}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          {assignmentMode === 'simple' ? '간단한 배정 실행' : '종합 배정 실행'}
        </button>

        {/* 오류 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 배정 결과 */}
        {assignmentResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            assignmentResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`font-medium ${
              assignmentResult.success ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {assignmentResult.message}
            </p>
            
            {assignmentResult.assignment && (
              <div className="mt-2 text-sm text-gray-600">
                <p>시공기사: {assignmentResult.assignment.contractorName}</p>
                <p>예상 비용: {assignmentResult.assignment.estimatedCost?.toLocaleString()}원</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 시공기사 목록 */}
      {assignmentMode === 'comprehensive' && assignmentResult?.candidates && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            배정 후보 ({assignmentResult.candidates.length}명)
          </h3>
          
          <div className="space-y-4">
            {assignmentResult.candidates.map((contractor, index) => {
              const gradeStyle = getGradeStyle(contractor.grade || 'C');
              
              return (
                <div key={contractor.id} className="border rounded-lg p-4">
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
                          <span>평점: {contractor.averageRating?.toFixed(1) || 0}</span>
                          <span>거리: {contractor.distance?.toFixed(1)}km</span>
                          <span>종합점수: {contractor.compositeScore || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManualAssignment(contractor)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        배정
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 전체 시공기사 목록 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            전체 시공기사 ({contractors.length}명)
          </h3>
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
                    <div>평점: {contractor.averageRating?.toFixed(1) || 0}</div>
                    <div>활성: {contractor.active ? "예" : "아니오"}</div>
                    <div>가용: {contractor.available ? "예" : "아니오"}</div>
                    <div>등급순위: {gradeRank(contractor.grade || 'C')}</div>
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

export default JobAssignment; 