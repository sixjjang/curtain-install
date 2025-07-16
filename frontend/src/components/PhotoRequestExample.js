import React, { useState } from 'react';
import PhotoRequestForm from './PhotoRequestForm';

const PhotoRequestExample = () => {
  const [showForm, setShowForm] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');

  // 샘플 작업 데이터
  const sampleJobs = [
    { id: 'job1', title: '서울시 강남구 커튼 설치', contractor: '김철수', status: 'in_progress' },
    { id: 'job2', title: '부산시 해운대구 블라인드 설치', contractor: '이영희', status: 'scheduled' },
    { id: 'job3', title: '대구시 수성구 롤스크린 설치', contractor: '박민수', status: 'completed' },
  ];

  const handleRequestCreated = (requestId, requestData) => {
    // 성공 메시지 표시
    alert(`촬영 요청이 성공적으로 생성되었습니다!\n요청 ID: ${requestId}`);
    
    // 최근 요청 목록에 추가
    setRecentRequests(prev => [{
      id: requestId,
      ...requestData,
      createdAt: new Date().toLocaleString()
    }, ...prev.slice(0, 4)]); // 최대 5개만 유지
    
    // 폼 숨기기
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedJob('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            사진/영상 촬영 요청 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>사진 촬영 요청:</strong> 시공 전후 사진 수량과 각도 지정</li>
              <li>• <strong>영상 촬영 옵션:</strong> 짧은 영상 또는 상세 영상 선택</li>
              <li>• <strong>우선순위 설정:</strong> 긴급도에 따른 우선순위 지정</li>
              <li>• <strong>마감일 설정:</strong> 촬영 완료 마감일 지정</li>
              <li>• <strong>특별 지시사항:</strong> 추가 요구사항이나 주의사항 입력</li>
              <li>• <strong>실시간 요약:</strong> 요청 내용의 실시간 요약 표시</li>
            </ul>
          </div>
        </div>

        {/* 작업 선택 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">작업 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleJobs.map(job => (
              <div
                key={job.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJob === job.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedJob(job.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{job.title}</h3>
                <p className="text-sm text-gray-600 mb-2">시공기사: {job.contractor}</p>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                  {getStatusText(job.status)}
                </span>
              </div>
            ))}
          </div>
          
          {selectedJob && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                촬영 요청 생성
              </button>
              <button
                onClick={() => setSelectedJob('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                선택 취소
              </button>
            </div>
          )}
        </div>

        {/* 촬영 요청 폼 */}
        {showForm && selectedJob && (
          <div className="mb-6">
            <PhotoRequestForm
              jobId={selectedJob}
              contractorId="contractor123"
              sellerId="seller456"
              onRequestCreated={handleRequestCreated}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* 최근 요청 목록 */}
        {recentRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 촬영 요청</h2>
            <div className="space-y-4">
              {recentRequests.map((request, index) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        촬영 요청 #{request.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        작업 ID: {request.jobId} • 생성일: {request.createdAt}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">총 사진:</span>
                      <span className="font-medium ml-1">{request.totalPhotos}장</span>
                    </div>
                    <div>
                      <span className="text-gray-600">영상:</span>
                      <span className="font-medium ml-1">
                        {request.videoOption === 'none' && '없음'}
                        {request.videoOption === 'short' && '짧은 영상'}
                        {request.videoOption === 'detailed' && '상세 영상'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">우선순위:</span>
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        request.priority === 'low' && 'bg-gray-100 text-gray-800'
                      } ${request.priority === 'normal' && 'bg-blue-100 text-blue-800'}
                      ${request.priority === 'high' && 'bg-yellow-100 text-yellow-800'}
                      ${request.priority === 'urgent' && 'bg-red-100 text-red-800'}`}>
                        {request.priority === 'low' && '낮음'}
                        {request.priority === 'normal' && '보통'}
                        {request.priority === 'high' && '높음'}
                        {request.priority === 'urgent' && '긴급'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">예상 시간:</span>
                      <span className="font-medium ml-1">{request.estimatedCompletionTime}분</span>
                    </div>
                  </div>
                  
                  {request.requestedAngles && (
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">요청 각도:</span>
                      <span className="text-sm ml-1">{request.requestedAngles}</span>
                    </div>
                  )}
                  
                  {request.specialInstructions && (
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">특별 지시:</span>
                      <span className="text-sm ml-1">{request.specialInstructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>1. 작업 선택:</strong> 촬영 요청을 생성할 작업을 선택합니다.</p>
            <p><strong>2. 사진 수량 설정:</strong> 시공 전후 필요한 사진 수량을 지정합니다.</p>
            <p><strong>3. 촬영 각도 지정:</strong> 구체적인 촬영 각도나 위치를 상세히 입력합니다.</p>
            <p><strong>4. 영상 옵션 선택:</strong> 필요에 따라 짧은 영상 또는 상세 영상을 선택합니다.</p>
            <p><strong>5. 우선순위 설정:</strong> 긴급도에 따라 우선순위를 설정합니다.</p>
            <p><strong>6. 마감일 지정:</strong> 촬영 완료가 필요한 마감일을 설정합니다 (선택사항).</p>
            <p><strong>7. 특별 지시사항:</strong> 추가 요구사항이나 주의사항을 입력합니다 (선택사항).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoRequestExample; 