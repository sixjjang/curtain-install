import { ConstructionJob } from '../../types';

export interface KakaoBusinessConfig {
  accessToken: string;
  channelId: string;
  templateId: string;
}

export interface SatisfactionSurveyData {
  jobId: string;
  jobTitle: string;
  customerName: string;
  customerPhone: string;
  contractorName: string;
  completedDate: Date;
}

export class KakaoBusinessService {
  private static config: KakaoBusinessConfig | null = null;

  // 카카오톡 비즈니스 설정
  static initialize(config: KakaoBusinessConfig) {
    this.config = config;
  }

  // 만족도 평가 링크 전송
  static async sendSatisfactionSurvey(data: SatisfactionSurveyData): Promise<boolean> {
    if (!this.config) {
      console.error('카카오톡 비즈니스 설정이 초기화되지 않았습니다.');
      return false;
    }

    try {
      const surveyUrl = `${window.location.origin}/satisfaction-survey/${data.jobId}`;
      
      const messageData = {
        object_type: 'feed',
        content: {
          title: '🏠 시공 완료 안내',
          description: `${data.jobTitle} 시공이 완료되었습니다.\n시공 품질에 대한 만족도를 평가해 주세요.`,
          image_url: 'https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=시공완료',
          link: {
            web_url: surveyUrl,
            mobile_web_url: surveyUrl
          }
        },
        buttons: [
          {
            title: '만족도 평가하기',
            link: {
              web_url: surveyUrl,
              mobile_web_url: surveyUrl
            }
          }
        ]
      };

      const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          template_object: JSON.stringify(messageData)
        })
      });

      if (response.ok) {
        console.log('카카오톡 만족도 평가 링크 전송 성공');
        return true;
      } else {
        console.error('카카오톡 전송 실패:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('카카오톡 전송 중 오류:', error);
      return false;
    }
  }

  // 시공 완료 시 자동 만족도 평가 전송
  static async sendSatisfactionSurveyOnJobCompletion(job: ConstructionJob): Promise<boolean> {
    if (!job.sellerId) {
      console.error('판매자 정보가 없습니다.');
      return false;
    }

    // 고객 정보 가져오기 (실제 구현에서는 CustomerService 사용)
    const customerInfo = {
      name: '고객님', // 실제로는 DB에서 가져온 고객명
      phone: '010-0000-0000' // 실제로는 DB에서 가져온 전화번호
    };

    const surveyData: SatisfactionSurveyData = {
      jobId: job.id,
      jobTitle: job.title,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      contractorName: '시공자', // 실제로는 시공자명
      completedDate: new Date()
    };

    return await this.sendSatisfactionSurvey(surveyData);
  }

  // 테스트용 메시지 전송
  static async sendTestMessage(): Promise<boolean> {
    const testData: SatisfactionSurveyData = {
      jobId: 'test-job-123',
      jobTitle: '테스트 시공 작업',
      customerName: '테스트 고객',
      customerPhone: '010-1234-5678',
      contractorName: '테스트 시공자',
      completedDate: new Date()
    };

    return await this.sendSatisfactionSurvey(testData);
  }
}
