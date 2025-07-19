import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';

const WorkOrderPhotoUpload = ({ workOrderId }) => {
  const { user, userData } = useAuth();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  // 공간별 기본 사진 요구사항
  const requiredSpaces = [
    { key: 'living_room', name: '거실', required: true },
    { key: 'bedroom', name: '안방', required: true },
    { key: 'middle_room', name: '중간방', required: true },
    { key: 'end_room', name: '끝방', required: false },
    { key: 'kitchen', name: '주방', required: false },
    { key: 'bathroom', name: '욕실', required: false },
    { key: 'entrance', name: '현관', required: false },
    { key: 'detail', name: '디테일컷', required: false }
  ];

  useEffect(() => {
    loadWorkOrderData();
  }, [workOrderId]);

  const loadWorkOrderData = async () => {
    try {
      setLoading(true);
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      const workOrderSnap = await getDoc(workOrderRef);
      
      if (workOrderSnap.exists()) {
        const data = workOrderSnap.data();
        
        // 권한 체크: 시공자만 사진 업로드 가능
        const isContractor = userData?.role === 'contractor';
        const isAssignedContractor = data.contractorId === user?.uid;
        
        if (!isContractor || !isAssignedContractor) {
          throw new Error('사진 업로드 권한이 없습니다.');
        }
        
        setWorkOrder(data);
        
        // 기존 사진 데이터 로드
        if (data.completionPhotos) {
          setPhotos(data.completionPhotos);
        }
      } else {
        throw new Error('작업 주문을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('작업 주문 데이터 로드 오류:', error);
      alert(error.message || '데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (spaceKey, files) => {
    const fileArray = Array.from(files);
    
    // 파일 크기 체크 (10MB 제한)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      alert(`파일 크기가 10MB를 초과하는 파일이 있습니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      alert(`지원하지 않는 파일 형식입니다: ${invalidFiles.map(f => f.name).join(', ')}\n지원 형식: JPG, PNG, WebP`);
      return;
    }
    
    // 파일 개수 제한 (공간당 최대 10장)
    const maxFiles = 10;
    if (fileArray.length > maxFiles) {
      alert(`한 번에 최대 ${maxFiles}장까지만 선택할 수 있습니다.`);
      return;
    }
    
    setSelectedFiles(prev => ({
      ...prev,
      [spaceKey]: fileArray
    }));
  };

  const uploadPhoto = async (spaceKey, file) => {
    const fileName = `${workOrderId}_${spaceKey}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `workOrderPhotos/${workOrderId}/${fileName}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        spaceKey: spaceKey,
        fileName: fileName
      };
    } catch (error) {
      console.error('사진 업로드 오류:', error);
      throw error;
    }
  };

  const handleUpload = async (spaceKey) => {
    const files = selectedFiles[spaceKey];
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [spaceKey]: 0 }));

      const uploadedPhotos = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photoData = await uploadPhoto(spaceKey, file);
        uploadedPhotos.push(photoData);
        
        // 진행률 업데이트
        const progress = ((i + 1) / files.length) * 100;
        setUploadProgress(prev => ({ ...prev, [spaceKey]: progress }));
      }

      // Firestore에 사진 정보 저장
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      const currentPhotos = photos[spaceKey] || [];
      const updatedPhotos = [...currentPhotos, ...uploadedPhotos];
      
      await updateDoc(workOrderRef, {
        [`completionPhotos.${spaceKey}`]: updatedPhotos,
        updatedAt: serverTimestamp()
      });

      // 로컬 상태 업데이트
      setPhotos(prev => ({
        ...prev,
        [spaceKey]: updatedPhotos
      }));

      // 선택된 파일 초기화
      setSelectedFiles(prev => ({
        ...prev,
        [spaceKey]: []
      }));

      // 파일 input 초기화
      const fileInput = document.querySelector(`input[data-space="${spaceKey}"]`);
      if (fileInput) {
        fileInput.value = '';
      }

      setUploadProgress(prev => ({ ...prev, [spaceKey]: 0 }));
      
      alert(`${requiredSpaces.find(s => s.key === spaceKey)?.name} 사진이 성공적으로 업로드되었습니다.`);
      
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      alert('사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (spaceKey, photoIndex) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;

    try {
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      const currentPhotos = photos[spaceKey] || [];
      const updatedPhotos = currentPhotos.filter((_, index) => index !== photoIndex);
      
      await updateDoc(workOrderRef, {
        [`completionPhotos.${spaceKey}`]: updatedPhotos,
        updatedAt: serverTimestamp()
      });

      setPhotos(prev => ({
        ...prev,
        [spaceKey]: updatedPhotos
      }));

      alert('사진이 삭제되었습니다.');
    } catch (error) {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다.');
    }
  };

  const getUploadStatus = (spaceKey) => {
    const spacePhotos = photos[spaceKey] || [];
    const space = requiredSpaces.find(s => s.key === spaceKey);
    
    if (space.required && spacePhotos.length === 0) {
      return { status: 'required', text: '필수 업로드' };
    } else if (spacePhotos.length > 0) {
      return { status: 'uploaded', text: `${spacePhotos.length}장 업로드됨` };
    } else {
      return { status: 'optional', text: '선택사항' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'required': return 'text-red-600 bg-red-50 border-red-200';
      case 'uploaded': return 'text-green-600 bg-green-50 border-green-200';
      case 'optional': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📸 시공 완료 사진 업로드</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 각 공간별로 시공 후 사진을 업로드해주세요</p>
          <p>• 필수 공간: 거실, 안방, 중간방 (각 1장 이상)</p>
          <p>• 추가 디테일컷은 자유롭게 업로드 가능</p>
          <p>• 고객은 각 공간별 1장만 무료로 다운로드 가능</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requiredSpaces.map((space) => {
          const spacePhotos = photos[space.key] || [];
          const uploadStatus = getUploadStatus(space.key);
          const isUploading = uploading && selectedFiles[space.key]?.length > 0;

          return (
            <div key={space.key} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {space.name}
                  {space.required && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(uploadStatus.status)}`}>
                  {uploadStatus.text}
                </span>
              </div>

              {/* 파일 선택 */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  data-space={space.key}
                  onChange={(e) => handleFileSelect(space.key, e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* 업로드 버튼 */}
              {selectedFiles[space.key]?.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => handleUpload(space.key)}
                    disabled={isUploading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        업로드 중... ({Math.round(uploadProgress[space.key] || 0)}%)
                      </div>
                    ) : (
                      `${selectedFiles[space.key].length}장 업로드`
                    )}
                  </button>
                </div>
              )}

              {/* 업로드된 사진 목록 */}
              {spacePhotos.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">업로드된 사진 ({spacePhotos.length}장)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {spacePhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`${space.name} 사진 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <button
                          onClick={() => handleDeletePhoto(space.key, index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index === 0 ? '무료' : '유료'}
                        </div>
                        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 업로드 완료 상태 */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="text-lg font-medium text-gray-900 mb-4">업로드 현황</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {requiredSpaces.map((space) => {
            const spacePhotos = photos[space.key] || [];
            const uploadStatus = getUploadStatus(space.key);
            
            return (
              <div key={space.key} className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  uploadStatus.status === 'uploaded' ? 'bg-green-100' : 
                  uploadStatus.status === 'required' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {uploadStatus.status === 'uploaded' ? '✅' : 
                   uploadStatus.status === 'required' ? '⚠️' : '📷'}
                </div>
                <div className="text-sm font-medium text-gray-900">{space.name}</div>
                <div className="text-xs text-gray-500">{spacePhotos.length}장</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkOrderPhotoUpload; 