import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useState } from "react";

const AdCreate = () => {
  const [brandName, setBrandName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adType, setAdType] = useState("banner");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!brandName || !imageUrl || !linkUrl || !startDate || !endDate) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert("종료일은 시작일보다 늦어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "ads"), {
        brandName,
        imageUrl,
        linkUrl,
        type: adType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        views: 0,
        clicks: 0,
        createdAt: serverTimestamp(),
      });
      
      // 폼 초기화
      setBrandName("");
      setImageUrl("");
      setLinkUrl("");
      setStartDate("");
      setEndDate("");
      setAdType("banner");
      
      alert("광고가 성공적으로 등록되었습니다!");
    } catch (error) {
      console.error("광고 등록 오류:", error);
      alert("광고 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getAdTypeText = (type) => {
    switch (type) {
      case "banner": return "배너 광고";
      case "popup": return "팝업 광고";
      case "sidebar": return "사이드바 광고";
      case "modal": return "모달 광고";
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">광고 등록</h2>
        <div className="text-sm text-gray-600">
          새로운 광고를 등록합니다
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* 브랜드명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            브랜드명 *
          </label>
          <input
            type="text"
            placeholder="예: OO커튼, XX인테리어"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 광고 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            광고 유형 *
          </label>
          <select
            value={adType}
            onChange={(e) => setAdType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="banner">배너 광고</option>
            <option value="popup">팝업 광고</option>
            <option value="sidebar">사이드바 광고</option>
            <option value="modal">모달 광고</option>
          </select>
        </div>

        {/* 이미지 URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            광고 이미지 URL *
          </label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            권장 크기: 728x90px (배너), 300x250px (팝업)
          </p>
        </div>

        {/* 링크 URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            링크 URL *
          </label>
          <input
            type="url"
            placeholder="https://brand-homepage.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 광고 기간 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일 *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일 *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 미리보기 */}
        {imageUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              미리보기
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <img
                src={imageUrl}
                alt="광고 미리보기"
                className="max-w-full h-auto rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden text-center text-gray-500 py-4">
                이미지를 불러올 수 없습니다.
              </div>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={() => {
              setBrandName("");
              setImageUrl("");
              setLinkUrl("");
              setStartDate("");
              setEndDate("");
              setAdType("banner");
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "저장 중..." : "광고 등록"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdCreate; 