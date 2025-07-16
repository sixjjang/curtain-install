import { useState } from "react";
import { getFirestore, collection, addDoc, Timestamp, doc, updateDoc, increment } from "firebase/firestore";
import { 
  ArrowDownTrayIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";

const firestore = getFirestore();

const PhotoDownloadButton = ({ 
  photoUrl, 
  photoId, 
  contractorId, 
  buyerId, 
  price = 0,
  photoName = "사진",
  onDownloadComplete,
  showPrice = true,
  disabled = false
}) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadCount, setDownloadCount] = useState(0);

  const handleDownload = async () => {
    if (disabled || downloading) return;

    try {
      setDownloading(true);
      setError(null);

      // 1. 다운로드 기록 저장
      const downloadData = {
        photoId,
        buyerId,
        contractorId,
        price: Number(price),
        photoUrl,
        photoName,
        downloadedAt: Timestamp.now(),
        status: "completed",
        userAgent: navigator.userAgent,
        ipAddress: null, // 서버에서 설정
        downloadMethod: "web"
      };

      const downloadRef = await addDoc(collection(firestore, "downloads"), downloadData);

      // 2. 사진 다운로드 통계 업데이트
      try {
        const photoRef = doc(firestore, "photos", photoId);
        await updateDoc(photoRef, {
          downloadCount: increment(1),
          lastDownloadedAt: Timestamp.now(),
          totalRevenue: increment(Number(price))
        });
      } catch (statsError) {
        console.warn("통계 업데이트 실패:", statsError);
      }

      // 3. 실제 파일 다운로드
      await downloadFile(photoUrl, photoName);

      // 4. 성공 처리
      setDownloadCount(prev => prev + 1);
      
      if (onDownloadComplete) {
        onDownloadComplete({
          downloadId: downloadRef.id,
          photoId,
          price: Number(price),
          timestamp: new Date()
        });
      }

      // 5. 성공 메시지 (선택사항)
      showSuccessMessage(price);

    } catch (error) {
      console.error("다운로드 오류:", error);
      setError("다운로드 중 오류가 발생했습니다. 다시 시도해주세요.");
      
      // 실패 기록 저장
      try {
        await addDoc(collection(firestore, "downloads"), {
          photoId,
          buyerId,
          contractorId,
          price: Number(price),
          photoUrl,
          photoName,
          downloadedAt: Timestamp.now(),
          status: "failed",
          error: error.message,
          userAgent: navigator.userAgent
        });
      } catch (logError) {
        console.error("오류 로그 저장 실패:", logError);
      }
    } finally {
      setDownloading(false);
    }
  };

  const downloadFile = async (url, filename) => {
    return new Promise((resolve, reject) => {
      try {
        // 파일 확장자 추출
        const urlParts = url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0];
        const safeFilename = `${filename}.${extension}`;

        // Fetch를 사용한 다운로드 (더 안전함)
        fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            // Blob URL 생성
            const blobUrl = window.URL.createObjectURL(blob);
            
            // 다운로드 링크 생성
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = safeFilename;
            link.style.display = "none";
            
            // 다운로드 실행
            document.body.appendChild(link);
            link.click();
            
            // 정리
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            resolve();
          })
          .catch(error => {
            reject(new Error(`파일 다운로드 실패: ${error.message}`));
          });
      } catch (error) {
        reject(error);
      }
    });
  };

  const showSuccessMessage = (price) => {
    if (price > 0) {
      // 가격이 있는 경우 성공 메시지 표시
      const message = `다운로드가 완료되었습니다!\n비용: ₩${price.toLocaleString()}`;
      alert(message);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  const getButtonVariant = () => {
    if (disabled) return "bg-gray-300 text-gray-500 cursor-not-allowed";
    if (downloading) return "bg-blue-500 text-white cursor-wait";
    if (price > 0) return "bg-green-600 hover:bg-green-700 text-white";
    return "bg-blue-600 hover:bg-blue-700 text-white";
  };

  const getButtonText = () => {
    if (downloading) return "다운로드 중...";
    if (price > 0) return `다운로드 (₩${formatPrice(price)})`;
    return "무료 다운로드";
  };

  const getButtonIcon = () => {
    if (downloading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      );
    }
    if (price > 0) {
      return <CurrencyDollarIcon className="h-4 w-4" />;
    }
    return <ArrowDownTrayIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      {/* 다운로드 버튼 */}
      <button
        onClick={handleDownload}
        disabled={disabled || downloading}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${getButtonVariant()}`}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* 성공 메시지 */}
      {downloadCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">
            다운로드 완료! {price > 0 && `(₩${formatPrice(price)} 청구됨)`}
          </p>
        </div>
      )}

      {/* 추가 정보 */}
      {showPrice && price > 0 && (
        <div className="text-xs text-gray-500 text-center">
          <p>이 사진을 다운로드하면 ₩{formatPrice(price)}가 청구됩니다.</p>
          <p>다운로드 기록이 자동으로 저장됩니다.</p>
        </div>
      )}
    </div>
  );
};

// 고급 다운로드 버튼 (더 많은 기능 포함)
export const AdvancedPhotoDownloadButton = ({ 
  photoUrl, 
  photoId, 
  contractorId, 
  buyerId, 
  price = 0,
  photoName = "사진",
  onDownloadComplete,
  showPreview = true,
  showDetails = true
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);

  const handleDownloadWithPreview = () => {
    if (showPreview) {
      setShowPreviewModal(true);
    } else {
      // 직접 다운로드
      handleDownload();
    }
  };

  const handleDownload = async () => {
    // 기본 다운로드 로직 호출
    const result = await handleDownload();
    if (result) {
      setDownloadHistory(prev => [result, ...prev.slice(0, 4)]);
    }
    setShowPreviewModal(false);
  };

  return (
    <div className="space-y-4">
      {/* 메인 다운로드 버튼 */}
      <PhotoDownloadButton
        photoUrl={photoUrl}
        photoId={photoId}
        contractorId={contractorId}
        buyerId={buyerId}
        price={price}
        photoName={photoName}
        onDownloadComplete={onDownloadComplete}
        showPrice={true}
      />

      {/* 사진 미리보기 */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <img
            src={photoUrl}
            alt={photoName}
            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setShowPreviewModal(true)}
          />
          <div className="p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{photoName}</p>
            {showDetails && (
              <div className="mt-1 text-xs text-gray-500">
                <p>가격: ₩{price.toLocaleString()}</p>
                <p>ID: {photoId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{photoName}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <img
              src={photoUrl}
              alt={photoName}
              className="w-full h-auto rounded-lg mb-4"
            />
            
            <div className="flex gap-3">
              <PhotoDownloadButton
                photoUrl={photoUrl}
                photoId={photoId}
                contractorId={contractorId}
                buyerId={buyerId}
                price={price}
                photoName={photoName}
                onDownloadComplete={onDownloadComplete}
                showPrice={false}
              />
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 다운로드 히스토리 */}
      {downloadHistory.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">최근 다운로드</h4>
          <div className="space-y-2">
            {downloadHistory.map((record, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {record.timestamp.toLocaleString()}
                </span>
                <span className="text-green-600 font-medium">
                  ₩{record.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoDownloadButton; 