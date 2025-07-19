import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const ProfilePhotoUpload = ({ onPhotoUpdate }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 파일 크기 검증 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      uploadPhoto(file);
    }
  };

  const uploadPhoto = async (file) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage();
      const db = getFirestore();
      
      // 파일명 생성 (사용자ID_타임스탬프.확장자)
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile_photos/${user.uid}_${timestamp}.${fileExtension}`;
      
      // Storage에 업로드
      const storageRef = ref(storage, fileName);
      
      // 업로드 진행률 시뮬레이션
      const uploadTask = uploadBytes(storageRef, file);
      
      // 업로드 완료 대기
      const snapshot = await uploadTask;
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Firestore에 프로필 사진 URL 업데이트
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        lastPhotoUpdate: new Date()
      });

      // Firebase Auth 프로필 업데이트
      await user.updateProfile({
        photoURL: downloadURL
      });

      setUploadProgress(100);
      
      // 부모 컴포넌트에 알림
      if (onPhotoUpdate) {
        onPhotoUpdate(downloadURL);
      }

      alert('프로필 사진이 성공적으로 업로드되었습니다!');
      
    } catch (error) {
      console.error('사진 업로드 오류:', error);
      alert('사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 프로필 사진 표시 */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="프로필 사진"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
        
        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="사진 변경"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
        </button>
      </div>

      {/* 업로드 진행률 */}
      {uploading && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            업로드 중... {uploadProgress}%
          </p>
        </div>
      )}

      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 안내 메시지 */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          프로필 사진을 변경하려면 위의 + 버튼을 클릭하세요
        </p>
        <p className="text-xs text-gray-500 mt-1">
          지원 형식: JPG, PNG, GIF (최대 5MB)
        </p>
      </div>
    </div>
  );
};

export default ProfilePhotoUpload; 