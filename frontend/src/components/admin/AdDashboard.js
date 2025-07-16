import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdDashboard = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAds = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "ads"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAds(data);
    } catch (error) {
      console.error("광고 데이터 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const calculateTotalViews = () => {
    return ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
  };

  const calculateTotalClicks = () => {
    return ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  };

  const calculateCTR = (views, clicks) => {
    if (views === 0) return 0;
    return ((clicks / views) * 100).toFixed(2);
  };

  const getAdTypeText = (type) => {
    switch (type) {
      case "banner": return "배너";
      case "popup": return "팝업";
      case "sidebar": return "사이드바";
      case "modal": return "모달";
      default: return type;
    }
  };

  const getAdTypeColor = (type) => {
    switch (type) {
      case "banner": return "bg-blue-100 text-blue-800";
      case "popup": return "bg-purple-100 text-purple-800";
      case "sidebar": return "bg-green-100 text-green-800";
      case "modal": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (ad) => {
    const today = new Date();
    const startDate = ad.startDate?.toDate();
    const endDate = ad.endDate?.toDate();
    
    if (!startDate || !endDate) return "날짜 미설정";
    if (today < startDate) return "대기중";
    if (today > endDate) return "종료됨";
    return "진행중";
  };

  const getStatusColor = (ad) => {
    const status = getStatusText(ad);
    switch (status) {
      case "진행중": return "bg-green-100 text-green-800";
      case "대기중": return "bg-yellow-100 text-yellow-800";
      case "종료됨": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제할까요?")) {
      try {
        await deleteDoc(doc(db, "ads", id));
        fetchAds(); // 목록 새로고침
      } catch (error) {
        console.error("광고 삭제 오류:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/ads/edit/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">광고 통계 대시보드</h2>
        <div className="text-sm text-gray-600">
          총 {ads.length}개의 광고
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">총 광고 수</h3>
          <p className="text-2xl font-bold text-blue-900">{ads.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">총 노출 수</h3>
          <p className="text-2xl font-bold text-green-900">
            {calculateTotalViews().toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">총 클릭 수</h3>
          <p className="text-2xl font-bold text-purple-900">
            {calculateTotalClicks().toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">평균 CTR</h3>
          <p className="text-2xl font-bold text-orange-900">
            {calculateTotalViews() > 0 
              ? calculateCTR(calculateTotalViews(), calculateTotalClicks()) 
              : 0}%
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">광고 데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left">브랜드</th>
                <th className="border border-gray-300 p-3 text-left">광고 유형</th>
                <th className="border border-gray-300 p-3 text-left">상태</th>
                <th className="border border-gray-300 p-3 text-left">노출 수</th>
                <th className="border border-gray-300 p-3 text-left">클릭 수</th>
                <th className="border border-gray-300 p-3 text-left">CTR</th>
                <th className="border border-gray-300 p-3 text-left">링크</th>
                <th className="border border-gray-300 p-3 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 font-medium">
                    {ad.brandName}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdTypeColor(ad.type)}`}>
                      {getAdTypeText(ad.type)}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad)}`}>
                      {getStatusText(ad)}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    {(ad.views || 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {(ad.clicks || 0).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <span className={`font-medium ${
                      calculateCTR(ad.views || 0, ad.clicks || 0) > 2 
                        ? 'text-green-600' 
                        : calculateCTR(ad.views || 0, ad.clicks || 0) > 1 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {calculateCTR(ad.views || 0, ad.clicks || 0)}%
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline transition-colors"
                    >
                      방문
                    </a>
                  </td>
                  <td className="border border-gray-300 p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ad.id)}
                        className="px-3 py-1 text-white bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {ads.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              등록된 광고가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdDashboard; 