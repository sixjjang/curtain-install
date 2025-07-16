import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const MediaAdmin = () => {
  const [media, setMedia] = useState([]);
  const [downloadLogs, setDownloadLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("media"); // "media" or "downloads"

  useEffect(() => {
    if (activeTab === "media") {
      fetchMedia();
    } else {
      fetchDownloadLogs();
    }
  }, [filter, activeTab]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let q = collection(db, "media");
      
      if (filter !== "all") {
        q = query(q, where("type", "==", filter));
      }
      
      q = query(q, orderBy("uploadedAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(list);
    } catch (error) {
      console.error("미디어 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloadLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "mediaDownloads"), orderBy("downloadTimestamp", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDownloadLogs(list);
    } catch (error) {
      console.error("다운로드 로그 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "photo": return "bg-blue-100 text-blue-800";
      case "video": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "photo": return "사진";
      case "video": return "영상";
      default: return type;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDownloadStatus = (media) => {
    if (media.downloadCount > 0) {
      return `다운로드 ${media.downloadCount}회`;
    }
    return "다운로드 없음";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">사진/영상 관리</h2>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("media")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "media"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          미디어 관리
        </button>
        <button
          onClick={() => setActiveTab("downloads")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "downloads"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          다운로드 로그
        </button>
      </div>
      
      {/* 통계 */}
      {activeTab === "media" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">총 미디어 수</h3>
            <p className="text-2xl font-bold text-blue-900">{media.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">사진</h3>
            <p className="text-2xl font-bold text-green-900">
              {media.filter(m => m.type === "photo").length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">영상</h3>
            <p className="text-2xl font-bold text-purple-900">
              {media.filter(m => m.type === "video").length}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">총 다운로드</h3>
            <p className="text-2xl font-bold text-orange-900">
              {media.reduce((sum, m) => sum + (m.downloadCount || 0), 0)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">총 다운로드</h3>
            <p className="text-2xl font-bold text-blue-900">{downloadLogs.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">사진 다운로드</h3>
            <p className="text-2xl font-bold text-green-900">
              {downloadLogs.filter(log => log.mediaType === "photo").length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">영상 다운로드</h3>
            <p className="text-2xl font-bold text-purple-900">
              {downloadLogs.filter(log => log.mediaType === "video").length}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">총 수익</h3>
            <p className="text-2xl font-bold text-orange-900">
              {downloadLogs.reduce((sum, log) => sum + (log.price || 0), 0).toLocaleString()}원
            </p>
          </div>
        </div>
      )}

      {/* 필터 */}
      {activeTab === "media" && (
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="photo">사진</option>
            <option value="video">영상</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {activeTab === "media" ? (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">미디어 ID</th>
                  <th className="border border-gray-300 p-3 text-left">업로더</th>
                  <th className="border border-gray-300 p-3 text-left">프로젝트</th>
                  <th className="border border-gray-300 p-3 text-left">타입</th>
                  <th className="border border-gray-300 p-3 text-left">파일명</th>
                  <th className="border border-gray-300 p-3 text-left">크기</th>
                  <th className="border border-gray-300 p-3 text-left">다운로드</th>
                  <th className="border border-gray-300 p-3 text-left">업로드일</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-mono text-sm">{item.id}</td>
                    <td className="border border-gray-300 p-3">{item.workerName || item.workerId}</td>
                    <td className="border border-gray-300 p-3">{item.projectTitle || item.projectId}</td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {getTypeText(item.type)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 font-medium">{item.fileName}</td>
                    <td className="border border-gray-300 p-3">{formatFileSize(item.fileSize || 0)}</td>
                    <td className="border border-gray-300 p-3">{getDownloadStatus(item)}</td>
                    <td className="border border-gray-300 p-3">
                      {item.uploadedAt ? new Date(item.uploadedAt.toDate()).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">다운로드 일시</th>
                  <th className="border border-gray-300 p-3 text-left">구매자</th>
                  <th className="border border-gray-300 p-3 text-left">시공기사</th>
                  <th className="border border-gray-300 p-3 text-left">미디어 타입</th>
                  <th className="border border-gray-300 p-3 text-left">미디어 ID</th>
                  <th className="border border-gray-300 p-3 text-left">결제 금액</th>
                </tr>
              </thead>
              <tbody>
                {downloadLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">
                      {log.downloadTimestamp?.toDate().toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-3 font-medium">
                      {log.downloadedByName}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {log.workerName}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.mediaType)}`}>
                        {getTypeText(log.mediaType)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 font-mono text-sm">
                      {log.mediaId}
                    </td>
                    <td className="border border-gray-300 p-3 font-semibold text-green-600">
                      {log.price?.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {((activeTab === "media" && media.length === 0) || 
            (activeTab === "downloads" && downloadLogs.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              {activeTab === "media" ? "미디어가 없습니다." : "다운로드 로그가 없습니다."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaAdmin; 