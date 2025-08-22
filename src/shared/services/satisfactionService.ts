import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp
} from 'firebase/firestore';
import { SatisfactionSurvey } from '../../types';

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'yesno' | 'text';
  isRequired: boolean;
  isActive: boolean;
  order: number;
  category: 'punctuality' | 'communication' | 'professionalism' | 'service' | 'general';
}

interface SurveyResponse {
  questionId: string;
  answer: string | number | boolean;
}

export class SatisfactionService {
  // 만족도 조사 문항 조회
  static async getSurveyQuestions(): Promise<SurveyQuestion[]> {
    try {
      const questionsRef = collection(db, 'surveyQuestions');
      const q = query(questionsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SurveyQuestion[];
      
      // 클라이언트에서 order 기준 오름차순 정렬
      return questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('만족도 조사 문항 조회 실패:', error);
      throw new Error('만족도 조사 문항을 불러올 수 없습니다.');
    }
  }

  // 만족도 조사 생성 (작업 완료 시 자동 생성)
  static async createSurvey(jobId: string, customerId: string, contractorId: string): Promise<string> {
    try {
      const surveyData = {
        jobId,
        customerId,
        contractorId,
        responses: [],
        isCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const surveyRef = await addDoc(collection(db, 'satisfactionSurveys'), surveyData);
      return surveyRef.id;
    } catch (error) {
      console.error('만족도 조사 생성 실패:', error);
      throw new Error('만족도 조사를 생성할 수 없습니다.');
    }
  }

  // 만족도 조사 조회
  static async getSurvey(surveyId: string): Promise<SatisfactionSurvey | null> {
    try {
      const surveyRef = doc(db, 'satisfactionSurveys', surveyId);
      const surveyDoc = await getDoc(surveyRef);
      
      if (surveyDoc.exists()) {
        return {
          id: surveyDoc.id,
          ...surveyDoc.data(),
          createdAt: surveyDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: surveyDoc.data().updatedAt?.toDate() || new Date()
        } as SatisfactionSurvey;
      }
      
      return null;
    } catch (error) {
      console.error('만족도 조사 조회 실패:', error);
      throw new Error('만족도 조사를 불러올 수 없습니다.');
    }
  }

  // 작업 ID로 만족도 조사 조회
  static async getSurveyByJobId(jobId: string): Promise<SatisfactionSurvey | null> {
    try {
      const surveysRef = collection(db, 'satisfactionSurveys');
      const q = query(surveysRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as SatisfactionSurvey;
      }
      
      return null;
    } catch (error) {
      console.error('작업별 만족도 조사 조회 실패:', error);
      throw new Error('만족도 조사를 불러올 수 없습니다.');
    }
  }

  // 만족도 조사 제출
  static async submitSurvey(surveyId: string, responses: SurveyResponse[]): Promise<void> {
    try {
      const surveyRef = doc(db, 'satisfactionSurveys', surveyId);
      
      // 만족도 조사 완료 처리
      await updateDoc(surveyRef, {
        responses,
        isCompleted: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 만족도 조사 정보 조회
      const surveyDoc = await getDoc(surveyRef);
      if (surveyDoc.exists()) {
        const surveyData = surveyDoc.data();
        const jobId = surveyData.jobId;
        const contractorId = surveyData.contractorId;

        // 전체 만족도 점수 계산
        const overallRating = responses.find(r => 
          r.questionId === 'overall' || 
          r.questionId === 'overall_satisfaction' ||
          r.questionId === 'general_satisfaction'
        );

        if (overallRating && typeof overallRating.answer === 'number') {
          // 작업의 고객 만족도 업데이트
          try {
            const { JobService } = await import('./jobService');
            await JobService.updateCustomerSatisfaction(jobId, overallRating.answer);
            console.log(`✅ 작업 ${jobId}의 고객 만족도 업데이트: ${overallRating.answer}/5`);
          } catch (jobError) {
            console.warn('작업 만족도 업데이트 실패:', jobError);
          }

          // 시공자 평점 업데이트
          if (contractorId) {
            try {
              const { ContractorService } = await import('./contractorService');
              await ContractorService.updateContractorRating(contractorId, overallRating.answer);
              console.log(`✅ 시공자 ${contractorId}의 평점 업데이트: ${overallRating.answer}/5`);
            } catch (contractorError) {
              console.warn('시공자 평점 업데이트 실패:', contractorError);
            }
          }
        }
      }
    } catch (error) {
      console.error('만족도 조사 제출 실패:', error);
      throw new Error('만족도 조사 제출에 실패했습니다.');
    }
  }

  // 만족도 조사 링크 생성
  static generateSurveyLink(surveyId: string): string {
    // Firebase 호스팅 URL 사용 (프로덕션 환경)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Firebase 호스팅 URL (실제 배포된 도메인)
      return `https://curtain-install.web.app/survey/${surveyId}`;
    } else {
      // 개발 환경에서는 현재 도메인 사용
      const baseUrl = window.location.origin;
      return `${baseUrl}/survey/${surveyId}`;
    }
  }

  // 카카오톡 링크 생성
  static generateKakaoLink(surveyId: string, customerName: string): string {
    const surveyUrl = this.generateSurveyLink(surveyId);
    const message = encodeURIComponent(
      `안녕하세요! ${customerName}님\n\n` +
      `시공 서비스 만족도 조사에 참여해 주세요.\n` +
      `소중한 의견을 바탕으로 더 나은 서비스를 제공하겠습니다.\n\n` +
      `만족도 조사 참여하기 👇\n` +
      `${surveyUrl}`
    );
    
    return `https://open.kakao.com/me/send?text=${message}`;
  }

  // 카카오톡으로 만족도 조사 링크 발송 (시뮬레이션)
  static async sendSurveyLink(phoneNumber: string, surveyId: string, customerName: string): Promise<void> {
    try {
      // 실제 구현에서는 카카오톡 API나 SMS API를 사용
      // 현재는 시뮬레이션으로 처리
      const kakaoLink = this.generateKakaoLink(surveyId, customerName);
      
      console.log('카카오톡 링크 생성:', kakaoLink);
      console.log('발송 대상:', phoneNumber);
      
      // 실제 환경에서는 다음과 같이 구현:
      // 1. 카카오톡 비즈니스 API 사용
      // 2. SMS API를 통한 링크 발송
      // 3. 푸시 알림 서비스 사용
      
      // 임시로 브라우저에서 카카오톡 링크 열기
      if (window.confirm('카카오톡으로 만족도 조사 링크를 발송하시겠습니까?')) {
        window.open(kakaoLink, '_blank');
      }
      
    } catch (error) {
      console.error('카카오톡 링크 발송 실패:', error);
      throw new Error('만족도 조사 링크 발송에 실패했습니다.');
    }
  }

  // 시공자별 평균 만족도 조회
  static async getContractorAverageRating(contractorId: string): Promise<number> {
    try {
      const surveysRef = collection(db, 'satisfactionSurveys');
      const q = query(
        surveysRef, 
        where('contractorId', '==', contractorId),
        where('isCompleted', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0;
      }
      
      let totalRating = 0;
      let ratingCount = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.responses) {
          // 전체 만족도 문항 찾기
          const overallRating = data.responses.find((r: any) => 
            r.questionId === 'overall' || r.question.includes('전체적인')
          );
          
          if (overallRating && typeof overallRating.answer === 'number') {
            totalRating += overallRating.answer;
            ratingCount++;
          }
        }
      });
      
      return ratingCount > 0 ? totalRating / ratingCount : 0;
    } catch (error) {
      console.error('시공자 평균 평점 조회 실패:', error);
      return 0;
    }
  }

  // 만족도 조사 통계 조회
  static async getSurveyStats(contractorId?: string): Promise<{
    totalSurveys: number;
    completedSurveys: number;
    averageRating: number;
    responseRate: number;
  }> {
    try {
      const surveysRef = collection(db, 'satisfactionSurveys');
      let q = query(surveysRef);
      
      if (contractorId) {
        q = query(surveysRef, where('contractorId', '==', contractorId));
      }
      
      const querySnapshot = await getDocs(q);
      
      const totalSurveys = querySnapshot.size;
      const completedSurveys = querySnapshot.docs.filter(doc => doc.data().isCompleted).length;
      
      let totalRating = 0;
      let ratingCount = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isCompleted && data.responses) {
          const overallRating = data.responses.find((r: any) => 
            r.questionId === 'overall' || r.question.includes('전체적인')
          );
          
          if (overallRating && typeof overallRating.answer === 'number') {
            totalRating += overallRating.answer;
            ratingCount++;
          }
        }
      });
      
