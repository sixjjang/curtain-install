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
        '시공일': '2025-08-30',
        '시공시간': '14:00',
        '고객명': '홍성인',
        '고객연락처': '010-1234-5678',
        '고객주소': '서울시 강남구 역삼동 456',
        '기본출장비': '',
        '블라인드': 3,
        '커튼': 2,
        '픽업상호': '공란일경우 판매자 픽업 정보를 사용',
        '픽업연락처': '',
        '픽업주소': '',
        '준비예정일': '',
        '준비예정시간': '',
        '작업설명': '꼼꼼히시공해주세요'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시공의뢰템플릿');
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { width: 12 }, // 시공일
      { width: 10 }, // 시공시간
      { width: 15 }, // 고객명
      { width: 15 }, // 고객연락처
      { width: 25 }, // 고객주소
      { width: 15 }, // 기본출장비
      { width: 10 }, // 블라인드
      { width: 10 }, // 커튼
      { width: 20 }, // 픽업상호
      { width: 15 }, // 픽업연락처
      { width: 25 }, // 픽업주소
      { width: 12 }, // 준비예정일
      { width: 12 }, // 준비예정시간
      { width: 30 }  // 작업설명
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
              // 날짜와 시간 파싱
              const rawScheduledDate = this.getCellValue(row, headers, '시공일');
              const rawScheduledTime = this.getCellValue(row, headers, '시공시간');
              const scheduledDate = this.parseExcelDate(rawScheduledDate);
              const scheduledTime = this.parseExcelTime(rawScheduledTime);
              const pickupScheduledDate = this.parseExcelDate(this.getCellValue(row, headers, '준비예정일'));
              const pickupScheduledTime = this.parseExcelTime(this.getCellValue(row, headers, '준비예정시간'));
              
               // 디버깅을 위한 로그
               console.log(`Row ${index + 1}:`, {
                 headers,
                 row,
                 rawScheduledDate,
                 rawScheduledTime,
                 rawScheduledDateType: typeof rawScheduledDate,
                 rawScheduledTimeType: typeof rawScheduledTime,
                 parsedScheduledDate: scheduledDate,
                 parsedScheduledTime: scheduledTime,
                 rawPickupDate: this.getCellValue(row, headers, '준비예정일'),
                 rawPickupTime: this.getCellValue(row, headers, '준비예정시간'),
                 parsedPickupDate: pickupScheduledDate,
                 parsedPickupTime: pickupScheduledTime
               });
              
              // 수량 파싱
              const blindsQuantity = this.parseNumber(this.getCellValue(row, headers, '블라인드'));
              const curtainsQuantity = this.parseNumber(this.getCellValue(row, headers, '커튼'));
              
              // 제목 자동생성
              const autoTitle = this.generateTitle(
                scheduledDate,
                scheduledTime,
                this.getCellValue(row, headers, '고객주소'),
                blindsQuantity,
                curtainsQuantity
              );
              
              const job: ExcelJobData = {
                id: `excel-${Date.now()}-${index}`,
                title: autoTitle,
                description: this.getCellValue(row, headers, '작업설명') || '',
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime,
                customerName: this.getCellValue(row, headers, '고객명') || '',
                customerPhone: this.getCellValue(row, headers, '고객연락처') || '',
                customerAddress: this.getCellValue(row, headers, '고객주소') || '',
                travelFee: this.parseNumber(this.getCellValue(row, headers, '기본출장비')),
                blindsQuantity: blindsQuantity,
                curtainsQuantity: curtainsQuantity,
                pickupCompanyName: this.getCellValue(row, headers, '픽업상호') || '',
                pickupPhone: this.getCellValue(row, headers, '픽업연락처') || '',
                pickupAddress: this.getCellValue(row, headers, '픽업주소') || '',
                pickupScheduledDate: pickupScheduledDate,
                pickupScheduledTime: pickupScheduledTime,
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
  private static getCellValue(row: any[], headers: string[], columnName: string): any {
    const index = headers.findIndex(header => header === columnName);
    if (index === -1 || index >= row.length) return undefined;
    
    const value = row[index];
    if (value === undefined || value === null) return undefined;
    
    // 숫자는 그대로 반환, 문자열만 trim 처리
    if (typeof value === 'number') {
      return value;
    }
    
    return String(value).trim();
  }

  /**
   * 문자열을 숫자로 변환합니다.
   */
  private static parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    
    // 이미 숫자인 경우
    if (typeof value === 'number') {
      return value;
    }
    
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Excel serial number를 날짜로 변환합니다.
   */
  private static parseExcelDate(value: any): string | undefined {
    console.log('parseExcelDate input:', value, 'type:', typeof value);
    
    if (!value) return undefined;
    
    // 숫자로 변환 가능한지 확인 (Excel serial number)
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 1 && numValue < 2958466) { // 유효한 Excel 날짜 범위
      console.log('Processing as Excel serial number:', numValue);
      try {
        // XLSX 라이브러리의 내장 함수를 사용하여 Excel 날짜를 변환
        const date = XLSX.SSF.parse_date_code(numValue);
        if (date) {
          const year = date.y;
          const month = String(date.m).padStart(2, '0');
          const day = String(date.d).padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log('XLSX parse result:', result);
          return result;
        }
      } catch (error) {
        console.warn('XLSX 날짜 변환 실패, 대체 방법 사용:', error);
      }
      
      // 대체 방법: 수동 계산
      const excelEpoch = new Date(1900, 0, 1);
      let daysToAdd = numValue - 1; // Excel은 1부터 시작
      
      // 1900년 2월 29일 이후의 날짜인 경우 1일을 더함
      if (numValue > 59) {
        daysToAdd = numValue - 2;
      }
      
      const date = new Date(excelEpoch.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      const result = date.toISOString().split('T')[0];
      console.log('Manual calculation result:', result);
      return result;
    }
    
    // 문자열인 경우
    if (typeof value === 'string') {
      console.log('Processing as string:', value);
      
      // 이미 YYYY-MM-DD 형식인 경우
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        console.log('Already in YYYY-MM-DD format');
        return value;
      }
      
      // YYYY/MM/DD 형식인 경우
      if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(value)) {
        console.log('Processing YYYY/MM/DD format');
        const parts = value.split('/');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log('YYYY/MM/DD result:', result);
        return result;
      }
      
      // MM/DD/YYYY 형식인 경우
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        console.log('Processing MM/DD/YYYY format');
        const parts = value.split('/');
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        const result = `${year}-${month}-${day}`;
        console.log('MM/DD/YYYY result:', result);
        return result;
      }
      
      // MM월 DD일 형식인 경우 (예: 08월 28일)
      const monthDayMatch = value.match(/^(\d{1,2})월\s*(\d{1,2})일$/);
      if (monthDayMatch) {
        console.log('Processing MM월 DD일 format');
        const month = monthDayMatch[1].padStart(2, '0');
        const day = monthDayMatch[2].padStart(2, '0');
        const currentYear = new Date().getFullYear();
        const result = `${currentYear}-${month}-${day}`;
        console.log('MM월 DD일 result:', result);
        return result;
      }
      
      // 다른 형식의 날짜인 경우
      console.log('Trying Date constructor');
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().split('T')[0];
        console.log('Date constructor result:', result);
        return result;
      }
    }
    
    console.log('No valid date format found, returning undefined');
    return undefined;
  }

  /**
   * Excel serial number를 시간으로 변환합니다.
   */
  private static parseExcelTime(value: any): string | undefined {
    console.log('parseExcelTime input:', value, 'type:', typeof value);
    
    if (!value) return undefined;
    
    // 숫자로 변환 가능한지 확인 (Excel time serial number)
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) { // Excel 시간은 0~1 범위
      console.log('Processing time as Excel serial number:', numValue);
      const totalMinutes = Math.round(numValue * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      console.log('Excel time result:', result);
      return result;
    }
    
    // 문자열인 경우
    if (typeof value === 'string') {
      console.log('Processing time as string:', value);
      
      // 이미 HH:MM 형식인 경우
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        console.log('Already in HH:MM format');
        return value;
      }
      
      // HH.MM 형식인 경우
      if (/^([01]?[0-9]|2[0-3])\.[0-5][0-9]$/.test(value)) {
        console.log('Processing HH.MM format');
        const result = value.replace('.', ':');
        console.log('HH.MM result:', result);
        return result;
      }
      
      // HHMM 형식인 경우 (예: 1430)
      if (/^([01]?[0-9]|2[0-3])[0-5][0-9]$/.test(value)) {
        console.log('Processing HHMM format');
        const hours = value.substring(0, value.length - 2);
        const minutes = value.substring(value.length - 2);
        const result = `${hours.padStart(2, '0')}:${minutes}`;
        console.log('HHMM result:', result);
        return result;
      }
      
      // AM/PM 형식인 경우 (예: 2:30 PM)
      const ampmMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (ampmMatch) {
        console.log('Processing AM/PM format');
        let hours = parseInt(ampmMatch[1]);
        const minutes = ampmMatch[2];
        const ampm = ampmMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
        
        const result = `${hours.toString().padStart(2, '0')}:${minutes}`;
        console.log('AM/PM result:', result);
        return result;
      }
    }
    
    console.log('No valid time format found, returning undefined');
    return undefined;
  }

  /**
   * 제목을 자동생성합니다.
   */
  static generateTitle(
    scheduledDate?: string,
    scheduledTime?: string,
    customerAddress?: string,
    blindsQuantity?: number,
    curtainsQuantity?: number
  ): string {
    const parts: string[] = [];
    
    // 시공일시
    if (scheduledDate && scheduledTime) {
      const date = new Date(scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const time = scheduledTime;
      parts.push(`${month}/${day} ${time}`);
    }
    
    // 고객주소 (구 단위까지만)
    if (customerAddress) {
      const addressParts = customerAddress.split(' ');
      if (addressParts.length >= 2) {
        parts.push(`${addressParts[1]} ${addressParts[2] || ''}`);
      }
    }
    
    // 품목명
    const items: string[] = [];
    if (curtainsQuantity && curtainsQuantity > 0) {
      items.push(`커튼 ${curtainsQuantity}조`);
    }
    if (blindsQuantity && blindsQuantity > 0) {
      items.push(`블라인드 ${blindsQuantity}창`);
    }
    
    if (items.length > 0) {
      parts.push(items.join(', '));
    }
    
    return parts.join(' / ');
  }

  /**
   * 작업 데이터를 검증합니다.
   */
  private static validateJobData(job: ExcelJobData): { isValid: boolean; errorMessage?: string } {
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
      '시공일': job.scheduledDate || '',
      '시공시간': job.scheduledTime || '',
      '고객명': job.customerName,
      '고객연락처': job.customerPhone,
      '고객주소': job.customerAddress || '',
      '기본출장비': job.travelFee || '',
      '블라인드': job.blindsQuantity || '',
      '커튼': job.curtainsQuantity || '',
      '픽업상호': job.pickupCompanyName || '',
      '픽업연락처': job.pickupPhone || '',
      '픽업주소': job.pickupAddress || '',
      '준비예정일': job.pickupScheduledDate || '',
      '준비예정시간': job.pickupScheduledTime || '',
      '작업설명': job.description || '',
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
