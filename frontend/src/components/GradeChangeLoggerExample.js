import React, { useState } from 'react';
import { useGradeChangeLogger } from '../hooks/useGradeChangeLogger';

const GradeChangeLoggerExample = () => {
  const [formData, setFormData] = useState({
    contractorId: '',
    oldLevel: 1,
    newLevel: 2,
    reason: '',
    adminId: '',
    evaluationId: ''
  });

  const { 
    loading, 
    error, 
    logGradeChange, 
    clearError 
  } = useGradeChangeLogger();

  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'oldLevel' || name === 'newLevel' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    clearError();

    try {
      const response = await logGradeChange(formData);
      setResult(response);
      
      // 폼 초기화
      setFormData({
        contractorId: '',
        oldLevel: 1,
        newLevel: 2,
        reason: '',
        adminId: '',
        evaluationId: ''
      });
    } catch (err) {
      console.error('등급 변경 로그 기록 실패:', err);
    }
  };

  const gradeOptions = [
    { value: 1, label: '1 - 브론즈' },
    { value: 2, label: '2 - 실버' },
    { value: 3, label: '3 - 골드' },
    { value: 4, label: '4 - 플래티넘' },
    { value: 5, label: '5 - 다이아몬드' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            등급 변경 로그 기록 시스템
          </h1>
          <p className="text-gray-600">
            계약자의 등급 변경을 기록하고 관리합니다.
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  오류가 발생했습니다
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 성공 결과 표시 */}
        {result && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  등급 변경이 성공적으로 기록되었습니다
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  로그 ID: {result.logId}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 등급 변경 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            등급 변경 정보 입력
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 계약자 ID */}
            <div>
              <label htmlFor="contractorId" className="block text-sm font-medium text-gray-700 mb-2">
                계약자 ID *
              </label>
              <input
                type="text"
                id="contractorId"
                name="contractorId"
                value={formData.contractorId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="계약자 ID를 입력하세요"
              />
            </div>

            {/* 기존 등급 */}
            <div>
              <label htmlFor="oldLevel" className="block text-sm font-medium text-gray-700 mb-2">
                기존 등급 *
              </label>
              <select
                id="oldLevel"
                name="oldLevel"
                value={formData.oldLevel}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {gradeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 새로운 등급 */}
            <div>
              <label htmlFor="newLevel" className="block text-sm font-medium text-gray-700 mb-2">
                새로운 등급 *
              </label>
              <select
                id="newLevel"
                name="newLevel"
                value={formData.newLevel}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {gradeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 변경 사유 */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                변경 사유
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="등급 변경 사유를 입력하세요 (선택사항)"
              />
            </div>

            {/* 관리자 ID */}
            <div>
              <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-2">
                관리자 ID
              </label>
              <input
                type="text"
                id="adminId"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="관리자 ID를 입력하세요 (선택사항)"
              />
            </div>

            {/* 평가 ID */}
            <div>
              <label htmlFor="evaluationId" className="block text-sm font-medium text-gray-700 mb-2">
                평가 ID
              </label>
              <input
                type="text"
                id="evaluationId"
                name="evaluationId"
                value={formData.evaluationId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="평가 ID를 입력하세요 (선택사항)"
              />
            </div>

            {/* 변경 미리보기 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">변경 미리보기</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">기존 등급:</span>
                  <div className="text-lg font-semibold">
                    {gradeOptions.find(opt => opt.value === formData.oldLevel)?.label}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">새로운 등급:</span>
                  <div className="text-lg font-semibold">
                    {gradeOptions.find(opt => opt.value === formData.newLevel)?.label}
                  </div>
                </div>
              </div>
              {formData.oldLevel !== formData.newLevel && (
                <div className="mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.newLevel > formData.oldLevel 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    {formData.newLevel > formData.oldLevel ? '등급 상승' : '등급 하락'}
                  </span>
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.contractorId}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '기록 중...' : '등급 변경 기록'}
              </button>
            </div>
          </form>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 필수 입력:</strong> 계약자 ID, 기존 등급, 새로운 등급은 필수 입력 항목입니다.</p>
            <p><strong>• 선택 입력:</strong> 변경 사유, 관리자 ID, 평가 ID는 선택 입력 항목입니다.</p>
            <p><strong>• 등급 범위:</strong> 등급은 1(브론즈)부터 5(다이아몬드)까지 설정 가능합니다.</p>
            <p><strong>• 자동 기록:</strong> 등급 변경 시 자동으로 로그가 기록되고 계약자 정보가 업데이트됩니다.</p>
            <p><strong>• 호환성:</strong> 기존 levelChangeNotifications 컬렉션과 호환되도록 데이터가 저장됩니다.</p>
          </div>
        </div>

        {/* 빠른 테스트 버튼들 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 테스트</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setFormData({
                contractorId: 'test_contractor_1',
                oldLevel: 1,
                newLevel: 2,
                reason: '테스트 - 등급 상승',
                adminId: 'test_admin',
                evaluationId: 'test_eval_1'
              })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              등급 상승 테스트
            </button>
            <button
              onClick={() => setFormData({
                contractorId: 'test_contractor_2',
                oldLevel: 3,
                newLevel: 2,
                reason: '테스트 - 등급 하락',
                adminId: 'test_admin',
                evaluationId: 'test_eval_2'
              })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              등급 하락 테스트
            </button>
            <button
              onClick={() => setFormData({
                contractorId: 'test_contractor_3',
                oldLevel: 2,
                newLevel: 5,
                reason: '테스트 - 최고 등급 승급',
                adminId: 'test_admin',
                evaluationId: 'test_eval_3'
              })}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              최고 등급 테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeChangeLoggerExample; 