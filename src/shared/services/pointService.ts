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
import { PointTransaction, PointBalance, PointEscrow } from '../../types';

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
  // 포인트 잔액 조회
  static async getPointBalance(userId: string, userRole: 'seller' | 'contractor'): Promise<number> {
    try {
      const balanceRef = doc(db, 'pointBalances', userId);
      const balanceDoc = await getDoc(balanceRef);
      
      if (balanceDoc.exists()) {
        const data = balanceDoc.data();
        return data[userRole] || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('포인트 잔액 조회 실패:', error);
      return 0;
    }
  }

  // 포인트 잔액 검증 (시공의뢰 시)
  static async validatePointBalance(userId: string, requiredAmount: number): Promise<{
    isValid: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortage: number;
  }> {
    try {
      const currentBalance = await this.getPointBalance(userId, 'seller');
      const shortage = requiredAmount - currentBalance;
      
      return {
        isValid: currentBalance >= requiredAmount,
        currentBalance,
        requiredAmount,
        shortage
      };
    } catch (error) {
      console.error('포인트 잔액 검증 실패:', error);
      throw new Error('포인트 잔액을 확인할 수 없습니다.');
    }
  }

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

  // 에스크로 포인트 차감 (시공의뢰 시)
  static async escrowPoints(jobId: string, sellerId: string, amount: number): Promise<string> {
    try {
      // 1. 판매자 포인트 차감
      const sellerBalance = await this.getPointBalance(sellerId, 'seller');
      if (sellerBalance < amount) {
        throw new Error('포인트 잔액이 부족합니다.');
      }

      // 2. 시스템 설정에서 자동 지급 시간 조회
      const { SystemSettingsService } = await import('./systemSettingsService');
      const autoReleaseHours = await SystemSettingsService.getEscrowAutoReleaseHours();

      // 3. 에스크로 거래 기록 생성
      const escrowData: PointEscrow = {
        id: `escrow_${jobId}`,
        jobId,
        sellerId,
        amount,
        status: 'pending',
        createdAt: new Date(),
        disputeDeadline: new Date(Date.now() + autoReleaseHours * 60 * 60 * 1000) // 설정된 시간 후
      };

      await setDoc(doc(db, 'pointEscrows', escrowData.id), escrowData);

      // 3. 판매자 포인트 차감 거래 기록
      const transactionData: any = {
        userId: sellerId,
        userRole: 'seller',
        type: 'escrow',
        amount: -amount,
        balance: sellerBalance - amount,
        description: `시공의뢰 에스크로 - ${amount.toLocaleString()}포인트`,
        status: 'completed',
        jobId,
        createdAt: new Date(),
        completedAt: new Date()
      };

      const transactionRef = await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // 4. 판매자 잔액 업데이트
      await this.updatePointBalance(sellerId, 'seller', -amount);

      return escrowData.id;
    } catch (error) {
      console.error('에스크로 포인트 차감 실패:', error);
      throw new Error('에스크로 포인트 차감에 실패했습니다.');
    }
  }

  // 시공 완료 후 48시간 후 포인트 지급
  static async releaseEscrowToContractor(jobId: string, contractorId: string): Promise<void> {
    try {
      // 1. 에스크로 정보 조회
      const escrowRef = doc(db, 'pointEscrows', `escrow_${jobId}`);
      const escrowDoc = await getDoc(escrowRef);
      
      if (!escrowDoc.exists()) {
        throw new Error('에스크로 정보를 찾을 수 없습니다.');
      }

      const escrowData = escrowDoc.data() as PointEscrow;
      
      // 2. 48시간 경과 확인
      const now = new Date();
      if (now < escrowData.disputeDeadline) {
        throw new Error('아직 48시간이 경과하지 않았습니다.');
      }

      // 3. 시공자에게 포인트 지급
      const contractorBalance = await this.getPointBalance(contractorId, 'contractor');
      
      const transactionData: any = {
        userId: contractorId,
        userRole: 'contractor',
        type: 'release',
        amount: escrowData.amount,
        balance: contractorBalance + escrowData.amount,
        description: `시공 완료 보수 - ${escrowData.amount.toLocaleString()}포인트`,
        status: 'completed',
        jobId,
        createdAt: new Date(),
        completedAt: new Date()
      };

      await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // 4. 시공자 잔액 업데이트
      await this.updatePointBalance(contractorId, 'contractor', escrowData.amount);

      // 5. 에스크로 상태 업데이트
      await updateDoc(escrowRef, {
        status: 'released',
        releasedAt: serverTimestamp(),
        contractorId
      });

      console.log(`✅ 에스크로 포인트 ${escrowData.amount}포인트가 시공자에게 지급되었습니다.`);
    } catch (error) {
      console.error('에스크로 포인트 지급 실패:', error);
      throw new Error('에스크로 포인트 지급에 실패했습니다.');
    }
  }

  // 분쟁 발생 시 포인트 환불
  static async refundEscrowToSeller(jobId: string, reason: string): Promise<void> {
    try {
      // 1. 에스크로 정보 조회
      const escrowRef = doc(db, 'pointEscrows', `escrow_${jobId}`);
      const escrowDoc = await getDoc(escrowRef);
      
      if (!escrowDoc.exists()) {
        throw new Error('에스크로 정보를 찾을 수 없습니다.');
      }

      const escrowData = escrowDoc.data() as PointEscrow;
      
      // 2. 판매자에게 포인트 환불
      const sellerBalance = await this.getPointBalance(escrowData.sellerId, 'seller');
      
      const transactionData: any = {
        userId: escrowData.sellerId,
        userRole: 'seller',
        type: 'refund',
        amount: escrowData.amount,
        balance: sellerBalance + escrowData.amount,
        description: `분쟁 환불 - ${escrowData.amount.toLocaleString()}포인트 (사유: ${reason})`,
        status: 'completed',
        jobId,
        createdAt: new Date(),
        completedAt: new Date()
      };

      await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // 3. 판매자 잔액 업데이트
      await this.updatePointBalance(escrowData.sellerId, 'seller', escrowData.amount);

      // 4. 에스크로 상태 업데이트
      await updateDoc(escrowRef, {
        status: 'refunded',
        refundedAt: serverTimestamp(),
        notes: reason
      });

      console.log(`✅ 에스크로 포인트 ${escrowData.amount}포인트가 판매자에게 환불되었습니다.`);
    } catch (error) {
      console.error('에스크로 포인트 환불 실패:', error);
      throw new Error('에스크로 포인트 환불에 실패했습니다.');
    }
  }

  // 포인트 잔액 업데이트
  static async updatePointBalance(userId: string, userRole: 'seller' | 'contractor', amount: number): Promise<void> {
    try {
      const balanceRef = doc(db, 'pointBalances', userId);
      const balanceDoc = await getDoc(balanceRef);
      
      let currentBalance = 0;
      if (balanceDoc.exists()) {
        const data = balanceDoc.data();
        currentBalance = data[userRole] || 0;
      }
      
      const newBalance = currentBalance + amount;
      
      await setDoc(balanceRef, {
        [userRole]: newBalance,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`포인트 잔액 업데이트: ${userId} (${userRole}) ${currentBalance} → ${newBalance}`);
    } catch (error) {
      console.error('포인트 잔액 업데이트 실패:', error);
      throw new Error('포인트 잔액을 업데이트할 수 없습니다.');
    }
  }

  // 거래 내역 조회
  static async getTransactionHistory(userId: string, userRole: 'seller' | 'contractor'): Promise<PointTransaction[]> {
    try {
      const q = query(
        collection(db, 'pointTransactions'),
        where('userId', '==', userId),
        where('userRole', '==', userRole),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: PointTransaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          userId: data.userId,
          userRole: data.userRole,
          type: data.type,
          amount: data.amount,
          balance: data.balance,
          description: data.description,
          jobId: data.jobId,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          adminId: data.adminId,
          notes: data.notes
        });
      });
      
      return transactions;
    } catch (error: any) {
      console.error('거래 내역 조회 실패:', error);
      
      // Firebase 인덱스 오류인 경우 (거래 내역이 없는 경우)
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        // 거래 내역이 없는 경우 빈 배열 반환
        return [];
      }
      
      throw new Error('거래 내역을 조회할 수 없습니다.');
    }
  }

  // 에스크로 정보 조회
  static async getEscrowInfo(jobId: string): Promise<PointEscrow | null> {
    try {
      const escrowRef = doc(db, 'pointEscrows', `escrow_${jobId}`);
      const escrowDoc = await getDoc(escrowRef);
      
      if (!escrowDoc.exists()) {
        return null;
      }
      
      const data = escrowDoc.data();
      return {
        id: data.id,
        jobId: data.jobId,
        sellerId: data.sellerId,
        contractorId: data.contractorId,
        amount: data.amount,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        releasedAt: data.releasedAt?.toDate(),
        refundedAt: data.refundedAt?.toDate(),
        disputeDeadline: data.disputeDeadline?.toDate() || new Date(),
        notes: data.notes
      };
    } catch (error) {
      console.error('에스크로 정보 조회 실패:', error);
      return null;
    }
  }

  // 만료된 에스크로 자동 처리 (관리자용)
  static async processExpiredEscrows(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'pointEscrows'),
        where('status', '==', 'pending'),
        where('disputeDeadline', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const escrowData = doc.data() as PointEscrow;
        
        // 설정된 시간 경과 후 자동으로 시공자에게 지급
        if (escrowData.contractorId) {
          await this.releaseEscrowToContractor(escrowData.jobId, escrowData.contractorId);
        }
      }
      
      console.log(`✅ ${querySnapshot.docs.length}개의 만료된 에스크로를 처리했습니다.`);
    } catch (error) {
      console.error('만료된 에스크로 처리 실패:', error);
      throw new Error('만료된 에스크로를 처리할 수 없습니다.');
    }
  }
}
