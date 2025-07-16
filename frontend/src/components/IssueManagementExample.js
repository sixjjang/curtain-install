import React, { useState } from 'react';
import IssueManagement from './IssueManagement';

const IssueManagementExample = () => {
  const [adminId] = useState('admin123');
  const [managementHistory, setManagementHistory] = useState([]);

  const handleIssueUpdated = (updateInfo) => {
    // 이의신청 업데이트 처리
    const historyRecord = {
      id: Date.now(),
      issueId: updateInfo.issueId,
      status: updateInfo.status,
      adminId: updateInfo.adminId,
      timestamp: new Date().toLocaleString()
    };
    
    setManagementHistory(prev => [historyRecord, ...prev.slice(0, 9)]); // 최대 10개 유지
    
    // 성공 메시지
    console.log('이의신청 업데이트됨:', updateInfo);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            이의신청 관리 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>종합적인 이의신청 관리:</strong> 모든 품질 이의신청을 한 곳에서 관리</li>
              <li>• <strong>고급 필터링:</strong> 상태, 심각도, 카테고리, 날짜별 필터링</li>
              <li>• <strong>실시간 검색:</strong> 사진 ID, 내용, 요청 ID로 빠른 검색</li>
              <li>• <strong>일괄 처리:</strong> 여러 이의신청을 한 번에 해결/반려</li>
              <li>• <strong>상세 정보 보기:</strong> 각 이의신청의 완전한 정보 확인</li>
              <li>• <strong>통계 대시보드:</strong> 이의신청 현황을 한눈에 파악</li>
            </ul>
          </div>
        </div>

        {/* 관리 이력 */}
        {managementHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 관리 이력</h2>
            <div className="space-y-3">
              {managementHistory.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        이의신청 #{record.issueId.slice(-8)} 상태 변경
                      </h3>
                      <p className="text-sm text-gray-600">
                        관리자: {record.adminId} • 처리 시간: {record.timestamp}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : record.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status === 'resolved' && '해결됨'}
                        {record.status === 'rejected' && '반려됨'}
                        {record.status === 'pending' && '대기중'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이의신청 관리 컴포넌트 */}
        <div className="mb-6">
          <IssueManagement
            adminId={adminId}
            onIssueUpdated={handleIssueUpdated}
            showResolved={true}
            enableBulkActions={true}
          />
        </div>

        {/* 관리 가이드라인 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            이의신청 처리 가이드라인
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>해결 (Resolved):</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 문제가 해결되었거나 수용 가능한 수준으로 개선된 경우</li>
              <li>• 재촬영이 완료되어 품질이 개선된 경우</li>
              <li>• 이의신청 내용이 부당하거나 오해인 경우</li>
            </ul>
            <p><strong>반려 (Rejected):</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 이의신청 내용이 부당하거나 근거가 없는 경우</li>
              <li>• 이미 해결된 문제에 대한 중복 이의신청</li>
              <li>• 시스템 오류나 기술적 문제가 아닌 경우</li>
            </ul>
            <p><strong>처리 시 고려사항:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 이의신청의 심각도와 카테고리를 고려하여 판단</li>
              <li>• 관련 사진의 품질 점수와 이전 이력 확인</li>
              <li>• 일관성 있는 처리 기준 적용</li>
            </ul>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-green-800 space-y-2 text-sm">
            <p><strong>1. 이의신청 목록 확인:</strong> 모든 이의신청이 테이블 형태로 표시됩니다.</p>
            <p><strong>2. 필터링 및 검색:</strong> 상태, 심각도, 카테고리, 날짜별로 필터링하거나 검색어로 찾을 수 있습니다.</p>
            <p><strong>3. 개별 처리:</strong> 각 이의신청의 "해결" 또는 "반려" 버튼을 클릭하여 처리합니다.</p>
            <p><strong>4. 일괄 처리:</strong> 여러 이의신청을 선택하여 한 번에 처리할 수 있습니다.</p>
            <p><strong>5. 상세 정보 확인:</strong> "상세 보기" 버튼을 클릭하여 이의신청의 완전한 정보를 확인합니다.</p>
            <p><strong>6. 통계 확인:</strong> 상단의 통계 카드에서 전체 현황을 파악할 수 있습니다.</p>
          </div>
        </div>

        {/* 필터링 팁 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            필터링 및 검색 팁
          </h3>
          <div className="text-purple-800 space-y-2 text-sm">
            <p><strong>효율적인 검색:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 사진 ID로 특정 사진의 이의신청만 확인</li>
              <li>• 요청 ID로 특정 프로젝트의 이의신청만 확인</li>
              <li>• 검수자 ID로 특정 검수자의 이의신청만 확인</li>
              <li>• 키워드로 문제 내용에서 검색</li>
            </ul>
            <p><strong>필터 조합:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• "대기중" + "심각" = 심각한 대기 이의신청만 표시</li>
              <li>• "해상도 문제" + "최근 7일" = 최근 해상도 관련 이의신청만 표시</li>
              <li>• "높음" 심각도 + "오늘" = 오늘 제출된 높은 심각도 이의신청만 표시</li>
            </ul>
          </div>
        </div>

        {/* 기술 사양 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 사양
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">관리 기능</h4>
              <ul className="space-y-1">
                <li>• 실시간 이의신청 목록 조회</li>
                <li>• 상태별 필터링 (대기중/해결됨/반려됨)</li>
                <li>• 심각도별 필터링 (낮음/보통/높음/심각)</li>
                <li>• 카테고리별 필터링 (9가지 유형)</li>
                <li>• 날짜 범위 필터링</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">처리 기능</h4>
              <ul className="space-y-1">
                <li>• 개별 이의신청 해결/반려</li>
                <li>• 일괄 처리 (다중 선택)</li>
                <li>• 상세 정보 모달</li>
                <li>• 처리 이력 추적</li>
                <li>• 실시간 통계 업데이트</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueManagementExample; 