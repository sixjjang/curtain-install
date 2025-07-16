import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdvertiserPayment from "../components/AdvertiserPayment";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const AdvertiserPaymentPage = () => {
  const { advertiserId } = useParams();
  const navigate = useNavigate();
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdvertiser = async () => {
      if (!advertiserId) {
        setError("광고주 ID가 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        const advertiserDoc = await getDoc(doc(db, "advertisers", advertiserId));
        if (!advertiserDoc.exists()) {
          setError("존재하지 않는 광고주입니다.");
          setLoading(false);
          return;
        }

        setAdvertiser({ id: advertiserDoc.id, ...advertiserDoc.data() });
      } catch (error) {
        console.error("광고주 정보 조회 오류:", error);
        setError("광고주 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertiser();
  }, [advertiserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">광고주 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">광고 결제</h1>
              {advertiser && (
                <p className="text-gray-600">
                  {advertiser.companyName || advertiser.name}님의 광고 결제 페이지
                </p>
              )}
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 홈으로
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* 광고주 정보 카드 */}
          {advertiser && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">광고주 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명
                  </label>
                  <div className="font-medium">{advertiser.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명
                  </label>
                  <div>{advertiser.companyName || "-"}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처
                  </label>
                  <div className="space-y-1">
                    <div className="text-sm">{advertiser.contactEmail}</div>
                    <div className="text-sm">{advertiser.phone}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      advertiser.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {advertiser.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 결제 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <div className="text-blue-600 text-xl mr-3">💳</div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">결제 안내</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 결제할 광고를 선택하고 결제 방법을 선택해주세요.</li>
                  <li>• 결제 완료 후 광고가 즉시 활성화됩니다.</li>
                  <li>• 결제 내역은 관리자 페이지에서 확인할 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 컴포넌트 */}
        <AdvertiserPayment advertiserId={advertiserId} />
      </div>
    </div>
  );
};

export default AdvertiserPaymentPage; 