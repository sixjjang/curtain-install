import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/config';

export interface PWASettings {
  appIcon: string;
  appName: string;
  appDescription: string;
  themeColor: string;
  backgroundColor: string;
}

export class PWASettingsService {
  private static readonly COLLECTION_NAME = 'systemSettings';
  private static readonly DOC_ID = 'pwa-settings';

  // Firebase 연결 상태 확인
  private static isFirebaseConnected(): boolean {
    try {
      return !!(db && storage);
    } catch (error) {
      console.error('Firebase 연결 상태 확인 실패:', error);
      return false;
    }
  }

  // PWA 설정 조회
  static async getPWASettings(): Promise<PWASettings> {
    try {
      // Firebase 연결 상태 확인
      if (!this.isFirebaseConnected()) {
        console.warn('Firebase가 연결되지 않았습니다. 기본 설정을 반환합니다.');
        return this.getDefaultSettings();
      }

      const docRef = doc(db, this.COLLECTION_NAME, this.DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('PWA 설정 조회 성공:', data);
        return data as PWASettings;
      }
      
      console.log('PWA 설정 문서가 존재하지 않습니다. 기본 설정을 반환합니다.');
      return this.getDefaultSettings();
    } catch (error) {
      console.error('PWA 설정 조회 실패:', error);
      
      // Firebase 권한 오류인 경우 기본 설정 반환
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('Firebase 권한 오류로 인해 기본 설정을 사용합니다.');
      }
      
      return this.getDefaultSettings();
    }
  }

  // 기본 설정 반환
  private static getDefaultSettings(): PWASettings {
    return {
      appIcon: '/logo192.png',
      appName: '커튼 설치 플랫폼',
      appDescription: '커튼 설치 전문 플랫폼',
      themeColor: '#1976d2',
      backgroundColor: '#ffffff'
    };
  }

  // PWA 설정 업데이트
  static async updatePWASettings(settings: Partial<PWASettings>): Promise<boolean> {
    try {
      // Firebase 연결 상태 확인
      if (!this.isFirebaseConnected()) {
        console.error('Firebase가 연결되지 않았습니다.');
        return false;
      }

      const docRef = doc(db, this.COLLECTION_NAME, this.DOC_ID);
      
      // 현재 설정을 가져와서 병합
      const currentSettings = await this.getPWASettings();
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        updatedAt: new Date()
      };
      
      console.log('PWA 설정 업데이트 시도:', updatedSettings);
      
      // setDoc을 사용하여 문서가 없으면 생성, 있으면 업데이트
      await setDoc(docRef, updatedSettings, { merge: true });
      
      console.log('PWA 설정 업데이트 성공');
      
      // PWA 매니페스트 파일 업데이트
      await this.updateManifestFile(settings);
      
      return true;
    } catch (error) {
      console.error('PWA 설정 업데이트 실패:', error);
      
      // Firebase 권한 오류인 경우 상세 로그
      if (error instanceof Error && error.message.includes('permission')) {
        console.error('Firebase 권한 오류 상세:', {
          error: error.message,
          collection: this.COLLECTION_NAME,
          document: this.DOC_ID
        });
      }
      
      return false;
    }
  }

  // 아이콘 파일 업로드
  static async uploadAppIcon(file: File): Promise<string | null> {
    try {
      // 기존 아이콘 삭제
      await this.deleteOldIcon();
      
      // 새 아이콘 업로드
      const timestamp = Date.now();
      const fileName = `pwa-icons/app-icon-${timestamp}.png`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('아이콘 업로드 실패:', error);
      return null;
    }
  }

  // 기존 아이콘 삭제
  private static async deleteOldIcon(): Promise<void> {
    try {
      const currentSettings = await this.getPWASettings();
      if (currentSettings?.appIcon && currentSettings.appIcon.startsWith('https://')) {
        const iconRef = ref(storage, currentSettings.appIcon);
        await deleteObject(iconRef);
      }
    } catch (error) {
      console.warn('기존 아이콘 삭제 실패:', error);
    }
  }

  // 매니페스트 파일 업데이트
  private static async updateManifestFile(settings: Partial<PWASettings>): Promise<void> {
    try {
      const currentSettings = await this.getPWASettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      const manifest = {
        short_name: updatedSettings.appName,
        name: updatedSettings.appName,
        description: updatedSettings.appDescription,
        icons: [
          {
            src: updatedSettings.appIcon,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: updatedSettings.appIcon,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        start_url: window.location.origin,
        scope: window.location.origin,
        display: "standalone",
        orientation: "portrait",
        theme_color: updatedSettings.themeColor,
        background_color: updatedSettings.backgroundColor,
        categories: ["business", "productivity"],
        lang: "ko",
        dir: "ltr"
      };

      // 매니페스트 파일을 동적으로 생성
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });
      
      // 매니페스트 파일을 Firebase Storage에 저장
      const manifestRef = ref(storage, 'pwa-manifest.json');
      await uploadBytes(manifestRef, manifestBlob);
      
    } catch (error) {
      console.error('매니페스트 파일 업데이트 실패:', error);
    }
  }

  // PWA 설정 초기화
  static async initializePWASettings(): Promise<boolean> {
    try {
      // Firebase 연결 상태 확인
      if (!this.isFirebaseConnected()) {
        console.error('Firebase가 연결되지 않아 PWA 설정을 초기화할 수 없습니다.');
        return false;
      }

      const docRef = doc(db, this.COLLECTION_NAME, this.DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const defaultSettings: PWASettings = {
          appIcon: '/logo192.png',
          appName: '커튼 설치 플랫폼',
          appDescription: '커튼 설치 전문 플랫폼',
          themeColor: '#1976d2',
          backgroundColor: '#ffffff'
        };
        
        console.log('PWA 설정 초기화 중...');
        await setDoc(docRef, {
          ...defaultSettings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('PWA 설정 초기화 완료');
      } else {
        console.log('PWA 설정이 이미 존재합니다.');
      }
      
      return true;
    } catch (error) {
      console.error('PWA 설정 초기화 실패:', error);
      
      // Firebase 권한 오류인 경우 상세 로그
      if (error instanceof Error && error.message.includes('permission')) {
        console.error('Firebase 권한 오류로 인해 PWA 설정 초기화에 실패했습니다.');
      }
      
      return false;
    }
  }
}
