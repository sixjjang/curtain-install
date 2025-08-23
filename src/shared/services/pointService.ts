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
import { SystemSettingsService } from './systemSettingsService';

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
  // 수수료 계산 함수
  static async calculateFees(amount: number, userRole: 'seller' | 'contractor'): Promise<{
    originalAmount: number;
    feeAmount: number;
    finalAmount: number;
    feeRate: number;
  }> {
    try {
      const settings = await SystemSettingsService.getFeeSettings();
      
      let feeRate = 0;
      if (userRole === 'seller') {
        feeRate = settings.sellerCommissionRate;
      } else if (userRole === 'contractor') {
        feeRate = settings.contractorCommissionRate;
      }
      
      const feeAmount = Math.round(amount * feeRate / 100);
      const finalAmount = amount - feeAmount;
      
      return {
        originalAmount: amount,
        feeAmount,
        finalAmount,
        feeRate
      };
    } catch (error) {
      console.error('수수료 계산 실패:', error);
      // 수수료 계산 실패 시 원본 금액 반환
      return {
        originalAmount: amount,
        feeAmount: 0,
        finalAmount: amount,
        feeRate: 0
      };
    }
  }
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

  // 포인트 잔액 상세 조회 (총충전, 총인출 포함)
  static async getPointBalanceDetails(userId: string, userRole: 'seller' | 'contractor'): Promise<{
    balance: number;
    totalCharged: number;
    totalWithdrawn: number;
  }> {
    try {
      // 1. 현재 잔액 조회
      const balance = await this.getPointBalance(userId, userRole);
      
      let totalCharged = 0;
      let totalWithdrawn = 0;
      
      if (userRole === 'contractor') {
        // 시공자의 경우: 총 수령(시공완료보수), 총 인출(인출)
        
        // 2. 총 수령 금액 계산 (시공완료보수)
        const receivedQuery = query(
          collection(db, 'pointTransactions'),
          where('userId', '==', userId),
          where('userRole', '==', userRole),
          where('type', 'in', ['payment', 'release']),
          where('status', '==', 'completed')
        );
        const receivedDocs = await getDocs(receivedQuery);
        totalCharged = receivedDocs.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + Math.abs(data.amount || 0); // 절댓값으로 계산
        }, 0);
        
        // 3. 총 인출 금액 계산
        const withdrawnQuery = query(
          collection(db, 'pointTransactions'),
          where('userId', '==', userId),
          where('userRole', '==', userRole),
          where('type', '==', 'withdraw'),
          where('status', '==', 'completed')
        );
        const withdrawnDocs = await getDocs(withdrawnQuery);
        totalWithdrawn = withdrawnDocs.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + Math.abs(data.amount || 0); // 절댓값으로 계산
        }, 0);
      } else {
        // 판매자의 경우: 총 충전, 총 사용
        
        // 2. 총충전 금액 계산
        const chargedQuery = query(
          collection(db, 'pointTransactions'),
          where('userId', '==', userId),
          where('userRole', '==', userRole),
          where('type', '==', 'charge'),
          where('status', '==', 'completed')
        );
        const chargedDocs = await getDocs(chargedQuery);
        totalCharged = chargedDocs.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        
        // 3. 총 사용 금액 계산 (에스크로)
        const usedQuery = query(
          collection(db, 'pointTransactions'),
          where('userId', '==', userId),
          where('userRole', '==', userRole),
          where('type', '==', 'escrow'),
          where('status', '==', 'completed')
        );
        const usedDocs = await getDocs(usedQuery);
        totalWithdrawn = usedDocs.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + Math.abs(data.amount || 0); // 절댓값으로 계산
        }, 0);
      }
      
      return {
        balance,
        totalCharged,
        totalWithdrawn
      };
    } catch (error) {
      console.error('포인트 잔액 상세 조회 실패:', error);
      return {
        balance: 0,
        totalCharged: 0,
        totalWithdrawn: 0
      };
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
      console.log('🔍 에스크로 포인트 차감 시작:', { jobId, sellerId, amount });
      
      // 1. 판매자 포인트 차감 (최신 잔액 확인)
      const sellerBalance = await this.getPointBalance(sellerId, 'seller');
      console.log('🔍 에스크로 차감 전 잔액 확인:', { sellerBalance, requiredAmount: amount });
      
      if (sellerBalance < amount) {
        console.error('❌ 에스크로 차감 실패 - 잔액 부족:', { 
          currentBalance: sellerBalance, 
          requiredAmount: amount, 
          shortage: amount - sellerBalance 
        });
        throw new Error('포인트 잔액이 부족합니다.');
      }
      
      console.log('✅ 에스크로 차감 가능 - 잔액 충분');

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

      // 3. 수수료 계산
      const feeCalculation = await this.calculateFees(amount, 'seller');
      
      // 4. 판매자 포인트 차감 거래 기록 (수수료 포함)
      const transactionData: any = {
        userId: sellerId,
        userRole: 'seller',
        type: 'escrow',
        amount: -(amount + feeCalculation.feeAmount),
        balance: sellerBalance - (amount + feeCalculation.feeAmount),
        description: `시공의뢰 에스크로 - ${amount.toLocaleString()}포인트 (수수료 ${feeCalculation.feeRate}%: ${feeCalculation.feeAmount.toLocaleString()}포인트)`,
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

      // 5. 판매자 잔액 업데이트 (수수료 포함)
      await this.updatePointBalance(sellerId, 'seller', -(amount + feeCalculation.feeAmount));

      return escrowData.id;
    } catch (error) {
      console.error('에스크로 포인트 차감 실패:', error);
      throw new Error('에스크로 포인트 차감에 실패했습니다.');
    }
  }

  // 시공 완료 후 즉시 포인트 지급
  static async releaseEscrowToContractor(jobId: string, contractorId: string): Promise<void> {
    try {
      // 1. 에스크로 정보 조회
      const escrowRef = doc(db, 'pointEscrows', `escrow_${jobId}`);
      const escrowDoc = await getDoc(escrowRef);
      
      if (!escrowDoc.exists()) {
        throw new Error('에스크로 정보를 찾을 수 없습니다.');
      }

      const escrowData = escrowDoc.data() as PointEscrow;
      
      // 2. 이미 지급되었는지 확인
      if (escrowData.status === 'released') {
        console.log(`이미 지급된 에스크로입니다: ${jobId}`);
        return;
      }

      // 3. 수수료 계산
      const feeCalculation = await this.calculateFees(escrowData.amount, 'contractor');
      const contractorBalance = await this.getPointBalance(contractorId, 'contractor');
      
      // 4. 시공자에게 포인트 지급 (수수료 차감 후)
      const transactionData: any = {
        userId: contractorId,
        userRole: 'contractor',
        type: 'release',
        amount: feeCalculation.finalAmount,
        balance: contractorBalance + feeCalculation.finalAmount,
        description: `시공 완료 보수 - ${escrowData.amount.toLocaleString()}포인트 (수수료 ${feeCalculation.feeRate}% 차감: ${feeCalculation.feeAmount.toLocaleString()}포인트)`,
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

      // 5. 시공자 잔액 업데이트 (수수료 차감 후 금액)
      await this.updatePointBalance(contractorId, 'contractor', feeCalculation.finalAmount);

      // 5. 에스크로 상태 업데이트
      await updateDoc(escrowRef, {
        status: 'released',
        releasedAt: serverTimestamp(),
        contractorId
      });

      console.log(`✅ 에스크로 포인트 ${escrowData.amount}포인트가 시공자에게 지급되었습니다. (수수료 ${feeCalculation.feeRate}% 차감: ${feeCalculation.feeAmount}포인트)`);
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
      
      // 2. 수수료 계산 (원래 차감된 수수료만큼 환불)
      const feeCalculation = await this.calculateFees(escrowData.amount, 'seller');
      const sellerBalance = await this.getPointBalance(escrowData.sellerId, 'seller');
      
      // 3. 판매자에게 포인트 환불 (수수료 포함)
      const transactionData: any = {
        userId: escrowData.sellerId,
        userRole: 'seller',
        type: 'refund',
        amount: escrowData.amount + feeCalculation.feeAmount,
        balance: sellerBalance + escrowData.amount + feeCalculation.feeAmount,
        description: `분쟁 환불 - ${escrowData.amount.toLocaleString()}포인트 + 수수료 ${feeCalculation.feeAmount.toLocaleString()}포인트 (사유: ${reason})`,
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

      // 4. 판매자 잔액 업데이트 (수수료 포함)
      await this.updatePointBalance(escrowData.sellerId, 'seller', escrowData.amount + feeCalculation.feeAmount);

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

  // 거래 내역 조회 (기간별 필터링 지원)
  static async getTransactionHistory(
    userId: string, 
    userRole: 'seller' | 'contractor',
    period?: '1month' | '3months' | '6months' | '1year' | 'all'
  ): Promise<PointTransaction[]> {
    try {
      // TODO: Firebase Console에서 다음 인덱스를 생성하여 성능 최적화
      // 컬렉션: pointTransactions
      // 필드: userId (Ascending), userRole (Ascending), createdAt (Descending)
      // 
      // Firebase Console > Firestore Database > Indexes > Composite 탭에서 생성
      // 또는 오류 메시지의 링크를 클릭하여 자동 생성
      
      // 기간별 필터링을 위한 날짜 계산
      let startDate: Date | null = null;
      if (period && period !== 'all') {
        const now = new Date();
        switch (period) {
          case '1month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case '3months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case '6months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            break;
          case '1year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
        }
      }
      
      // 인덱스 오류를 방지하기 위해 단순한 쿼리 사용
      const q = query(
        collection(db, 'pointTransactions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions: PointTransaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        
        // 클라이언트에서 userRole 필터링
        if (data.userRole === userRole) {
          // 기간별 필터링 적용
          if (startDate && createdAt < startDate) {
            return; // 이 기간에 포함되지 않는 거래는 제외
          }
          
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
            createdAt,
            completedAt: data.completedAt?.toDate(),
            adminId: data.adminId,
            notes: data.notes
          });
        }
      });
      
      // 클라이언트에서 정렬 (최신순)
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
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

  // 포인트 인출 요청
  static async requestWithdrawal(
    userId: string, 
    userRole: 'seller' | 'contractor', 
    amount: number,
    bankInfo?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    }
  ): Promise<void> {
    try {
      // 1. 현재 잔액 확인
      const currentBalance = await this.getPointBalance(userId, userRole);
      
      if (currentBalance < amount) {
        throw new Error('잔액이 부족합니다.');
      }
      
      if (amount <= 0) {
        throw new Error('인출 금액은 0보다 커야 합니다.');
      }
      
      // 2. 인출 거래 내역 생성
      const transactionData = {
        userId,
        userRole,
        type: 'withdraw' as const,
        amount: -amount, // 인출은 음수로 기록
        balance: currentBalance - amount,
        description: '포인트 인출',
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        bankInfo: bankInfo || null,
        notes: '인출 요청 처리 중'
      };
      
      // 3. 거래 내역 저장
      await addDoc(collection(db, 'pointTransactions'), transactionData);
      
      // 4. 잔액 업데이트 (즉시 차감)
      const balanceRef = doc(db, 'pointBalances', userId);
      await updateDoc(balanceRef, {
        [userRole]: currentBalance - amount,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ ${amount}포인트 인출 요청이 완료되었습니다.`);
    } catch (error) {
      console.error('포인트 인출 요청 실패:', error);
      throw error;
    }
  }

  // 모든 인출 요청 조회 (관리자용)
  static async getAllWithdrawalRequests(): Promise<PointTransaction[]> {
    try {
      // 인덱스 오류를 방지하기 위해 단순한 쿼리 사용
      const q = query(
        collection(db, 'pointTransactions')
      );
      
      const querySnapshot = await getDocs(q);
      const withdrawals: PointTransaction[] = [];
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        
        // 클라이언트에서 withdraw 타입 필터링
        if (data.type === 'withdraw') {
          const createdAt = data.createdAt?.toDate() || new Date();
          
          withdrawals.push({
            id: doc.id,
            userId: data.userId,
            userRole: data.userRole,
            type: data.type,
            amount: data.amount,
            balance: data.balance,
            description: data.description,
            jobId: data.jobId,
            status: data.status,
            createdAt,
            completedAt: data.completedAt?.toDate(),
            adminId: data.adminId,
            notes: data.notes,
            bankInfo: data.bankInfo,
            relatedTransactionId: data.relatedTransactionId
          });
        }
      }
      
      // 클라이언트에서 정렬 (최신순)
      withdrawals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return withdrawals;
    } catch (error) {
      console.error('인출 요청 조회 실패:', error);
      throw new Error('인출 요청을 조회할 수 없습니다.');
    }
  }

  // 인출 승인 (관리자용) - 실제 은행 API 연동
  static async approveWithdrawal(transactionId: string, adminNote?: string): Promise<void> {
    try {
      const transactionRef = doc(db, 'pointTransactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('인출 요청을 찾을 수 없습니다.');
      }
      
      const transactionData = transactionDoc.data();
      
      if (transactionData.status !== 'pending') {
        throw new Error('이미 처리된 인출 요청입니다.');
      }
      
      // 은행 정보 확인
      if (!transactionData.bankInfo) {
        throw new Error('은행 정보가 없습니다. 사용자에게 은행 정보를 요청해주세요.');
      }
      
      // 실제 은행 API를 통한 자동 입금 처리
      const transferResult = await this.processBankTransfer({
        amount: Math.abs(transactionData.amount),
        bankInfo: transactionData.bankInfo,
        description: `포인트 인출 - ${transactionData.userId}`,
        transactionId: transactionId
      });
      
      if (!transferResult.success) {
        throw new Error(`은행 입금 실패: ${transferResult.error}`);
      }
      
      // 거래 상태를 완료로 업데이트
      await updateDoc(transactionRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        adminId: 'admin', // 실제로는 현재 관리자 ID를 사용해야 함
        notes: adminNote || '관리자 승인 - 자동 입금 완료',
        transferId: transferResult.transferId, // 은행 이체 ID 저장
        transferCompletedAt: serverTimestamp()
      });
      
      console.log(`✅ 인출 요청 ${transactionId}가 승인되고 은행 입금이 완료되었습니다.`);
    } catch (error) {
      console.error('인출 승인 실패:', error);
      throw error;
    }
  }

  // 인출 승인 (관리자용) - 수동 은행 정보 입력
  static async approveWithdrawalWithBankInfo(
    transactionId: string, 
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    },
    adminNote?: string
  ): Promise<void> {
    try {
      const transactionRef = doc(db, 'pointTransactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('인출 요청을 찾을 수 없습니다.');
      }
      
      const transactionData = transactionDoc.data();
      
      if (transactionData.status !== 'pending') {
        throw new Error('이미 처리된 인출 요청입니다.');
      }
      
      // 실제 은행 API를 통한 자동 입금 처리 (수동 입력된 은행 정보 사용)
      const transferResult = await this.processBankTransfer({
        amount: Math.abs(transactionData.amount),
        bankInfo: bankInfo,
        description: `포인트 인출 - ${transactionData.userId}`,
        transactionId: transactionId
      });
      
      if (!transferResult.success) {
        throw new Error(`은행 입금 실패: ${transferResult.error}`);
      }
      
      // 거래 상태를 완료로 업데이트 (은행 정보도 함께 저장)
      await updateDoc(transactionRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        adminId: 'admin', // 실제로는 현재 관리자 ID를 사용해야 함
        notes: adminNote || '관리자 승인 - 수동 은행 정보로 자동 입금 완료',
        transferId: transferResult.transferId, // 은행 이체 ID 저장
        transferCompletedAt: serverTimestamp(),
        bankInfo: bankInfo // 수동 입력된 은행 정보 저장
      });
      
      console.log(`✅ 인출 요청 ${transactionId}가 수동 은행 정보로 승인되고 은행 입금이 완료되었습니다.`);
    } catch (error) {
      console.error('인출 승인 실패:', error);
      throw error;
    }
  }

  // 인출 거절 (관리자용)
  static async rejectWithdrawal(transactionId: string, adminNote?: string): Promise<void> {
    try {
      const transactionRef = doc(db, 'pointTransactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        throw new Error('인출 요청을 찾을 수 없습니다.');
      }
      
      const transactionData = transactionDoc.data();
      
      if (transactionData.status !== 'pending') {
        throw new Error('이미 처리된 인출 요청입니다.');
      }
      
      // 거래 상태를 실패로 업데이트
      await updateDoc(transactionRef, {
        status: 'failed',
        completedAt: serverTimestamp(),
        adminId: 'admin', // 실제로는 현재 관리자 ID를 사용해야 함
        notes: adminNote || '관리자 거절'
      });
      
      // 포인트 환불
      const refundAmount = Math.abs(transactionData.amount);
      await this.updatePointBalance(transactionData.userId, transactionData.userRole, refundAmount);
      
      // 환불 거래 내역 생성
      const refundTransactionData = {
        userId: transactionData.userId,
        userRole: transactionData.userRole,
        type: 'refund' as const,
        amount: refundAmount,
        balance: 0, // 나중에 업데이트됨
        description: `인출 거절 환불 - ${refundAmount.toLocaleString()}포인트`,
        status: 'completed' as const,
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        adminId: 'admin',
        notes: `인출 거절로 인한 환불 (사유: ${adminNote || '관리자 거절'})`,
        relatedTransactionId: transactionId
      };
      
      await addDoc(collection(db, 'pointTransactions'), refundTransactionData);
      
      console.log(`✅ 인출 요청 ${transactionId}가 거절되었고 포인트가 환불되었습니다.`);
    } catch (error) {
      console.error('인출 거절 실패:', error);
      throw error;
    }
  }

  // 은행 API를 통한 실제 입금 처리
  private static async processBankTransfer(params: {
    amount: number;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
    description: string;
    transactionId: string;
  }): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      // 토스페이먼츠 계좌 설정 확인
      const { SystemSettingsService } = await import('./systemSettingsService');
      const tossAccount = await SystemSettingsService.getTossAccount();
      
      if (!tossAccount || !tossAccount.isActive) {
        return {
          success: false,
          error: '토스페이먼츠 계좌가 설정되지 않았거나 비활성화되어 있습니다. 관리자 설정에서 계좌 정보를 확인해주세요.'
        };
      }

      const { BankTransferService } = await import('./bankTransferService');
      const { ENABLE_BANK_TRANSFER_SIMULATION } = await import('../../config/toss');
      
      let transferResult;
      
      if (ENABLE_BANK_TRANSFER_SIMULATION) {
        // 시뮬레이션 모드 (개발/테스트 환경)
        console.log('🏦 시뮬레이션 모드: 은행 이체 처리 중...');
        transferResult = await BankTransferService.simulateTransfer({
          amount: params.amount,
          bankCode: this.getBankCode(params.bankInfo.bankName),
          accountNumber: params.bankInfo.accountNumber,
          accountHolder: params.bankInfo.accountHolder,
          description: params.description,
          referenceId: params.transactionId,
          fromAccount: tossAccount // 관리자 계좌에서 출금
        });
      } else {
        // 실제 은행 API 연동
        console.log('🏦 실제 은행 API: 이체 처리 중...');
        transferResult = await BankTransferService.transfer({
          amount: params.amount,
          bankCode: this.getBankCode(params.bankInfo.bankName),
          accountNumber: params.bankInfo.accountNumber,
          accountHolder: params.bankInfo.accountHolder,
          description: params.description,
          referenceId: params.transactionId,
          fromAccount: tossAccount // 관리자 계좌에서 출금
        });
      }
      
      return transferResult;
    } catch (error) {
      console.error('은행 이체 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '은행 이체 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 보상 포인트 지급
  static async addCompensationPoints(
    userId: string, 
    userRole: 'seller' | 'contractor', 
    amount: number, 
    compensationType: 'product_not_ready' | 'customer_absent' | 'schedule_change',
    description: string,
    jobId?: string
  ): Promise<void> {
    try {
      // 1. 수수료 계산
      const feeCalculation = await this.calculateFees(amount, userRole);
      const currentBalance = await this.getPointBalance(userId, userRole);
      const newBalance = currentBalance + feeCalculation.finalAmount;

      // 2. 거래 기록 생성 (수수료 차감 후 금액)
      const transactionData: any = {
        userId,
        userRole,
        type: 'compensation',
        amount: feeCalculation.finalAmount,
        balance: newBalance,
        description: `${description} (수수료 ${feeCalculation.feeRate}% 차감: ${feeCalculation.feeAmount.toLocaleString()}포인트)`,
        status: 'completed',
        jobId,
        compensationType,
        createdAt: new Date(),
        completedAt: new Date()
      };

      await addDoc(collection(db, 'pointTransactions'), {
        ...removeUndefinedValues(transactionData),
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // 3. 잔액 업데이트 (수수료 차감 후 금액)
      await this.updatePointBalance(userId, userRole, feeCalculation.finalAmount);

      console.log(`✅ 보상 포인트 지급 완료: ${userId} (${userRole}) - ${amount}포인트 (수수료 ${feeCalculation.feeRate}% 차감: ${feeCalculation.feeAmount}포인트)`);
    } catch (error) {
      console.error('보상 포인트 지급 실패:', error);
      throw new Error('보상 포인트 지급에 실패했습니다.');
    }
  }

  // 은행명을 은행 코드로 변환
  private static getBankCode(bankName: string): string {
    const bankCodeMap: { [key: string]: string } = {
      '신한은행': '088',
      '국민은행': '004',
      '우리은행': '020',
      '하나은행': '081',
      '기업은행': '003',
      '농협은행': '011',
      '새마을금고': '045',
      '신협': '048',
      '우체국': '071',
      '케이뱅크': '089',
      '카카오뱅크': '090',
      '토스뱅크': '092',
      '대구은행': '031',
      '부산은행': '032',
      '경남은행': '039',
      '광주은행': '034',
      '전북은행': '037',
      '제주은행': '035',
      '수협은행': '007',
      '한국스탠다드차타드은행': '027',
      '한국씨티은행': '023',
      'HSBC': '054',
      '도이치은행': '055',
      'JP모간체이스은행': '057',
      '미즈호은행': '058',
      '미쓰비시도쿄UFJ은행': '059',
      'BNP파리바은행': '060',
      '중국공상은행': '061',
      '중국은행': '062',
      '중국건설은행': '063',
      '중국농업은행': '064',
      '중국교통은행': '065'
    };
    
    return bankCodeMap[bankName] || '088'; // 기본값: 신한은행
  }
}
