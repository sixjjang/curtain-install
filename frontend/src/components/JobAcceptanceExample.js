import React, { useState } from 'react';
import { useJobManager } from '../hooks/useJobManager';

const JobAcceptanceExample = () => {
  const [formData, setFormData] = useState({
    jobId: '',
    contractorId: '',
    reason: ''
  });

  const [options, setOptions] = useState({
    notifySeller: true,
    createAssignment: true,
    validateContractor: true,
    logActivity: true
  });

  const [selectedAction, setSelectedAction] = useState('accept'); // accept, decline, complete
  const [completionData, setCompletionData] = useState({
    notes: '',
    photos: [],
    quality: 5
  });

  const { 
    loading, 
    error, 
    success, 
    acceptJob, 
    declineJob, 
    completeJob, 
    canAcceptJob,
    clearState 
  } = useJobManager();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (field, value) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompletionDataChange = (field, value) => {
    setCompletionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearState();

    try {
      let result;

      switch (selectedAction) {
        case 'accept':
          result = await acceptJob(formData.jobId, formData.contractorId, options);
          break;
        case 'decline':
          result = await declineJob(formData.jobId, formData.contractorId, formData.reason);
          break;
        case 'complete':
          result = await completeJob(formData.jobId, formData.contractorId, completionData);
          break;
        default:
          throw new Error('알 수 없는 작업입니다.');
      }

      console.log('작업 결과:', result);
      
      // 폼 초기화
      setFormData({
        jobId: '',
        contractorId: '',
        reason: ''
      });
      setCompletionData({
        notes: '',
        photos: [],
        quality: 5
      });
    } catch (err) {
      console.error('작업 실패:', err);
    }
  };

  const handleCheckCanAccept = async () => {
    if (!formData.jobId || !formData.contractorId) {
      alert('작업 ID와 시공기사 ID를 입력해주세요.');
      return;
    }

    try {
      const result = await canAcceptJob(formData.contractorId, formData.jobId);
      alert(result.canAccept ? '작업을 수락할 수 있습니다.' : `수락 불가: ${result.reason}`);
    } catch (err) {
      alert('확인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            작업 관리 시스템
          </h1>
          <p className="text-gray-600">
            작업 수락, 거절, 완료를 관리하는 종합 시스템입니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">성공</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 작업 관리 폼 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">작업 관리</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 작업 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업 유형
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAction('accept')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedAction === 'accept'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAction('decline')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedAction === 'decline'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    거절
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAction('complete')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      selectedAction === 'complete'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    완료
                  </button>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
                    작업 ID *
                  </label>
                  <input
                    type="text"
                    id="jobId"
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="작업 ID를 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="contractorId" className="block text-sm font-medium text-gray-700 mb-2">
                    시공기사 ID *
                  </label>
                  <input
                    type="text"
                    id="contractorId"
                    name="contractorId"
                    value={formData.contractorId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="시공기사 ID를 입력하세요"
                  />
                </div>

                {/* 거절 사유 (거절 시에만 표시) */}
                {selectedAction === 'decline' && (
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                      거절 사유
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="거절 사유를 입력하세요 (선택사항)"
                    />
                  </div>
                )}

                {/* 완료 정보 (완료 시에만 표시) */}
                {selectedAction === 'complete' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        완료 노트
                      </label>
                      <textarea
                        id="notes"
                        value={completionData.notes}
                        onChange={(e) => handleCompletionDataChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="완료 관련 노트를 입력하세요"
                      />
                    </div>

                    <div>
                      <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-2">
                        작업 품질 (1-5)
                      </label>
                      <input
                        type="number"
                        id="quality"
                        value={completionData.quality}
                        onChange={(e) => handleCompletionDataChange('quality', parseInt(e.target.value))}
                        min="1"
                        max="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || !formData.jobId || !formData.contractorId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : `${selectedAction === 'accept' ? '수락' : selectedAction === 'decline' ? '거절' : '완료'}하기`}
                </button>
                
                {selectedAction === 'accept' && (
                  <button
                    type="button"
                    onClick={handleCheckCanAccept}
                    disabled={!formData.jobId || !formData.contractorId}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    수락 가능 여부 확인
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* 옵션 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">옵션 설정</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifySeller"
                  checked={options.notifySeller}
                  onChange={(e) => handleOptionChange('notifySeller', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notifySeller" className="ml-2 text-sm font-medium text-gray-700">
                  판매자 알림 발송
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createAssignment"
                  checked={options.createAssignment}
                  onChange={(e) => handleOptionChange('createAssignment', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createAssignment" className="ml-2 text-sm font-medium text-gray-700">
                  작업 배정 기록 생성
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="validateContractor"
                  checked={options.validateContractor}
                  onChange={(e) => handleOptionChange('validateContractor', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="validateContractor" className="ml-2 text-sm font-medium text-gray-700">
                  시공기사 검증
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="logActivity"
                  checked={options.logActivity}
                  onChange={(e) => handleOptionChange('logActivity', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="logActivity" className="ml-2 text-sm font-medium text-gray-700">
                  활동 로그 기록
                </label>
              </div>
            </div>

            {/* 옵션 설명 */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">옵션 설명</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>• 판매자 알림:</strong> 작업 상태 변경 시 판매자에게 알림을 발송합니다.</p>
                <p><strong>• 배정 기록:</strong> 작업 배정 정보를 별도 컬렉션에 기록합니다.</p>
                <p><strong>• 시공기사 검증:</strong> 시공기사 상태와 동시 작업 수를 검증합니다.</p>
                <p><strong>• 활동 로그:</strong> 모든 작업 활동을 로그로 기록합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 테스트 버튼들 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 테스트</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setFormData({
                  jobId: 'test_job_1',
                  contractorId: 'test_contractor_1',
                  reason: ''
                });
                setSelectedAction('accept');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              작업 수락 테스트
            </button>
            <button
              onClick={() => {
                setFormData({
                  jobId: 'test_job_2',
                  contractorId: 'test_contractor_2',
                  reason: '스케줄 충돌'
                });
                setSelectedAction('decline');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              작업 거절 테스트
            </button>
            <button
              onClick={() => {
                setFormData({
                  jobId: 'test_job_3',
                  contractorId: 'test_contractor_3',
                  reason: ''
                });
                setSelectedAction('complete');
                setCompletionData({
                  notes: '정상적으로 완료되었습니다.',
                  photos: [],
                  quality: 5
                });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              작업 완료 테스트
            </button>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 작업 수락:</strong> 시공기사가 작업을 수락하면 상태가 'assigned'로 변경됩니다.</p>
            <p><strong>• 작업 거절:</strong> 작업을 거절하면 거절 기록이 남고 작업은 계속 모집 상태를 유지합니다.</p>
            <p><strong>• 작업 완료:</strong> 작업 완료 시 상태가 'completed'로 변경되고 시공기사 통계가 업데이트됩니다.</p>
            <p><strong>• 트랜잭션:</strong> 모든 작업은 Firestore 트랜잭션으로 안전하게 처리됩니다.</p>
            <p><strong>• 알림 시스템:</strong> 작업 상태 변경 시 관련자에게 자동으로 알림이 발송됩니다.</p>
            <p><strong>• 활동 로그:</strong> 모든 작업 활동이 상세하게 로그로 기록됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAcceptanceExample; 