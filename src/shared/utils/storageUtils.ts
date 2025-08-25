// 로컬 스토리지 키 상수
export const STORAGE_KEYS = {
  AUTO_LOGIN: 'auto_login_enabled',
  SAVED_EMAIL: 'saved_email',
  SAVED_PASSWORD: 'saved_password',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
  LAST_LOGIN_TIME: 'last_login_time',
  SESSION_TOKEN: 'session_token'
} as const;

// 암호화 키 (실제 프로덕션에서는 더 안전한 방법 사용)
const ENCRYPTION_KEY = 'your-secret-key-here';

/**
 * 간단한 문자열 암호화 (실제 프로덕션에서는 더 강력한 암호화 사용)
 */
const encrypt = (text: string): string => {
  try {
    return btoa(encodeURIComponent(text));
  } catch {
    return text;
  }
};

/**
 * 간단한 문자열 복호화
 */
const decrypt = (text: string): string => {
  try {
    return decodeURIComponent(atob(text));
  } catch {
    return text;
  }
};

/**
 * 로컬 스토리지에 안전하게 데이터 저장
 */
export const setSecureItem = (key: string, value: any, encryptData: boolean = true): void => {
  try {
    const serializedValue = JSON.stringify(value);
    const finalValue = encryptData ? encrypt(serializedValue) : serializedValue;
    localStorage.setItem(key, finalValue);
  } catch (error) {
    console.error('로컬 스토리지 저장 실패:', error);
  }
};

/**
 * 로컬 스토리지에서 안전하게 데이터 조회
 */
export const getSecureItem = <T>(key: string, defaultValue: T = null as T, decryptData: boolean = true): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    const decryptedValue = decryptData ? decrypt(item) : item;
    return JSON.parse(decryptedValue);
  } catch (error) {
    console.error('로컬 스토리지 조회 실패:', error);
    return defaultValue;
  }
};

/**
 * 로컬 스토리지에서 항목 제거
 */
export const removeSecureItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('로컬 스토리지 제거 실패:', error);
  }
};

/**
 * 로컬 스토리지 전체 삭제
 */
export const clearSecureStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('로컬 스토리지 전체 삭제 실패:', error);
  }
};

/**
 * 자동 로그인 정보 저장
 */
export const saveAutoLoginInfo = (email: string, password: string, rememberMe: boolean = false): void => {
  if (rememberMe) {
    setSecureItem(STORAGE_KEYS.AUTO_LOGIN, true, false);
    setSecureItem(STORAGE_KEYS.SAVED_EMAIL, email, true);
    setSecureItem(STORAGE_KEYS.SAVED_PASSWORD, password, true);
    setSecureItem(STORAGE_KEYS.REMEMBER_ME, true, false);
  } else {
    removeAutoLoginInfo();
  }
};

/**
 * 자동 로그인 정보 조회
 */
export const getAutoLoginInfo = (): { email: string; password: string; rememberMe: boolean } | null => {
  try {
    const autoLoginEnabled = getSecureItem(STORAGE_KEYS.AUTO_LOGIN, false, false);
    const rememberMe = getSecureItem(STORAGE_KEYS.REMEMBER_ME, false, false);
    
    if (!autoLoginEnabled && !rememberMe) {
      return null;
    }
    
    const email = getSecureItem(STORAGE_KEYS.SAVED_EMAIL, '', true);
    const password = getSecureItem(STORAGE_KEYS.SAVED_PASSWORD, '', true);
    
    if (!email || !password) {
      return null;
    }
    
    return { email, password, rememberMe };
  } catch (error) {
    console.error('자동 로그인 정보 조회 실패:', error);
    return null;
  }
};

/**
 * 자동 로그인 정보 제거
 */
export const removeAutoLoginInfo = (): void => {
  removeSecureItem(STORAGE_KEYS.AUTO_LOGIN);
  removeSecureItem(STORAGE_KEYS.SAVED_EMAIL);
  removeSecureItem(STORAGE_KEYS.SAVED_PASSWORD);
  removeSecureItem(STORAGE_KEYS.REMEMBER_ME);
};

/**
 * 생체인증 설정 저장
 */
export const saveBiometricSettings = (enabled: boolean): void => {
  setSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled, false);
};

/**
 * 생체인증 설정 조회
 */
export const getBiometricSettings = (): boolean => {
  return getSecureItem(STORAGE_KEYS.BIOMETRIC_ENABLED, false, false);
};

/**
 * 세션 토큰 저장
 */
export const saveSessionToken = (token: string): void => {
  setSecureItem(STORAGE_KEYS.SESSION_TOKEN, token, true);
};

/**
 * 세션 토큰 조회
 */
export const getSessionToken = (): string | null => {
  return getSecureItem(STORAGE_KEYS.SESSION_TOKEN, null, true);
};

/**
 * 세션 토큰 제거
 */
export const removeSessionToken = (): void => {
  removeSecureItem(STORAGE_KEYS.SESSION_TOKEN);
};

/**
 * 마지막 로그인 시간 저장
 */
export const saveLastLoginTime = (): void => {
  setSecureItem(STORAGE_KEYS.LAST_LOGIN_TIME, new Date().toISOString(), false);
};

/**
 * 마지막 로그인 시간 조회
 */
export const getLastLoginTime = (): Date | null => {
  const timeString = getSecureItem(STORAGE_KEYS.LAST_LOGIN_TIME, null, false);
  return timeString ? new Date(timeString) : null;
};
