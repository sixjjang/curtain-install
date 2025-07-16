import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useEffect, useState } from "react";

const MediaDownloadsAdmin = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("downloads"); // "downloads" or "workerStats"

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "mediaDownloads"),
          orderBy("downloadTimestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDownloads(list);
      } catch (error) {
        console.error("미디어 다운로드 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMediaTypeText = (type) => {
    switch (type) {
      case "photo": return "사진";
      case "video": return "영상";
      default: return type;
    }
  };

  const getMediaTypeColor = (type) => {
    switch (type) {
      case "photo": return "bg-blue-100 text-blue-800";
      case "video": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalRevenue = () => {
    return downloads.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const calculatePhotoDownloads = () => {
    return downloads.filter(item => item.mediaType === "photo").length;
  };

  const calculateVideoDownloads = () => {
    return downloads.filter(item => item.mediaType === "video").length;
  };

  // 시공기사별 미디어 수익 계산
  const calculateWorkerMediaEarnings = (workerId) => {
    return downloads
      .filter(d => d.workerId === workerId)
      .reduce((sum, d) => sum + (d.price || 0), 0);
  };

  // 시공기사별 통계 계산
  const getWorkerStats = () => {
    const workerMap = new Map();
    
    downloads.forEach(download => {
      const workerId = download.workerId;
      const workerName = download.workerName;
      
      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          workerId,
          workerName,
          totalDownloads: 0,
          photoDownloads: 0,
          videoDownloads: 0,
          totalEarnings: 0
        });
      }
      
      const stats = workerMap.get(workerId);
      stats.totalDownloads++;
      stats.totalEarnings += download.price || 0;
      
      if (download.mediaType === "photo") {
        stats.photoDownloads++;
      } else if (download.mediaType === "video") {
        stats.videoDownloads++;
      }
    });
    
    return Array.from(workerMap.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">미디어 다운로드 관리</h2>
        <div className="text-sm text-gray-600">
          총 {downloads.length}건의 다운로드 기록
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("downloads")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "downloads"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          다운로드 내역
        </button>
        <button
          onClick={() => setActiveTab("workerStats")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "workerStats"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          시공기사별 수익 분석
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">총 다운로드</h3>
          <p className="text-2xl font-bold text-blue-900">{downloads.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">사진 다운로드</h3>
          <p className="text-2xl font-bold text-green-900">{calculatePhotoDownloads()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">영상 다운로드</h3>
          <p className="text-2xl font-bold text-purple-900">{calculateVideoDownloads()}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">총 수익</h3>
          <p className="text-2xl font-bold text-orange-900">
            {calculateTotalRevenue().toLocaleString()}원
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">다운로드 내역을 불러오는 중...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {activeTab === "downloads" ? (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">다운로드 일시</th>
                  <th className="border border-gray-300 p-3 text-left">구매자</th>
                  <th className="border border-gray-300 p-3 text-left">시공기사</th>
                  <th className="border border-gray-300 p-3 text-left">미디어 유형</th>
                  <th className="border border-gray-300 p-3 text-left">미디어 ID</th>
                  <th className="border border-gray-300 p-3 text-left">결제 금액</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">
                      {item.downloadTimestamp?.toDate().toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 font-medium">
                      {item.downloadedByName}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {item.workerName}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMediaTypeColor(item.mediaType)}`}>
                        {getMediaTypeText(item.mediaType)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 font-mono text-sm">
                      {item.mediaId}
                  </td>
                    <td className="border border-gray-300 p-3 font-semibold text-green-600">
                      {item.price?.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">순위</th>
                  <th className="border border-gray-300 p-3 text-left">시공기사</th>
                  <th className="border border-gray-300 p-3 text-left">총 다운로드</th>
                  <th className="border border-gray-300 p-3 text-left">사진 다운로드</th>
                  <th className="border border-gray-300 p-3 text-left">영상 다운로드</th>
                  <th className="border border-gray-300 p-3 text-left">총 수익</th>
                </tr>
              </thead>
              <tbody>
                {getWorkerStats().map((worker, index) => (
                  <tr key={worker.workerId} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-bold">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 p-3 font-medium">
                      {worker.workerName}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {worker.totalDownloads}건
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="text-blue-600 font-medium">{worker.photoDownloads}건</span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="text-purple-600 font-medium">{worker.videoDownloads}건</span>
                    </td>
                    <td className="border border-gray-300 p-3 font-semibold text-green-600">
                      {worker.totalEarnings.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {((activeTab === "downloads" && downloads.length === 0) || 
            (activeTab === "workerStats" && getWorkerStats().length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              {activeTab === "downloads" ? "미디어 다운로드 내역이 없습니다." : "시공기사별 수익 데이터가 없습니다."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaDownloadsAdmin; 