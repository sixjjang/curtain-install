import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class StorageService {
  // CORS 오류가 지속적으로 발생하는지 확인하는 플래그
  private static corsErrorCount = 0;
  private static readonly CORS_ERROR_THRESHOLD = 3; // 3번 연속 CORS 오류 시 로컬 모드로 전환
  private static forceLocalMode = false;

  /**
   * CORS 오류인지 확인합니다.
   */
  private static isCORSError(error: any): boolean {
    return error instanceof Error && (
      error.message.includes('CORS') ||
      error.message.includes('cors') ||
      error.message.includes('Access to XMLHttpRequest') ||
      error.message.includes('preflight request') ||
      error.message.includes('ERR_FAILED')
    );
  }

  /**
   * 네트워크 오류인지 확인합니다.
   */
  private static isNetworkError(error: any): boolean {
    return error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.message.includes('ERR_FAILED') ||
      error.message.includes('fetch')
    );
  }

  /**
   * CORS 오류 카운트를 증가시키고 로컬 모드 전환 여부를 결정합니다.
   */
  private static handleCORSError(): void {
    this.corsErrorCount++;
    console.warn(`CORS 오류 발생 (${this.corsErrorCount}/${this.CORS_ERROR_THRESHOLD})`);
    
    if (this.corsErrorCount >= this.CORS_ERROR_THRESHOLD) {
      this.forceLocalMode = true;
      console.warn('CORS 오류 임계값 도달. 로컬 저장 모드로 전환합니다.');
    }
  }

  /**
   * 성공적인 업로드 시 CORS 오류 카운트를 리셋합니다.
   */
  private static resetCORSErrorCount(): void {
    this.corsErrorCount = 0;
    this.forceLocalMode = false;
    console.log('CORS 오류 카운트가 리셋되었습니다.');
  }

  /**
   * 파일을 Firebase Storage에 업로드합니다.
   * @param file 업로드할 파일
   * @param folder 저장할 폴더 (예: 'work-instructions')
   * @returns 업로드된 파일의 다운로드 URL
   */
  static async uploadFile(file: File, folder: string): Promise<string> {
    // 강제 로컬 모드인 경우 바로 로컬 저장
    if (this.forceLocalMode) {
      console.log('강제 로컬 모드: Firebase Storage 업로드를 건너뜁니다.');
      return this.fileToDataURL(file);
    }

    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const path = `${folder}/${fileName}`;
      
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 성공 시 CORS 오류 카운트 리셋
      this.resetCORSErrorCount();
      return downloadURL;
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      
      // CORS 오류인지 확인
      if (this.isCORSError(error)) {
        this.handleCORSError();
        throw new Error('CORS 설정 오류: Firebase Storage 설정을 확인해주세요. 임시로 로컬 저장을 사용합니다.');
      }
      
      // 네트워크 오류인지 확인
      if (this.isNetworkError(error)) {
        console.warn('네트워크 오류 발생: 인터넷 연결을 확인해주세요.');
        throw new Error('네트워크 오류: 인터넷 연결을 확인해주세요.');
      }
      
      throw new Error('파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  /**
   * 이미지를 Firebase Storage에 업로드합니다.
   * @param file 업로드할 파일
   * @param path 저장할 경로 (예: 'profile-images/user123.jpg')
   * @returns 업로드된 이미지의 다운로드 URL
   */
  static async uploadImage(file: File, path: string): Promise<string> {
    // 강제 로컬 모드인 경우 바로 로컬 저장
    if (this.forceLocalMode) {
      console.log('강제 로컬 모드: Firebase Storage 업로드를 건너뜁니다.');
      return this.fileToDataURL(file);
    }

    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 성공 시 CORS 오류 카운트 리셋
      this.resetCORSErrorCount();
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      
      // CORS 오류인지 확인
      if (this.isCORSError(error)) {
        this.handleCORSError();
        throw new Error('CORS 설정 오류: Firebase Storage 설정을 확인해주세요. 임시로 로컬 저장을 사용합니다.');
      }
      
      // 네트워크 오류인지 확인
      if (this.isNetworkError(error)) {
        console.warn('네트워크 오류 발생: 인터넷 연결을 확인해주세요.');
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
   * CORS 오류 시 임시로 dataURL을 반환하는 안전한 업로드 메서드
   * @param file 업로드할 파일
   * @param path 저장할 경로
   * @returns 업로드된 이미지의 다운로드 URL 또는 dataURL
   */
  static async uploadImageSafe(file: File, path: string): Promise<string> {
    // 강제 로컬 모드인 경우 바로 로컬 저장
    if (this.forceLocalMode) {
      console.log('강제 로컬 모드: 로컬 저장을 사용합니다.');
      return this.fileToDataURL(file);
    }

    try {
      return await this.uploadImage(file, path);
    } catch (error) {
      if (this.isCORSError(error)) {
        // CORS 오류 시 dataURL로 변환하여 반환
        console.warn('CORS 오류로 인해 로컬 저장을 사용합니다.');
        return this.fileToDataURL(file);
      }
      throw error;
    }
  }

  /**
   * 프로필 이미지를 안전하게 업로드합니다.
   * @param file 업로드할 이미지 파일
   * @param userId 사용자 ID
   * @returns 업로드된 이미지의 다운로드 URL 또는 dataURL
   */
  static async uploadProfileImageSafe(file: File, userId: string): Promise<string> {
    const fileName = `profile-${Date.now()}.jpg`;
    const path = `profile-images/${userId}/${fileName}`;
    return this.uploadImageSafe(file, path);
  }

  /**
   * 완전히 로컬 저장만 사용하는 메서드 (CORS 설정 완료 전까지 사용)
   * @param file 업로드할 파일
   * @returns dataURL
   */
  static async uploadImageLocalOnly(file: File): Promise<string> {
    console.log('로컬 전용 모드: Firebase Storage 업로드를 건너뜁니다.');
    return this.fileToDataURL(file);
  }

  /**
   * 프로필 이미지를 로컬에만 저장합니다.
   * @param file 업로드할 이미지 파일
   * @returns dataURL
   */
  static async uploadProfileImageLocalOnly(file: File): Promise<string> {
    return this.uploadImageLocalOnly(file);
  }

  /**
   * 기존 이미지를 삭제합니다.
   * @param imageUrl 삭제할 이미지의 URL
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // dataURL인 경우 삭제하지 않음
      if (imageUrl.startsWith('data:')) {
        console.log('dataURL은 삭제하지 않습니다.');
        return;
      }
      
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

  /**
   * File 객체를 dataURL로 변환합니다.
   * @param file File 객체
   * @returns dataURL 문자열
   */
  static fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * URL이 dataURL인지 확인합니다.
   * @param url 확인할 URL
   * @returns dataURL 여부
   */
  static isDataURL(url: string): boolean {
    return url.startsWith('data:');
  }

  /**
   * URL이 Firebase Storage URL인지 확인합니다.
   * @param url 확인할 URL
   * @returns Firebase Storage URL 여부
   */
  static isFirebaseStorageURL(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com');
  }

  /**
   * 현재 CORS 오류 상태를 확인합니다.
   * @returns CORS 오류 정보
   */
  static getCORSStatus(): {
    errorCount: number;
    threshold: number;
    forceLocalMode: boolean;
  } {
    return {
      errorCount: this.corsErrorCount,
      threshold: this.CORS_ERROR_THRESHOLD,
      forceLocalMode: this.forceLocalMode
    };
  }

  /**
   * CORS 오류 상태를 리셋합니다.
   */
  static resetCORSStatus(): void {
    this.corsErrorCount = 0;
    this.forceLocalMode = false;
    console.log('CORS 상태가 리셋되었습니다.');
  }
}
