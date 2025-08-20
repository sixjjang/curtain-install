/**
 * 전화번호를 010-5555-5555 형식으로 포맷팅하는 함수
 * @param phone 전화번호 문자열
 * @returns 포맷팅된 전화번호
 */
export const formatPhoneNumber = (phone: string): string => {
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  } else {
    // 11자리 초과시 앞에서부터 11자리만 사용
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

/**
 * 전화번호 입력 시 실시간 포맷팅을 위한 함수
 * @param value 현재 입력된 값
 * @returns 포맷팅된 전화번호
 */
export const formatPhoneInput = (value: string): string => {
  // 숫자와 하이픈만 허용
  const cleaned = value.replace(/[^0-9-]/g, '');
  
  // 연속된 하이픈 제거
  const noConsecutiveHyphens = cleaned.replace(/-+/g, '-');
  
  // 하이픈으로 시작하거나 끝나는 경우 제거
  const trimmed = noConsecutiveHyphens.replace(/^-|-$/g, '');
  
  // 숫자만 추출하여 포맷팅
  const numbers = trimmed.replace(/-/g, '');
  
  return formatPhoneNumber(numbers);
};

/**
 * 전화번호에서 숫자만 추출하는 함수
 * @param phone 전화번호 문자열
 * @returns 숫자만 포함된 문자열
 */
export const extractPhoneNumbers = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

/**
 * 전화번호 유효성 검사 함수
 * @param phone 전화번호 문자열
 * @returns 유효한 전화번호인지 여부
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const numbers = extractPhoneNumbers(phone);
  // 10자리 또는 11자리 숫자인지 확인
  return numbers.length === 10 || numbers.length === 11;
};
