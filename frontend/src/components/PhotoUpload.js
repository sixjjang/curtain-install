import { useState, useEffect, useRef } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();
const storage = getStorage();

const PhotoUpload = ({ requestId, onUploadComplete, maxFiles = 20, maxFileSize = 10 }) => {
  const [files, setFiles] = useState([]);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // 기존 업로드된 사진들 로드
  useEffect(() => {
    if (requestId) {
      loadExistingPhotos();
    }
  }, [requestId]);

  const loadExistingPhotos = async () => {
    try {
      const photosQuery = query(
        collection(firestore, "photos"),
        where("requestId", "==", requestId)
      );
      const snapshot = await getDocs(photosQuery);
      const photos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUploadedPhotos(photos);
    } catch (error) {
      console.error("기존 사진 로드 오류:", error);
    }
  };

  const validateFile = (file) => {
    const errors = [];
    
    // 파일 크기 검증 (MB 단위)
    if (file.size > maxFileSize * 1024 * 1024) {
      errors.push(`${file.name}: 파일 크기가 ${maxFileSize}MB를 초과합니다.`);
    }
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
    }
    
    // 파일명 검증
    if (file.name.length > 100) {
      errors.push(`${file.name}: 파일명이 너무 깁니다.`);
    }
    
    return errors;
  };

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (selectedFiles) => {
    const newErrors = [];
    const validFiles = [];
    
    // 파일 수 제한 확인
    if (files.length + selectedFiles.length > maxFiles) {
      newErrors.push(`최대 ${maxFiles}개까지 업로드 가능합니다.`);
      return;
    }
    
    selectedFiles.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        newErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });
    
    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
      setTimeout(() => setErrors([]), 5000); // 5초 후 에러 메시지 제거
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedPhoto = async (photoId) => {
    try {
      // Firestore에서 사진 정보 삭제
      const photoRef = doc(firestore, "photos", photoId);
      await updateDoc(photoRef, { deletedAt: Timestamp.now() });
      
      // 로컬 상태 업데이트
      setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error("사진 삭제 오류:", error);
      setErrors(prev => [...prev, "사진 삭제 중 오류가 발생했습니다."]);
    }
  };

  const uploadPhotos = async () => {
    if (!files.length) {
      setErrors(prev => [...prev, "업로드할 파일을 선택해주세요."]);
      return;
    }

    setUploading(true);
    setUploadProgress({});
    const newErrors = [];

    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          // 고유한 파일명 생성
          const timestamp = Date.now();
          const fileExtension = file.name.split('.').pop();
          const fileName = `${timestamp}_${index}.${fileExtension}`;
          
          const storageRef = ref(storage, `photos/${requestId}/${fileName}`);
          
          // 업로드 진행률 추적
          setUploadProgress(prev => ({ ...prev, [index]: 0 }));
          
          // 파일 업로드
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          
          // Firestore에 사진 정보 저장
          const photoData = {
            requestId,
            url,
            fileName: fileName,
            originalName: file.name,
            fileSize: file.size,
            fileType: file.type,
            type: "photo",
            uploadedAt: Timestamp.now(),
            status: "uploaded"
          };
          
          const docRef = await addDoc(collection(firestore, "photos"), photoData);
          
          setUploadProgress(prev => ({ ...prev, [index]: 100 }));
          
          return {
            id: docRef.id,
            ...photoData
          };
        } catch (error) {
          console.error(`파일 ${file.name} 업로드 오류:`, error);
          newErrors.push(`${file.name}: 업로드 실패`);
          setUploadProgress(prev => ({ ...prev, [index]: -1 }));
          throw error;
        }
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      
      // 성공적으로 업로드된 사진들 추가
      setUploadedPhotos(prev => [...prev, ...uploadedPhotos]);
      setFiles([]);
      
      // 콜백 함수 호출
      if (onUploadComplete) {
        onUploadComplete(uploadedPhotos);
      }
      
    } catch (error) {
      console.error("업로드 중 오류:", error);
      newErrors.push("일부 파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      setUploadProgress({});
      
      if (newErrors.length > 0) {
        setErrors(prev => [...prev, ...newErrors]);
        setTimeout(() => setErrors([]), 5000);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilePreview = (file) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <PhotoIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">사진 업로드</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          시공 전후 사진을 업로드하여 프로젝트를 기록하세요.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* 에러 메시지 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-900">오류 발생</h4>
            </div>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 파일 업로드 영역 */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              파일을 드래그하여 업로드하거나 클릭하여 선택하세요
            </p>
            <p className="text-sm text-gray-500">
              최대 {maxFiles}개 파일, 각 파일 {maxFileSize}MB 이하
            </p>
            <p className="text-xs text-gray-400">
              지원 형식: JPG, PNG, GIF, WebP
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            파일 선택
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesChange}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* 선택된 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">선택된 파일 ({files.length}개)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* 파일 미리보기 */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={getFilePreview(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 업로드 진행률 */}
                  {uploadProgress[index] !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          uploadProgress[index] === -1 
                            ? 'bg-red-500' 
                            : uploadProgress[index] === 100 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(0, uploadProgress[index])}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={uploadPhotos}
                disabled={uploading || files.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    업로드 중...
                  </div>
                ) : (
                  "업로드 시작"
                )}
              </button>
              
              <button
                onClick={() => setFiles([])}
                disabled={uploading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                선택 취소
              </button>
            </div>
          </div>
        )}

        {/* 업로드된 사진 목록 */}
        {uploadedPhotos.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              업로드된 사진 ({uploadedPhotos.length}개)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.originalName || "업로드된 사진"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeUploadedPhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  
                  {/* 파일 정보 */}
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="truncate">{photo.originalName}</p>
                    <p>{formatFileSize(photo.fileSize)}</p>
                    <p>{photo.uploadedAt?.toDate?.().toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoUpload; 