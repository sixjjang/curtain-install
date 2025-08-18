import { db } from '../../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { PointTransaction, PointBalance } from '../../types';

// undefined 값을 제거하는 유틸리티 함수
const removeUndefinedValues = (obj: any): any => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

export class PointService {
  // 포인트 충전
  static async chargePoints(userId: string, userRole: 'seller' | 'contractor', amount: number): Promise<string> {
    try {
      // 1. 포인트 거래 기록 생성
      const transactionData: any = {
        userId,
        userRole,
        type: 'charge',
        amount,
        balance: 0, // 임시값, 나중에 업데이트
        description: `${amount.toLocaleString()}포인트 충전`,
        status: 'pending'
        // relatedJobId는 명시적으로 제외
      };

      const transactionRef = await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp()
      });

      // 2. 포인트 잔액 업데이트
      await this.updatePointBalance(userId, userRole, amount);

      // 3. 거래 상태를 완료로 업데이트
      await updateDoc(doc(db, 'pointTransactions', transactionRef.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      return transactionRef.id;
    } catch (error) {
      console.error('포인트 충전 실패:', error);
      throw new Error('포인트 충전에 실패했습니다.');
    }
  }

  // 시공자에게 포인트 지급 (48시간 후)
  static async payContractor(jobId: string, contractorId: string, amount: number): Promise<string> {
    try {
      const transactionData: any = {
        userId: contractorId,
        userRole: 'contractor',
        type: 'payment',
        amount,
        balance: 0, // 임시값
        description: `시공 완료 보수 - ${amount.toLocaleString()}포인트`,
        status: 'pending',
        relatedJobId: jobId
      };

      const transactionRef = await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp()
      });

      return transactionRef.id;
    } catch (error) {
      console.error('시공자 지급 실패:', error);
      throw new Error('시공자 지급에 실패했습니다.');
    }
  }

  // 48시간 후 포인트 지급 완료 처리
  static async completePayment(transactionId: string): Promise<void> {
    try {
      const transactionRef = doc(db, 'pointTransactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('거래 내역을 찾을 수 없습니다.');
      }

      const transactionData = transactionDoc.data() as PointTransaction;
      
      // 포인트 잔액 업데이트
      await this.updatePointBalance(
        transactionData.userId, 
        transactionData.userRole, 
        transactionData.amount
      );

      // 거래 상태를 완료로 업데이트
      await updateDoc(transactionRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('지급 완료 처리 실패:', error);
      throw new Error('지급 완료 처리에 실패했습니다.');
    }
  }

  // 포인트 인출 요청
  static async requestWithdrawal(userId: string, userRole: 'seller' | 'contractor', amount: number): Promise<string> {
    try {
      // 잔액 확인
      const balance = await this.getPointBalance(userId, userRole);
      if (balance.balance < amount) {
        throw new Error('잔액이 부족합니다.');
      }

      const transactionData: any = {
        userId,
        userRole,
        type: 'withdrawal',
        amount: -amount, // 음수로 표시
        balance: 0, // 임시값
        description: `${amount.toLocaleString()}포인트 인출 요청`,
        status: 'pending'
        // relatedJobId는 명시적으로 제외
      };

      const transactionRef = await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp()
      });

      return transactionRef.id;
    } catch (error) {
      console.error('인출 요청 실패:', error);
      throw new Error('인출 요청에 실패했습니다.');
    }
  }

  // 포인트 잔액 업데이트
  private static async updatePointBalance(userId: string, userRole: 'seller' | 'contractor', amount: number): Promise<void> {
    try {
      const balanceRef = doc(db, 'pointBalances', `${userRole}_${userId}`);
      const balanceDoc = await getDoc(balanceRef);

      if (balanceDoc.exists()) {
        const currentBalance = balanceDoc.data() as PointBalance;
        const newBalance = currentBalance.balance + amount;
        
        await updateDoc(balanceRef, {
          balance: newBalance,
          totalCharged: amount > 0 ? currentBalance.totalCharged + amount : currentBalance.totalCharged,
          totalWithdrawn: amount < 0 ? currentBalance.totalWithdrawn + Math.abs(amount) : currentBalance.totalWithdrawn,
          updatedAt: serverTimestamp()
        });
      } else {
        // 새로운 잔액 문서 생성
        const newBalance: Omit<PointBalance, 'updatedAt'> = {
          userId,
          userRole,
          balance: amount,
          totalCharged: amount > 0 ? amount : 0,
          totalWithdrawn: amount < 0 ? Math.abs(amount) : 0
        };

        await setDoc(balanceRef, {
          ...newBalance,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('포인트 잔액 업데이트 실패:', error);
      throw new Error('포인트 잔액 업데이트에 실패했습니다.');
    }
  }

  // 포인트 잔액 조회
  static async getPointBalance(userId: string, userRole: 'seller' | 'contractor'): Promise<PointBalance> {
    try {
      const balanceRef = doc(db, 'pointBalances', `${userRole}_${userId}`);
      const balanceDoc = await getDoc(balanceRef);

      if (balanceDoc.exists()) {
        return balanceDoc.data() as PointBalance;
      } else {
        // 기본 잔액 반환
        return {
          userId,
          userRole,
          balance: 0,
          totalCharged: 0,
          totalWithdrawn: 0,
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      throw new Error('포인트 잔액 조회에 실패했습니다.');
    }
  }

  // 포인트 거래 내역 조회
  static async getTransactionHistory(userId: string, userRole: 'seller' | 'contractor'): Promise<PointTransaction[]> {
    try {
      // 복합 인덱스 없이 작동하도록 쿼리 수정
      const q = query(
        collection(db, 'pointTransactions'),
        where('userId', '==', userId),
        where('userRole', '==', userRole)
      );

      const querySnapshot = await getDocs(q);
      const transactions: PointTransaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined
        } as PointTransaction);
      });

      // 클라이언트에서 정렬
      return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('거래 내역 조회 실패:', error);
      throw new Error('거래 내역 조회에 실패했습니다.');
    }
  }

  // 48시간 후 지급할 거래들 조회
  static async getPendingPayments(): Promise<PointTransaction[]> {
    try {
      // 복합 인덱스 없이 작동하도록 쿼리 수정
      const q = query(
        collection(db, 'pointTransactions'),
        where('type', '==', 'payment'),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      const pendingPayments: PointTransaction[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = (data.createdAt as Timestamp).toDate();
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        // 48시간이 지난 거래만 필터링
        if (hoursDiff >= 48) {
          pendingPayments.push({
            id: doc.id,
            ...data,
            createdAt,
            completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined
          } as PointTransaction);
        }
      });

      return pendingPayments;
    } catch (error) {
      console.error('대기 중인 지급 조회 실패:', error);
      throw new Error('대기 중인 지급 조회에 실패했습니다.');
    }
  }
}
