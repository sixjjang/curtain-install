// 구글 캘린더 API 설정
export const GOOGLE_CALENDAR_CONFIG = {
  // Google Cloud Console에서 생성한 OAuth 2.0 클라이언트 ID
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  
  // Google Calendar API 스코프
  scope: 'https://www.googleapis.com/auth/calendar',
  
  // 리다이렉트 URI (OAuth 인증 후 돌아올 URL)
  redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/google-callback',
  
  // Google Calendar API 엔드포인트
  apiEndpoint: 'https://www.googleapis.com/calendar/v3',
  
  // 기본 캘린더 ID (사용자의 기본 캘린더)
  defaultCalendarId: 'primary'
};

// 구글 OAuth 인증 URL 생성
export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CALENDAR_CONFIG.clientId,
    redirect_uri: GOOGLE_CALENDAR_CONFIG.redirectUri,
    scope: GOOGLE_CALENDAR_CONFIG.scope,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// 구글 캘린더 이벤트 타입
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

// 구글 캘린더 연동 상태
export interface GoogleCalendarConnection {
  userId: string;
  userRole: 'contractor' | 'seller';
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  calendarId: string;
  isConnected: boolean;
  lastSyncAt?: Date;
}
