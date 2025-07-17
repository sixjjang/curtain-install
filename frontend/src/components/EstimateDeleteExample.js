import React, { useState } from 'react';
import { deleteEstimate } from '../utils/deleteEstimate';

export default function EstimateDeleteExample() {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const handleDeleteEstimate = async (estimateId) => {
    // 사용자 확인
    const isConfirmed = window.confirm(
      '정말로 이 견적을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleting(true);
      setMessage('삭제 중...');
      
      await deleteEstimate(estimateId);
      
      setMessage('견적이 성공적으로 삭제되었습니다!');
      
      // 3초 후 메시지 초기화
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (error) {
      setMessage(`삭제 실패: ${error.message}`);
      console.error('견적 삭제 오류:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteWithCustomConfirmation = async (estimateId, estimateName) => {
    // 커스텀 확인 다이얼로그
    const isConfirmed = window.confirm(
      `견적 "${estimateName}"을(를) 삭제하시겠습니까?\n\n` +
      '⚠️ 주의사항:\n' +
      '• 이 작업은 되돌릴 수 없습니다\n' +
      '• 관련된 모든 데이터가 영구적으로 삭제됩니다\n' +
      '• 계약자에게 할당된 견적인 경우 할당도 해제됩니다'
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setDeleting(true);
      setMessage(`견적 "${estimateName}" 삭제 중...`);
      
      await deleteEstimate(estimateId);
      
      setMessage(`견적 "${estimateName}"이(가) 성공적으로 삭제되었습니다!`);
      
      // 3초 후 메시지 초기화
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (error) {
      setMessage(`삭제 실패: ${error.message}`);
      console.error('견적 삭제 오류:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">견적 삭제 예시</h2>
        
        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('성공') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : message.includes('실패') 
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* 기본 삭제 예시 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">기본 삭제</h3>
            <p className="text-gray-600 mb-3">
              간단한 확인 다이얼로그와 함께 견적을 삭제합니다.
            </p>
            <button
              onClick={() => handleDeleteEstimate('example-estimate-id')}
              disabled={deleting}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '견적 삭제'}
            </button>
          </div>

          {/* 커스텀 확인 다이얼로그 예시 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">상세 확인 다이얼로그</h3>
            <p className="text-gray-600 mb-3">
              더 자세한 정보와 함께 견적을 삭제합니다.
            </p>
            <button
              onClick={() => handleDeleteWithCustomConfirmation('example-estimate-id-2', '커튼 설치 견적')}
              disabled={deleting}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '상세 확인으로 삭제'}
            </button>
          </div>

          {/* 사용법 설명 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">사용 방법</h3>
            <div className="text-blue-700 space-y-2">
              <p><strong>1. 기본 사용법:</strong></p>
              <pre className="bg-blue-100 p-2 rounded text-sm overflow-x-auto">
{`import { deleteEstimate } from '../utils/deleteEstimate';

// 견적 삭제
await deleteEstimate('estimate-id');`}
              </pre>
              
              <p><strong>2. 에러 처리:</strong></p>
              <pre className="bg-blue-100 p-2 rounded text-sm overflow-x-auto">
{`try {
  await deleteEstimate(estimateId);
  console.log('삭제 성공');
} catch (error) {
  console.error('삭제 실패:', error.message);
}`}
              </pre>
              
              <p><strong>3. 사용자 확인:</strong></p>
              <pre className="bg-blue-100 p-2 rounded text-sm overflow-x-auto">
{`const isConfirmed = window.confirm('정말 삭제하시겠습니까?');
if (isConfirmed) {
  await deleteEstimate(estimateId);
}`}
              </pre>
            </div>
          </div>

          {/* 주의사항 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">주의사항</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• 견적 삭제는 되돌릴 수 없는 작업입니다</li>
              <li>• 삭제 전 반드시 사용자 확인을 받아야 합니다</li>
              <li>• 관련된 모든 데이터가 영구적으로 삭제됩니다</li>
              <li>• 권한이 있는 사용자만 삭제할 수 있도록 제한해야 합니다</li>
              <li>• 삭제 로그를 남기는 것을 권장합니다</li>
            </ul>
          </div>

          {/* 기능 목록 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">기능</h3>
            <ul className="text-green-700 space-y-1">
              <li>✅ Firestore에서 견적 문서 완전 삭제</li>
              <li>✅ 적절한 에러 처리 및 로깅</li>
              <li>✅ 사용자 확인 다이얼로그 지원</li>
              <li>✅ 로딩 상태 관리</li>
              <li>✅ 성공/실패 메시지 표시</li>
              <li>✅ TypeScript 및 JavaScript 지원</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 