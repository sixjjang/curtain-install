import React, { useState } from 'react';
import PhotoUpload from './PhotoUpload';

const PhotoUploadExample = () => {
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);

  // 샘플 촬영 요청 데이터
  const sampleRequests = [
    { 
      id: 'request1', 
      title: '서울시 강남구 커튼 설치 - 시공 전후 사진',
      contractor: '김철수',
      status: 'pending',
      requestedPhotos: 8,
      deadline: '2024-01-15'
    },
    { 
      id: 'request2', 
      title: '부산시 해운대구 블라인드 설치 - 상세 촬영',
      contractor: '이영희',
      status: 'in_progress',
      requestedPhotos: 12,
      deadline: '2024-01-20'
    },
    { 
      id: 'request3', 
      title: '대구시 수성구 롤스크린 설치 - 기본 촬영',
      contractor: '박민수',
      status: 'completed',
      requestedPhotos: 6,
      deadline: '2024-01-10'
    },
  ];

  const handleUploadComplete = (uploadedPhotos) => {
    // 업로드 완료 처리
    const uploadRecord = {
      id: Date.now(),
      requestId: selectedRequestId,
      photos: uploadedPhotos,
      timestamp: new Date().toLocaleString(),
      count: uploadedPhotos.length
    };
    
    setUploadHistory(prev => [uploadRecord, ...prev.slice(0, 9)]); // 최대 10개 유지
    
    // 성공 메시지
    alert(`${uploadedPhotos.length}개의 사진이 성공적으로 업로드되었습니다!`);
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
            사진 업로드 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>드래그 앤 드롭:</strong> 파일을 드래그하여 쉽게 업로드</li>
              <li>• <strong>다중 파일 선택:</strong> 여러 사진을 한 번에 선택하여 업로드</li>
              <li>• <strong>실시간 미리보기:</strong> 선택한 파일의 미리보기 제공</li>
              <li>• <strong>진행률 표시:</strong> 업로드 진행 상황을 실시간으로 확인</li>
              <li>• <strong>파일 검증:</strong> 파일 크기, 형식, 개수 제한 자동 검증</li>
              <li>• <strong>기존 사진 관리:</strong> 업로드된 사진 조회 및 삭제</li>
            </ul>
          </div>
        </div>

        {/* 촬영 요청 선택 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">촬영 요청 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleRequests.map(request => (
              <div
                key={request.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRequestId === request.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRequestId(request.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>시공기사: {request.contractor}</p>
                  <p>요청 사진: {request.requestedPhotos}장</p>
                  <p>마감일: {request.deadline}</p>
                </div>
                <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>
            ))}
          </div>
          
          {selectedRequestId && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setSelectedRequestId('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                선택 취소
              </button>
            </div>
          )}
        </div>

        {/* 사진 업로드 컴포넌트 */}
        {selectedRequestId ? (
          <div className="mb-6">
            <PhotoUpload
              requestId={selectedRequestId}
              onUploadComplete={handleUploadComplete}
              maxFiles={20}
              maxFileSize={10}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              촬영 요청을 선택하세요
            </h3>
            <p className="text-gray-500">
              위의 촬영 요청 중 하나를 선택하여 사진을 업로드할 수 있습니다.
            </p>
          </div>
        )}

        {/* 업로드 히스토리 */}
        {uploadHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 업로드 기록</h2>
            <div className="space-y-3">
              {uploadHistory.map((record) => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        요청 ID: {record.requestId}
                      </h3>
                      <p className="text-sm text-gray-600">
                        업로드 시간: {record.timestamp}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {record.count}개 업로드 완료
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {record.photos.slice(0, 6).map((photo, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.originalName || "업로드된 사진"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {record.photos.length > 6 && (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{record.photos.length - 6}개 더
                        </span>
                      </div>
                    )}
                  </div>
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
            <p><strong>1. 촬영 요청 선택:</strong> 업로드할 사진의 촬영 요청을 선택합니다.</p>
            <p><strong>2. 파일 선택:</strong> 드래그 앤 드롭 또는 파일 선택 버튼을 사용하여 사진을 선택합니다.</p>
            <p><strong>3. 파일 검증:</strong> 선택한 파일들이 자동으로 검증됩니다 (크기, 형식, 개수).</p>
            <p><strong>4. 미리보기 확인:</strong> 선택한 파일들의 미리보기를 확인하고 필요시 제거합니다.</p>
            <p><strong>5. 업로드 실행:</strong> "업로드 시작" 버튼을 클릭하여 사진을 업로드합니다.</p>
            <p><strong>6. 진행률 확인:</strong> 각 파일의 업로드 진행률을 실시간으로 확인합니다.</p>
            <p><strong>7. 완료 확인:</strong> 업로드 완료 후 사진 목록에서 결과를 확인합니다.</p>
          </div>
        </div>

        {/* 기술 사양 */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 사양
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">파일 제한</h4>
              <ul className="space-y-1">
                <li>• 최대 파일 수: 20개</li>
                <li>• 최대 파일 크기: 10MB</li>
                <li>• 지원 형식: JPG, PNG, GIF, WebP</li>
                <li>• 최대 파일명 길이: 100자</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">업로드 기능</h4>
              <ul className="space-y-1">
                <li>• 드래그 앤 드롭 지원</li>
                <li>• 다중 파일 동시 업로드</li>
                <li>• 실시간 진행률 표시</li>
                <li>• 자동 파일명 생성</li>
                <li>• 기존 사진 관리</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadExample; 