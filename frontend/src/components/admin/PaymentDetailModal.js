import { getPaymentStatusText, getPaymentStatusColor, getPaymentMethodText } from "../../utils/paymentUtils";

const PaymentDetailModal = ({ payment, advertiser, ads, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen || !payment) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    const d = date?.toDate?.() || date;
    return new Date(d).toLocaleString('ko-KR');
  };

  const getAdDetails = (adIds) => {
    if (!Array.isArray(adIds) || !ads) return [];
    return adIds.map(adId => {
      const ad = ads.find(a => a.id === adId);
      return ad ? { id: ad.id, name: ad.brandName, type: ad.type } : { id: adId, name: '알 수 없음', type: 'unknown' };
    });
  };

  const adDetails = getAdDetails(payment.ads);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">결제 상세 정보</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* 기본 결제 정보 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-600">결제 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제 ID
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {payment.id}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제 상태
                  </label>
                  <div className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(payment.status)}`}>
                      {getPaymentStatusText(payment.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제금액
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-semibold text-lg text-green-600">
                    {payment.amount?.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제수단
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {getPaymentMethodText(payment.paymentMethod)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제일
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {formatDate(payment.paymentDate)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    등록일
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    {formatDate(payment.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* 광고주 정보 */}
            {advertiser && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600">광고주 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      담당자명
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md font-medium">
                      {advertiser.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회사명
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      {advertiser.companyName || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처 이메일
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <a href={`mailto:${advertiser.contactEmail}`} className="text-blue-600 hover:underline">
                        {advertiser.contactEmail}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <a href={`tel:${advertiser.phone}`} className="text-blue-600 hover:underline">
                        {advertiser.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 결제 대상 광고 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-600">결제 대상 광고</h3>
              <div className="space-y-3">
                {adDetails.length > 0 ? (
                  adDetails.map((ad, index) => (
                    <div key={ad.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{ad.name}</div>
                          <div className="text-sm text-gray-600">광고 ID: {ad.id}</div>
                          <div className="text-sm text-gray-600">유형: {ad.type}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg text-gray-500 text-center">
                    결제 대상 광고 정보가 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 상태 업데이트 (대기중인 경우만) */}
            {payment.status === "pending" && onStatusUpdate && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-orange-600">상태 업데이트</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => onStatusUpdate(payment.id, "paid")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    결제완료로 변경
                  </button>
                  <button
                    onClick={() => onStatusUpdate(payment.id, "failed")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    실패로 변경
                  </button>
                </div>
              </div>
            )}

            {/* 시스템 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-600">시스템 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    광고주 ID
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {payment.advertiserId}
                  </div>
                </div>
                {payment.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최종 수정일
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm">
                      {formatDate(payment.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailModal; 