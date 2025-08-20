import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  GOOGLE_CALENDAR_CONFIG, 
  getGoogleAuthUrl,
  GoogleCalendarEvent,
  GoogleCalendarConnection 
} from '../../config/google';

export class GoogleCalendarService {
  // 구글 캘린더 연동 시작
  static initiateConnection(): void {
    const authUrl = getGoogleAuthUrl();
    window.location.href = authUrl;
  }

  // OAuth 인증 코드로 액세스 토큰 교환
  static async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CALENDAR_CONFIG.clientId,
        client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_CALENDAR_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('토큰 교환에 실패했습니다.');
    }

    return response.json();
  }

  // 액세스 토큰 저장
  static async saveConnection(
    userId: string, 
    userRole: 'contractor' | 'seller',
    accessToken: string, 
    refreshToken: string, 
    expiresIn: number
  ): Promise<void> {
    const connectionData: GoogleCalendarConnection = {
      userId,
      userRole,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      calendarId: GOOGLE_CALENDAR_CONFIG.defaultCalendarId,
      isConnected: true,
      lastSyncAt: new Date()
    };

    await setDoc(
      doc(db, 'googleCalendarConnections', userId), 
      {
        ...connectionData,
        lastSyncAt: serverTimestamp()
      }
    );
  }

  // 연동 상태 조회
  static async getConnection(userId: string): Promise<GoogleCalendarConnection | null> {
    try {
      const docRef = doc(db, 'googleCalendarConnections', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastSyncAt: data.lastSyncAt?.toDate()
        } as GoogleCalendarConnection;
      }
      
      return null;
    } catch (error) {
      console.error('연동 상태 조회 실패:', error);
      return null;
    }
  }

  // 액세스 토큰 갱신
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CALENDAR_CONFIG.clientId,
        client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('토큰 갱신에 실패했습니다.');
    }

    return response.json();
  }

  // 유효한 액세스 토큰 가져오기
  static async getValidAccessToken(userId: string): Promise<string | null> {
    const connection = await this.getConnection(userId);
    if (!connection) return null;

    // 토큰이 만료되었으면 갱신
    if (Date.now() >= connection.expiresAt) {
      try {
        const { access_token, expires_in } = await this.refreshAccessToken(connection.refreshToken);
        
        // 갱신된 토큰 저장
        await updateDoc(doc(db, 'googleCalendarConnections', userId), {
          accessToken: access_token,
          expiresAt: Date.now() + expires_in * 1000,
          lastSyncAt: serverTimestamp()
        });

        return access_token;
      } catch (error) {
        console.error('토큰 갱신 실패:', error);
        return null;
      }
    }

    return connection.accessToken;
  }

  // 구글 캘린더 이벤트 조회
  static async getEvents(
    userId: string, 
    timeMin: string, 
    timeMax: string
  ): Promise<GoogleCalendarEvent[]> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('유효한 액세스 토큰이 없습니다.');
    }

    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('구글 캘린더 연동이 필요합니다.');
    }

    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await fetch(
      `${GOOGLE_CALENDAR_CONFIG.apiEndpoint}/calendars/${connection.calendarId}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('캘린더 이벤트 조회에 실패했습니다.');
    }

    const data = await response.json();
    return data.items || [];
  }

  // 구글 캘린더에 이벤트 생성
  static async createEvent(
    userId: string, 
    event: Omit<GoogleCalendarEvent, 'id'>
  ): Promise<GoogleCalendarEvent> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('유효한 액세스 토큰이 없습니다.');
    }

    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('구글 캘린더 연동이 필요합니다.');
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_CONFIG.apiEndpoint}/calendars/${connection.calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('캘린더 이벤트 생성에 실패했습니다.');
    }

    return response.json();
  }

  // 구글 캘린더 이벤트 업데이트
  static async updateEvent(
    userId: string, 
    eventId: string, 
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('유효한 액세스 토큰이 없습니다.');
    }

    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('구글 캘린더 연동이 필요합니다.');
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_CONFIG.apiEndpoint}/calendars/${connection.calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('캘린더 이벤트 업데이트에 실패했습니다.');
    }

    return response.json();
  }

  // 구글 캘린더 이벤트 삭제
  static async deleteEvent(userId: string, eventId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error('유효한 액세스 토큰이 없습니다.');
    }

    const connection = await this.getConnection(userId);
    if (!connection) {
      throw new Error('구글 캘린더 연동이 필요합니다.');
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_CONFIG.apiEndpoint}/calendars/${connection.calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('캘린더 이벤트 삭제에 실패했습니다.');
    }
  }

  // 연동 해제
  static async disconnect(userId: string): Promise<void> {
    await updateDoc(doc(db, 'googleCalendarConnections', userId), {
      isConnected: false,
      lastSyncAt: serverTimestamp()
    });
  }

  // 시공 작업을 구글 캘린더 이벤트로 변환
  static convertJobToCalendarEvent(job: any, userRole: 'contractor' | 'seller'): Omit<GoogleCalendarEvent, 'id'> {
    const startTime = job.scheduledDate ? new Date(job.scheduledDate) : new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 기본 2시간

    return {
      summary: `[${userRole === 'contractor' ? '시공' : '관리'}] ${job.title}`,
      description: `주소: ${job.address}\n예산: ${job.budget?.min?.toLocaleString()}~${job.budget?.max?.toLocaleString()}원\n상태: ${job.status}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Seoul'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Seoul'
      },
      location: job.address,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 }
        ]
      }
    };
  }
}
