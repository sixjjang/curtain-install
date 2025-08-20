import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ExcelJobData } from '../../types';

export class ExcelUploadService {
  /**
   * 엑셀 템플릿 파일을 다운로드합니다.
   */
  static downloadTemplate(): void {
    const templateData = [
      {
        '제목': '예시: 커튼 설치',
        '설명': '예시: 거실 커튼 설치 작업입니다.',
        '주소': '예시: 서울시 강남구 테헤란로 123',
        '시공일': '2024-01-15',
        '시공시간': '14:00',
        '고객명': '홍길동',
        '고객연락처': '010-1234-5678',
        '최소예산': 50000,
        '최대예산': 80000,
        '내부작업여부': 'N'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시공의뢰템플릿');
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { width: 20 }, // 제목
      { width: 30 }, // 설명
      { width: 25 }, // 주소
      { width: 12 }, // 시공일
      { width: 10 }, // 시공시간
      { width: 15 }, // 고객명
      { width: 15 }, // 고객연락처
      { width: 12 }, // 최소예산
      { width: 12 }, // 최대예산
      { width: 15 }  // 내부작업여부
    ];

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, '시공의뢰_템플릿.xlsx');
  }

  /**
   * 엑셀 파일을 읽어서 작업 데이터로 변환합니다.
   */
  static async parseExcelFile(file: File): Promise<ExcelJobData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // 엑셀 데이터를 JSON으로 변환
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // 헤더 제거하고 데이터만 추출
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          const jobs: ExcelJobData[] = rows
            .filter(row => row.some(cell => cell !== undefined && cell !== ''))
            .map((row, index) => {
              const job: ExcelJobData = {
                id: `excel-${Date.now()}-${index}`,
                title: this.getCellValue(row, headers, '제목') || '',
                description: this.getCellValue(row, headers, '설명') || '',
                address: this.getCellValue(row, headers, '주소') || '',
                scheduledDate: this.getCellValue(row, headers, '시공일'),
                scheduledTime: this.getCellValue(row, headers, '시공시간'),
                customerName: this.getCellValue(row, headers, '고객명') || '',
                customerPhone: this.getCellValue(row, headers, '고객연락처') || '',
                budgetMin: this.parseNumber(this.getCellValue(row, headers, '최소예산')),
                budgetMax: this.parseNumber(this.getCellValue(row, headers, '최대예산')),
                isInternal: this.getCellValue(row, headers, '내부작업여부')?.toUpperCase() === 'Y',
                workInstructions: [],
                status: 'pending',
                isSelected: true
              };

              // 데이터 검증
              const validation = this.validateJobData(job);
              if (!validation.isValid) {
                job.status = 'error';
                job.errorMessage = validation.errorMessage;
              } else {
                job.status = 'ready';
              }

              return job;
            });

          resolve(jobs);
        } catch (error) {
          reject(new Error('엑셀 파일을 읽는 중 오류가 발생했습니다.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 셀 값을 안전하게 가져옵니다.
   */
  private static getCellValue(row: any[], headers: string[], columnName: string): string | undefined {
    const index = headers.findIndex(header => header === columnName);
    if (index === -1 || index >= row.length) return undefined;
    
    const value = row[index];
    return value !== undefined && value !== null ? String(value).trim() : undefined;
  }

  /**
   * 문자열을 숫자로 변환합니다.
   */
  private static parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * 작업 데이터를 검증합니다.
   */
  private static validateJobData(job: ExcelJobData): { isValid: boolean; errorMessage?: string } {
    if (!job.title) {
      return { isValid: false, errorMessage: '제목은 필수입니다.' };
    }
    
    if (!job.address) {
      return { isValid: false, errorMessage: '주소는 필수입니다.' };
    }
    
    if (!job.customerName) {
      return { isValid: false, errorMessage: '고객명은 필수입니다.' };
    }
    
    if (!job.customerPhone) {
      return { isValid: false, errorMessage: '고객연락처는 필수입니다.' };
    }
    
    // 전화번호 형식 검증
    const phoneRegex = /^[0-9-]+$/;
    if (!phoneRegex.test(job.customerPhone.replace(/\s/g, ''))) {
      return { isValid: false, errorMessage: '올바른 전화번호 형식이 아닙니다.' };
    }
    
    // 예산 검증
    if (job.budgetMin && job.budgetMax && job.budgetMin > job.budgetMax) {
      return { isValid: false, errorMessage: '최소예산은 최대예산보다 클 수 없습니다.' };
    }
    
    // 날짜 형식 검증
    if (job.scheduledDate) {
      const date = new Date(job.scheduledDate);
      if (isNaN(date.getTime())) {
        return { isValid: false, errorMessage: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' };
      }
    }
    
    // 시간 형식 검증
    if (job.scheduledTime) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(job.scheduledTime)) {
        return { isValid: false, errorMessage: '올바른 시간 형식이 아닙니다. (HH:MM)' };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 작업 데이터를 엑셀 형식으로 내보냅니다.
   */
  static exportJobsToExcel(jobs: ExcelJobData[]): void {
    const exportData = jobs.map(job => ({
      '제목': job.title,
      '설명': job.description,
      '주소': job.address,
      '시공일': job.scheduledDate || '',
      '시공시간': job.scheduledTime || '',
      '고객명': job.customerName,
      '고객연락처': job.customerPhone,
      '최소예산': job.budgetMin || '',
      '최대예산': job.budgetMax || '',
      '내부작업여부': job.isInternal ? 'Y' : 'N',
      '상태': job.status === 'ready' ? '준비완료' : job.status === 'error' ? '오류' : '대기중',
      '오류메시지': job.errorMessage || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시공의뢰목록');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `시공의뢰목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}
