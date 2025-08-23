import { TOSS_PAYMENTS_SECRET_KEY } from '../../config/toss';

interface TransferRequest {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  description: string;
  referenceId: string;
  fromAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  };
}

interface TransferResponse {
  success: boolean;
  transferId?: string;
  error?: string;
}

export class BankTransferService {
  // 토스페이먼츠 API를 통한 실제 은행 이체
  static async transfer(request: TransferRequest): Promise<TransferResponse> {
    try {
      // 출금 계좌 정보 확인
      if (!request.fromAccount || !request.fromAccount.isActive) {
        return {
          success: false,
          error: '출금 계좌가 설정되지 않았거나 비활성화되어 있습니다.'
        };
      }

      // 토스페이먼츠 API 호출
      const response = await fetch('https://api.tosspayments.com/v1/transfers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(TOSS_PAYMENTS_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: request.amount,
          bank: request.bankCode,
          accountNumber: request.accountNumber,
          accountHolder: request.accountHolder,
          description: request.description,
          referenceId: request.referenceId,
          fromAccount: {
            bank: this.getBankCode(request.fromAccount.bankName),
            accountNumber: request.fromAccount.accountNumber,
            accountHolder: request.fromAccount.accountHolder
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          transferId: result.transferId
        };
      } else {
        return {
          success: false,
          error: result.message || '은행 이체에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('은행 이체 API 호출 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '은행 이체 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 이체 상태 조회
  static async getTransferStatus(transferId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`https://api.tosspayments.com/v1/transfers/${transferId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(TOSS_PAYMENTS_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: result.status
        };
      } else {
        return {
          success: false,
          error: result.message || '이체 상태 조회에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('이체 상태 조회 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이체 상태 조회 중 오류가 발생했습니다.'
      };
    }
  }

  // 은행 코드 유효성 검증
  static validateBankInfo(bankCode: string, accountNumber: string, accountHolder: string): {
    isValid: boolean;
    error?: string;
  } {
    // 은행 코드 유효성 검증
    const validBankCodes = [
      '088', '004', '020', '081', '003', '011', '045', '048', '071', 
      '089', '090', '092', '031', '032', '039', '034', '037', '035', 
      '007', '027', '023', '054', '055', '057', '058', '059', '060',
      '061', '062', '063', '064', '065'
    ];

    if (!validBankCodes.includes(bankCode)) {
      return {
        isValid: false,
        error: '유효하지 않은 은행 코드입니다.'
      };
    }

    // 계좌번호 유효성 검증 (기본적인 형식 검증)
    if (!accountNumber || accountNumber.length < 10 || accountNumber.length > 20) {
      return {
        isValid: false,
        error: '유효하지 않은 계좌번호입니다.'
      };
    }

    // 예금주 유효성 검증
    if (!accountHolder || accountHolder.trim().length < 2) {
      return {
        isValid: false,
        error: '유효하지 않은 예금주명입니다.'
      };
    }

    return { isValid: true };
  }

  // 테스트 모드용 시뮬레이션 이체 (개발/테스트 환경에서 사용)
  static async simulateTransfer(request: TransferRequest): Promise<TransferResponse> {
    // 실제 API 호출 없이 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% 확률로 성공 시뮬레이션
        if (Math.random() > 0.1) {
          resolve({
            success: true,
            transferId: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        } else {
          resolve({
            success: false,
            error: '시뮬레이션: 은행 이체에 실패했습니다.'
          });
        }
      }, 1000); // 1초 지연으로 실제 API 호출 시뮬레이션
    });
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
