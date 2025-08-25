import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export interface KakaoPayRequest {
  amount: number;
  orderId: string;
  itemName: string;
  userId: string;
  userRole: 'seller' | 'contractor';
}

export interface KakaoPayResult {
  success: boolean;
  orderId?: string;
  error?: string;
  redirectUrl?: string;
  tid?: string;
}

export class KakaoPayService {
  private static readonly ADMIN_KEY = process.env.REACT_APP_KAKAO_PAY_ADMIN_KEY;
  private static readonly REDIRECT_URL = process.env.REACT_APP_KAKAO_PAY_REDIRECT_URL || 'http://localhost:3000/seller/payment-complete';
  private static readonly CANCEL_URL = process.env.REACT_APP_KAKAO_PAY_CANCEL_URL || 'http://localhost:3000/seller/payment-fail';
  
  // 카카오페이 결제 준비
  static async preparePayment(payment: KakaoPayRequest): Promise<KakaoPayResult> {
    try {
      if (!this.ADMIN_KEY) {
        throw new Error('카카오페이 Admin Key가 설정되지 않았습니다.');
      }

      // 1. 결제 요청 정보를 Firebase에 저장
      const paymentRef = await addDoc(collection(db, 'payments'), {
        ...payment,
        status: 'pending',
        paymentMethod: 'kakao_pay',
        createdAt: serverTimestamp()
      });

      // 2. 카카오페이 결제 준비 API 호출
      const response = await fetch('https://kapi.kakao.com/v1/payment/ready', {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${this.ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams({
          cid: 'TC0ONETIME', // 가맹점 코드 (테스트용)
          partner_order_id: payment.orderId,
          partner_user_id: payment.userId,
          item_name: payment.itemName,
          quantity: '1',
          total_amount: payment.amount.toString(),
          tax_free_amount: '0',
          approval_url: this.REDIRECT_URL,
          cancel_url: this.CANCEL_URL,
          fail_url: this.CANCEL_URL
        })
      });

      const result = await response.json();

      if (result.tid) {
        // 3. 결제 정보 업데이트
        await updateDoc(paymentRef, {
          kakaoTid: result.tid,
          redirectUrl: result.next_redirect_pc_url
        });

        return {
          success: true,
          orderId: payment.orderId,
          redirectUrl: result.next_redirect_pc_url,
          tid: result.tid
        };
      } else {
        throw new Error(result.msg || '카카오페이 결제 준비에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오페이 결제 준비 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '카카오페이 결제 준비에 실패했습니다.'
      };
    }
  }

  // 카카오페이 결제 승인
  static async approvePayment(pgToken: string, orderId: string): Promise<KakaoPayResult> {
    try {
      if (!this.ADMIN_KEY) {
        throw new Error('카카오페이 Admin Key가 설정되지 않았습니다.');
      }

      // 1. 결제 정보 조회
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = querySnapshot.docs[0];
      const paymentData = paymentDoc.data();

      // 2. 카카오페이 결제 승인 API 호출
      const response = await fetch('https://kapi.kakao.com/v1/payment/approve', {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${this.ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams({
          cid: 'TC0ONETIME',
          tid: paymentData.kakaoTid,
          partner_order_id: orderId,
          partner_user_id: paymentData.userId,
          pg_token: pgToken
        })
      });

      const result = await response.json();

      if (result.payment_method_type) {
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
          kakaoPaymentId: result.tid,
          paymentMethodType: result.payment_method_type
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

  // 카카오페이 결제 취소
  static async cancelPayment(orderId: string, cancelAmount?: number, cancelTaxFreeAmount?: number): Promise<KakaoPayResult> {
    try {
      if (!this.ADMIN_KEY) {
        throw new Error('카카오페이 Admin Key가 설정되지 않았습니다.');
      }

      // 1. 결제 정보 조회
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where('orderId', '==', orderId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }

      const paymentDoc = querySnapshot.docs[0];
      const paymentData = paymentDoc.data();

      // 2. 카카오페이 결제 취소 API 호출
      const cancelData: any = {
        cid: 'TC0ONETIME',
        tid: paymentData.kakaoTid,
        cancel_amount: cancelAmount || paymentData.amount,
        cancel_tax_free_amount: cancelTaxFreeAmount || 0
      };

      const response = await fetch('https://kapi.kakao.com/v1/payment/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${this.ADMIN_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        },
        body: new URLSearchParams(cancelData)
      });

      const result = await response.json();

      if (result.cancel_amount) {
        // 3. 결제 상태 업데이트
        await updateDoc(paymentDoc.ref, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
          cancelAmount: result.cancel_amount
        });

        return {
          success: true,
          orderId
        };
      } else {
        throw new Error(result.msg || '카카오페이 결제 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오페이 결제 취소 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '카카오페이 결제 취소에 실패했습니다.'
      };
    }
  }

  // 카카오페이 API 키 설정 확인
  static isApiKeySet(): boolean {
    return !!this.ADMIN_KEY && this.ADMIN_KEY !== 'your_kakao_pay_admin_key_here';
  }
}
