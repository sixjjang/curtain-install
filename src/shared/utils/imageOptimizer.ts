interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSize?: number; // bytes
  format?: 'jpeg' | 'png' | 'webp';
}

interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * 이미지 파일을 최적화합니다.
 * @param file 원본 이미지 파일
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 결과
 */
export const optimizeImage = async (
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxFileSize = 2 * 1024 * 1024, // 2MB
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // 원본 크기
        const originalWidth = img.width;
        const originalHeight = img.height;

        // 새로운 크기 계산 (비율 유지)
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (originalWidth > maxWidth || originalHeight > maxHeight) {
          const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
          newWidth = Math.round(originalWidth * ratio);
          newHeight = Math.round(originalHeight * ratio);
        }

        // 캔버스 크기 설정
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // 최적화된 이미지 생성
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 최적화에 실패했습니다.'));
              return;
            }

            // 파일 크기가 여전히 큰 경우 품질을 더 낮춤
            if (blob.size > maxFileSize) {
              const reducedQuality = Math.max(0.1, quality * (maxFileSize / blob.size));
              canvas.toBlob(
                (finalBlob) => {
                  if (!finalBlob) {
                    reject(new Error('이미지 최적화에 실패했습니다.'));
                    return;
                  }

                  const optimizedFile = new File([finalBlob], file.name, {
                    type: `image/${format}`,
                    lastModified: Date.now()
                  });

                  const reader = new FileReader();
                  reader.onload = (e) => {
                    resolve({
                      file: optimizedFile,
                      dataUrl: e.target?.result as string,
                      originalSize: file.size,
                      optimizedSize: finalBlob.size,
                      compressionRatio: (file.size - finalBlob.size) / file.size
                    });
                  };
                  reader.readAsDataURL(optimizedFile);
                },
                `image/${format}`,
                reducedQuality
              );
            } else {
              const optimizedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });

              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  file: optimizedFile,
                  dataUrl: e.target?.result as string,
                  originalSize: file.size,
                  optimizedSize: blob.size,
                  compressionRatio: (file.size - blob.size) / file.size
                });
              };
              reader.readAsDataURL(optimizedFile);
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다.
 * @param bytes 바이트 단위 크기
 * @returns 포맷된 크기 문자열
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 이미지 파일 유효성을 검사합니다.
 * @param file 검사할 파일
 * @param maxSize 최대 파일 크기 (bytes)
 * @returns 유효성 검사 결과
 */
export const validateImageFile = (
  file: File,
  maxSize: number = 10 * 1024 * 1024 // 10MB
): { isValid: boolean; error?: string } => {
  // 파일 타입 검사
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '이미지 파일만 업로드 가능합니다.' };
  }

  // 파일 크기 검사
  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다.` 
    };
  }

  return { isValid: true };
};

/**
 * 이미지 미리보기 URL을 생성합니다.
 * @param file 이미지 파일
 * @returns 미리보기 URL
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('이미지 미리보기 생성에 실패했습니다.'));
    reader.readAsDataURL(file);
  });
};
