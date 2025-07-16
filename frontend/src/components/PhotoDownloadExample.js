import React, { useState } from 'react';
import PhotoDownloadButton, { AdvancedPhotoDownloadButton } from './PhotoDownloadButton';

const PhotoDownloadExample = () => {
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 샘플 사진 데이터
  const samplePhotos = [
    {
      id: 'photo1',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      name: '커튼 설치 완료 사진',
      price: 5000,
      contractorId: 'contractor1',
      buyerId: 'buyer1',
      description: '서울시 강남구 커튼 설치 완료 사진'
    },
    {
      id: 'photo2',
      url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      name: '블라인드 설치 전후 비교',
      price: 8000,
      contractorId: 'contractor2',
      buyerId: 'buyer1',
      description: '부산시 해운대구 블라인드 설치 전후 비교 사진'
    },
    {
      id: 'photo3',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      name: '롤스크린 상세 사진',
      price: 0, // 무료
      contractorId: 'contractor3',
      buyerId: 'buyer2',
      description: '대구시 수성구 롤스크린 상세 설치 사진'
    },
    {
      id: 'photo4',
      url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      name: '프리미엄 커튼 설치',
      price: 15000,
      contractorId: 'contractor1',
      buyerId: 'buyer3',
      description: '프리미엄 커튼 설치 완료 사진 (고해상도)'
    }
  ];

  const handleDownloadComplete = (downloadInfo) => {
    // 다운로드 완료 처리
    const downloadRecord = {
      id: Date.now(),
      photoId: downloadInfo.photoId,
      price: downloadInfo.price,
      timestamp: downloadInfo.timestamp,
      downloadId: downloadInfo.downloadId
    };
    
    setDownloadHistory(prev => [downloadRecord, ...prev.slice(0, 9)]); // 최대 10개 유지
    
    // 성공 메시지 (선택사항)
    console.log('다운로드 완료:', downloadInfo);
  };

  const getTotalSpent = () => {
    return downloadHistory.reduce((total, record) => total + record.price, 0);
  };

  const getDownloadCount = () => {
    return downloadHistory.length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            사진 다운로드 시스템
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              기능 설명
            </h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• <strong>안전한 다운로드:</strong> Fetch API를 사용한 안전한 파일 다운로드</li>
              <li>• <strong>다운로드 추적:</strong> 모든 다운로드 기록을 Firestore에 저장</li>
              <li>• <strong>통계 업데이트:</strong> 사진별 다운로드 수와 수익 자동 업데이트</li>
              <li>• <strong>가격 표시:</strong> 유료/무료 사진 구분 및 가격 표시</li>
              <li>• <strong>에러 처리:</strong> 다운로드 실패 시 자동 에러 로깅</li>
              <li>• <strong>미리보기 기능:</strong> 다운로드 전 사진 미리보기</li>
            </ul>
          </div>
        </div>

        {/* 다운로드 통계 */}
        {downloadHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">다운로드 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900">총 다운로드</h3>
                <p className="text-2xl font-bold text-blue-600">{getDownloadCount()}회</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-900">총 지출</h3>
                <p className="text-2xl font-bold text-green-600">₩{getTotalSpent().toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-900">평균 가격</h3>
                <p className="text-2xl font-bold text-purple-600">
                  ₩{getDownloadCount() > 0 ? Math.round(getTotalSpent() / getDownloadCount()).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 사진 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {samplePhotos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* 사진 미리보기 */}
              <div className="aspect-square bg-gray-100">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 사진 정보 */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2">{photo.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{photo.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">ID: {photo.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    photo.price > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {photo.price > 0 ? `₩${photo.price.toLocaleString()}` : '무료'}
                  </span>
                </div>

                {/* 다운로드 버튼 */}
                <PhotoDownloadButton
                  photoUrl={photo.url}
                  photoId={photo.id}
                  contractorId={photo.contractorId}
                  buyerId={photo.buyerId}
                  price={photo.price}
                  photoName={photo.name}
                  onDownloadComplete={handleDownloadComplete}
                  showPrice={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 고급 다운로드 예제 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">고급 다운로드 예제</h2>
          <p className="text-gray-600 mb-4">
            미리보기, 상세 정보, 다운로드 히스토리가 포함된 고급 다운로드 버튼입니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {samplePhotos.slice(0, 2).map((photo) => (
              <div key={`advanced-${photo.id}`} className="border border-gray-200 rounded-lg p-4">
                <AdvancedPhotoDownloadButton
                  photoUrl={photo.url}
                  photoId={photo.id}
                  contractorId={photo.contractorId}
                  buyerId={photo.buyerId}
                  price={photo.price}
                  photoName={photo.name}
                  onDownloadComplete={handleDownloadComplete}
                  showPreview={true}
                  showDetails={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 다운로드 히스토리 */}
        {downloadHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">다운로드 히스토리</h2>
            <div className="space-y-3">
              {downloadHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">사진 ID: {record.photoId}</p>
                    <p className="text-sm text-gray-600">
                      다운로드 ID: {record.downloadId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {record.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">
                      ₩{record.price.toLocaleString()}
                    </span>
                    <p className="text-xs text-gray-500">다운로드 완료</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            사용법 안내
          </h3>
          <div className="text-yellow-800 space-y-2 text-sm">
            <p><strong>1. 기본 다운로드:</strong> 사진을 클릭하여 바로 다운로드할 수 있습니다.</p>
            <p><strong>2. 가격 확인:</strong> 각 사진의 가격을 확인하고 다운로드합니다.</p>
            <p><strong>3. 미리보기:</strong> 고급 다운로드 버튼으로 사진을 미리 확인할 수 있습니다.</p>
            <p><strong>4. 다운로드 추적:</strong> 모든 다운로드가 자동으로 기록됩니다.</p>
            <p><strong>5. 통계 확인:</strong> 다운로드 히스토리에서 통계를 확인할 수 있습니다.</p>
          </div>
        </div>

        {/* 기술 사양 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            기술 사양
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">다운로드 기능</h4>
              <ul className="space-y-1">
                <li>• Fetch API 기반 안전한 다운로드</li>
                <li>• 자동 파일명 생성 및 확장자 처리</li>
                <li>• Blob URL을 통한 메모리 효율적 처리</li>
                <li>• 다운로드 진행 상태 표시</li>
                <li>• 에러 처리 및 복구</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">데이터 추적</h4>
              <ul className="space-y-1">
                <li>• Firestore 다운로드 기록 저장</li>
                <li>• 사진별 통계 자동 업데이트</li>
                <li>• 사용자 에이전트 정보 수집</li>
                <li>• 실패 로그 자동 저장</li>
                <li>• 수익 및 다운로드 수 추적</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoDownloadExample; 