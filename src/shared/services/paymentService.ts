import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { KAKAO_PAY_CONFIG } from '../../config/kakao';
import { TOSS_PAYMENTS_CONFIG } from '../../config/toss';

export interface PaymentRequest {
  amount: number;
  orderId: string;
  itemName: string;
  userId: string;
  userRole: 'seller' | 'contractor';
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  redirectUrl?: string;
}

export class PaymentService {
  // 1단계: 간단한 결제 시뮬레이션
  static async requestPayment(payment: PaymentRequest): Promise<PaymentResult> {
    try {
      // 1. 결제 요청 정보를 Firebase에 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        status: 'pending',
        paymentMethod: 'simulation',
        createdAt: serverTimestamp()
      });

      // 2. 시뮬레이션용 결제 페이지 URL 생성
      const redirectUrl = `/seller/payment-simulation?orderId=${payment.orderId}&amount=${payment.amount}`;

      // 3. 결제 정보 업데이트
      await updateDoc(paymentRef, {
        redirectUrl: redirectUrl
      });

      return {
        success: true,
        orderId: payment.orderId,
        redirectUrl: redirectUrl
      };
    } catch (error) {
      console.error('결제 요청 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '결제 요청에 실패했습니다.'
      };
    }
  }

  // 결제 완료 처리 (포인트 충전)
  static async completePayment(orderId: string, amount: number): Promise<PaymentResult> {
    try {
      console.log('결제 완료 처리 시작:', { orderId, amount });
      
      // 결제 정보 조회
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      console.log('결제 정보 조회 결과:', querySnapshot.size, '개 문서 발견');
      
      if (!querySnapshot.empty) {
        const paymentDoc = querySnapshot.docs[0];
        const paymentData = paymentDoc.data();
        
        console.log('결제 데이터:', paymentData);
        
        // 포인트 충전 처리
        const { PointService } = await import('./pointService');
        console.log('포인트 충전 시작:', { userId: paymentData.userId, userRole: paymentData.userRole, amount });
        
        await PointService.chargePoints(
          paymentData.userId, 
          paymentData.userRole, 
          amount
        );
        
        console.log('포인트 충전 완료');
        
        // 결제 상태 업데이트
        await updateDoc(paymentDoc.ref, {
          status: 'completed',
          completedAt: serverTimestamp()
        });

        console.log('결제 상태 업데이트 완료');

        return {
          success: true,
          orderId
        };
      } else {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('결제 완료 처리 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '결제 완료 처리에 실패했습니다.'
      };
    }
  }

  // 결제 내역 조회
  static async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(
        paymentsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const payments: any[] = [];
      
      querySnapshot.forEach((doc) => {
        payments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return payments;
    } catch (error) {
      console.error('결제 내역 조회 실패:', error);
      throw error;
    }
  }

  // 카카오페이 결제 요청
  static async requestKakaoPay(payment: PaymentRequest): Promise<PaymentResult> {
    try {
      // 1. 결제 요청 정보를 Firebase에 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        status: 'pending',
        paymentMethod: 'kakao_pay',
        createdAt: serverTimestamp()
      });

      // 2. 카카오페이 결제 준비 요청
      const response = await fetch(KAKAO_PAY_CONFIG.READY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${KAKAO_PAY_CONFIG.ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams({
          cid: 'TC0ONETIME', // 가맹점 코드
          partner_order_id: payment.orderId,
          partner_user_id: payment.userId,
          item_name: payment.itemName,
          quantity: '1',
          total_amount: payment.amount.toString(),
          tax_free_amount: '0',
          approval_url: KAKAO_PAY_CONFIG.REDIRECT_URL + '?success=true',
          cancel_url: KAKAO_PAY_CONFIG.REDIRECT_URL + '?success=false',
          fail_url: KAKAO_PAY_CONFIG.REDIRECT_URL + '?success=false'
        })
      });

      const result = await response.json();

      if (result.ready) {
        // 3. 결제 정보 업데이트
        await updateDoc(paymentRef, {
          kakaoPayTid: result.tid,
          redirectUrl: result.next_redirect_pc_url
        });

        return {
          success: true,
          orderId: payment.orderId,
          redirectUrl: result.next_redirect_pc_url
        };
      } else {
        throw new Error(result.msg || '카카오페이 결제 준비에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오페이 결제 요청 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '카카오페이 결제 요청에 실패했습니다.'
      };
    }
  }

  // 카카오페이 결제 승인
  static async confirmKakaoPay(orderId: string, pgToken: string): Promise<PaymentResult> {
    try {
      // 1. 결제 정보 조회
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = querySnapshot.docs[0];
      const paymentData = paymentDoc.data();

      // 2. 카카오페이 결제 승인 요청
      const response = await fetch(KAKAO_PAY_CONFIG.APPROVE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${KAKAO_PAY_CONFIG.ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams({
          cid: 'TC0ONETIME',
          tid: paymentData.kakaoPayTid,
          partner_order_id: orderId,
          partner_user_id: paymentData.userId,
          pg_token: pgToken
        })
      });

      const result = await response.json();

      if (result.aid) {
        // 3. 결제 성공 시 포인트 충전
        const { PointService } = await import('./pointService');
        await PointService.chargePoints(
          paymentData.userId,
          paymentData.userRole,
          paymentData.amount
        );

        // 4. 결제 상태 업데이트
        await updateDoc(paymentDoc.ref, {
          status: 'completed',
          completedAt: serverTimestamp(),
          kakaoPayAid: result.aid
        });

        return {
          success: true,
          orderId
        };
      } else {
        throw new Error(result.msg || '카카오페이 결제 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오페이 결제 승인 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '카카오페이 결제 승인에 실패했습니다.'
      };
    }
  }

  // 토스페이먼츠 결제 요청
  static async requestTossPayments(payment: PaymentRequest, paymentMethod: string): Promise<PaymentResult> {
    try {
      // 1. 결제 요청 정보를 Firebase에 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        status: 'pending',
        paymentMethod: 'toss_payments',
        tossPaymentMethod: paymentMethod,
        createdAt: serverTimestamp()
      });

      // 2. 토스페이먼츠 결제 요청
      const response = await fetch(TOSS_PAYMENTS_CONFIG.PAYMENT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(TOSS_PAYMENTS_CONFIG.SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: payment.amount,
          orderId: payment.orderId,
          orderName: payment.itemName,
          successUrl: TOSS_PAYMENTS_CONFIG.SUCCESS_URL,
          failUrl: TOSS_PAYMENTS_CONFIG.FAIL_URL,
          paymentMethod: paymentMethod
        })
      });

      const result = await response.json();

      if (result.success) {
        // 3. 결제 정보 업데이트
        await updateDoc(paymentRef, {
          tossPaymentKey: result.paymentKey,
          redirectUrl: result.checkoutPage
        });

        return {
          success: true,
          orderId: payment.orderId,
          redirectUrl: result.checkoutPage
        };
      } else {
        throw new Error(result.message || '토스페이먼츠 결제 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('토스페이먼츠 결제 요청 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '토스페이먼츠 결제 요청에 실패했습니다.'
      };
    }
  }

  // 토스페이먼츠 결제 승인
  static async confirmTossPayments(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult> {
    try {
      // 1. 결제 정보 조회
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = querySnapshot.docs[0];
      const paymentData = paymentDoc.data();

      // 2. 토스페이먼츠 결제 승인 요청
      const response = await fetch(TOSS_PAYMENTS_CONFIG.CONFIRM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(TOSS_PAYMENTS_CONFIG.SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey: paymentKey,
          orderId: orderId,
          amount: amount
        })
      });

      const result = await response.json();

      if (result.status === 'DONE') {
        // 3. 결제 성공 시 포인트 충전
        const { PointService } = await import('./pointService');
        await PointService.chargePoints(
          paymentData.userId,
          paymentData.userRole,
          paymentData.amount
        );

        // 4. 결제 상태 업데이트
        await updateDoc(paymentDoc.ref, {
          status: 'completed',
          completedAt: serverTimestamp(),
          tossPaymentId: result.paymentKey
        });

        return {
          success: true,
          orderId
        };
      } else {
        throw new Error(result.message || '토스페이먼츠 결제 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('토스페이먼츠 결제 승인 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '토스페이먼츠 결제 승인에 실패했습니다.'
      };
    }
  }
}
