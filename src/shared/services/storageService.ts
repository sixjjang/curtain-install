import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class StorageService {
  /**
   * 이미지를 Firebase Storage에 업로드합니다.
   * @param file 업로드할 파일
   * @param path 저장할 경로 (예: 'profile-images/user123.jpg')
   * @returns 업로드된 이미지의 다운로드 URL
   */
  static async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      
      // CORS 오류인지 확인
      if (error instanceof Error && error.message.includes('CORS')) {
        throw new Error('CORS 설정 오류: Firebase Storage 설정을 확인해주세요.');
      }
      
      // 네트워크 오류인지 확인
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error('네트워크 오류: 인터넷 연결을 확인해주세요.');
      }
      
      throw new Error('이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  /**
   * 프로필 이미지를 업로드합니다.
   * @param file 업로드할 이미지 파일
   * @param userId 사용자 ID
   * @returns 업로드된 이미지의 다운로드 URL
   */
  static async uploadProfileImage(file: File, userId: string): Promise<string> {
    const fileName = `profile-${Date.now()}.jpg`;
    const path = `profile-images/${userId}/${fileName}`;
    return this.uploadImage(file, path);
  }

  /**
   * 기존 이미지를 삭제합니다.
   * @param imageUrl 삭제할 이미지의 URL
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      // 삭제 실패는 무시 (이미 존재하지 않을 수 있음)
    }
  }

  /**
   * dataURL을 File 객체로 변환합니다.
   * @param dataUrl dataURL 문자열
   * @param filename 파일명
   * @returns File 객체
   */
  static dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }
}