      return {
        totalSurveys,
        completedSurveys,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        responseRate: totalSurveys > 0 ? (completedSurveys / totalSurveys) * 100 : 0
      };
    } catch (error) {
      console.error('만족도 조사 통계 조회 실패:', error);
      return {
        totalSurveys: 0,
        completedSurveys: 0,
        averageRating: 0,
        responseRate: 0
      };
    }
  }

  // 만족도 조사 결과 분석
  static async getSurveyAnalytics(contractorId?: string): Promise<{
    categoryRatings: Record<string, number>;
    questionResponses: Record<string, any[]>;
  }> {
    try {
      const surveysRef = collection(db, 'satisfactionSurveys');
      let q = query(
        surveysRef, 
        where('isCompleted', '==', true)
      );
      
      if (contractorId) {
        q = query(surveysRef, where('contractorId', '==', contractorId), where('isCompleted', '==', true));
      }
      
      const querySnapshot = await getDocs(q);
      
      const categoryRatings: Record<string, number> = {};
      const questionResponses: Record<string, any[]> = {};
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.responses) {
          data.responses.forEach((response: any) => {
            // 카테고리별 평점 계산
            if (response.category && typeof response.answer === 'number') {
              if (!categoryRatings[response.category]) {
                categoryRatings[response.category] = 0;
              }
              categoryRatings[response.category] += response.answer;
            }
            
            // 문항별 응답 수집
            if (!questionResponses[response.questionId]) {
              questionResponses[response.questionId] = [];
            }
            questionResponses[response.questionId].push(response.answer);
          });
        }
      });
      
      // 평균 계산
      Object.keys(categoryRatings).forEach(category => {
        const count = querySnapshot.docs.length;
        categoryRatings[category] = count > 0 ? categoryRatings[category] / count : 0;
      });
      
      return {
        categoryRatings,
        questionResponses
      };
    } catch (error) {
      console.error('만족도 조사 분석 실패:', error);
      return {
        categoryRatings: {},
        questionResponses: {}
      };
    }
  }
}

