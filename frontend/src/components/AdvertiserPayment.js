import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { validatePaymentData } from "../utils/paymentUtils";

const AdvertiserPayment = ({ advertiserId }) => {
  const [ads, setAds] = useState([]);
  const [selectedAds, setSelectedAds] = useState([]);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("카드");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [advertiser, setAdvertiser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch advertiser info
        const advertiserSnapshot = await getDocs(query(
          collection(db, "advertisers"), 
          where("__name__", "==", advertiserId)
        ));
        if (!advertiserSnapshot.empty) {
          setAdvertiser({ id: advertiserSnapshot.docs[0].id, ...advertiserSnapshot.docs[0].data() });
        }

        // Fetch active ads for this advertiser
        const adsSnapshot = await getDocs(query(
          collection(db, "ads"), 
          where("advertiserId", "==", advertiserId)
        ));
        const activeAds = adsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(ad => {
            const today = new Date();
            const startDate = ad.startDate?.toDate?.() || ad.startDate;
            const endDate = ad.endDate?.toDate?.() || ad.endDate;
            return startDate <= today && endDate >= today;
          });
        setAds(activeAds);
      } catch (error) {
        console.error("데이터 조회 오류:", error);
        setMessage("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    if (advertiserId) {
      fetchData();
    }
  }, [advertiserId]);

  useEffect(() => {
    // 선택한 광고의 총액 계산
    const total = selectedAds.length * 10000; // 기본 단가 10,000원
    setAmount(total);
  }, [selectedAds]);

  const toggleSelectAd = (adId) => {
    setSelectedAds(prev => 
      prev.includes(adId) ? prev.filter(id => id !== adId) : [...prev, adId]
    );
  };

  const calculateAdPrice = (ad) => {
    // 광고 유형별 가격 계산
    const basePrice = 10000;
    const typeMultiplier = {
      'banner': 1,
      'popup': 1.5,
      'sidebar': 1.2,
      'modal': 2
    };
    
    const multiplier = typeMultiplier[ad.type] || 1;
    const days = ad.startDate && ad.endDate ? 
      Math.ceil((ad.endDate.toDate?.() - ad.startDate.toDate?.()) / (1000 * 60 * 60 * 24)) : 30;
    
    return Math.round(basePrice * multiplier * (days / 30));
  };

  const handlePayment = async () => {
    if (selectedAds.length === 0) {
      setMessage("결제할 광고를 선택해주세요.");
      return;
    }

    const paymentData = {
      advertiserId,
      ads: selectedAds,
      amount,
      paymentMethod,
      paymentDate: new Date(),
      status: "pending"
    };

    // 유효성 검사
    const validation = validatePaymentData(paymentData);
    if (!validation.isValid) {
      setMessage(validation.errors.join('\n'));
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      // 결제 처리 모의: 실제 결제 시스템 연동 시 여기서 처리
      await addDoc(collection(db, "advertiserPayments"), {
        ...paymentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage("결제가 성공적으로 완료되었습니다!");
      setSelectedAds([]);
      setAmount(0);
      
      // 성공 메시지 3초 후 제거
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("결제 처리 오류:", error);
      setMessage("결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodText = (method) => {
    const methodMap = {
      '카드': '신용카드',
      '계좌이체': '계좌이체',
      '현금': '현금',
      '기타': '기타'
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">광고 결제</h2>
        {advertiser && (
          <p className="text-gray-600">
            {advertiser.companyName || advertiser.name}님의 광고 결제
          </p>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('완료') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* 광고 선택 섹션 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">결제할 광고 선택</h3>
        
        {ads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📢</div>
            <p>등록된 활성 광고가 없습니다.</p>
            <p className="text-sm">새로운 광고를 등록하거나 기존 광고의 기간을 확인해주세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map(ad => (
              <div key={ad.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAds.includes(ad.id)}
                    onChange={() => toggleSelectAd(ad.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{ad.brandName}</h4>
                        <p className="text-sm text-gray-600">광고 ID: {ad.id}</p>
                        <p className="text-sm text-gray-600">
                          기간: {ad.startDate?.toDate?.().toLocaleDateString()} ~ {ad.endDate?.toDate?.().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {ad.type}
                        </span>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          {calculateAdPrice(ad).toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결제 정보 섹션 */}
      {selectedAds.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">결제 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                결제 방법
              </label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="카드">신용카드</option>
                <option value="계좌이체">계좌이체</option>
                <option value="현금">현금</option>
                <option value="기타">기타</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택된 광고 수
              </label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-md">
                {selectedAds.length}개
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">총 결제금액</span>
              <span className="text-2xl font-bold text-green-600">
                {amount.toLocaleString()}원
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              결제 방법: {getPaymentMethodText(paymentMethod)}
            </p>
          </div>
        </div>
      )}

      {/* 결제 버튼 */}
      <div className="flex gap-3">
        <button 
          onClick={handlePayment} 
          disabled={selectedAds.length === 0 || processing}
          className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors ${
            selectedAds.length === 0 || processing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              결제 처리 중...
            </div>
          ) : (
            '결제하기'
          )}
        </button>
        
        {selectedAds.length > 0 && (
          <button 
            onClick={() => {
              setSelectedAds([]);
              setAmount(0);
              setMessage("");
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            선택 취소
          </button>
        )}
      </div>

      {/* 안내사항 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 안내사항</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 결제 완료 후 광고가 즉시 활성화됩니다.</li>
          <li>• 결제 취소는 결제일로부터 7일 이내에만 가능합니다.</li>
          <li>• 문의사항이 있으시면 관리자에게 연락해주세요.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdvertiserPayment; 