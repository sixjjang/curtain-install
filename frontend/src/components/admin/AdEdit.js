import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const AdEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ad, setAd] = useState({
    brandName: "",
    imageUrl: "",
    linkUrl: "",
    startDate: "",
    endDate: "",
    type: "banner",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "ads", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setAd({
            ...data,
            startDate: data.startDate?.toDate().toISOString().slice(0, 10),
            endDate: data.endDate?.toDate().toISOString().slice(0, 10),
          });
        } else {
          alert("광고를 찾을 수 없습니다.");
          navigate("/admin/ads");
        }
      } catch (error) {
        console.error("광고 조회 오류:", error);
        alert("광고 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id, navigate]);

  const handleChange = (e) => {
    setAd({ ...ad, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!ad.brandName || !ad.imageUrl || !ad.linkUrl || !ad.startDate || !ad.endDate) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (new Date(ad.startDate) >= new Date(ad.endDate)) {
      alert("종료일은 시작일보다 늦어야 합니다.");
      return;
    }

    setSaving(true);
    try {
      const ref = doc(db, "ads", id);
      await updateDoc(ref, {
        brandName: ad.brandName,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        type: ad.type,
        startDate: new Date(ad.startDate),
        endDate: new Date(ad.endDate),
        updatedAt: new Date(),
      });
      
      alert("광고가 성공적으로 수정되었습니다!");
      navigate("/admin/ads");
    } catch (error) {
      console.error("광고 수정 오류:", error);
      alert("광고 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("수정을 취소하시겠습니까?")) {
      navigate("/admin/ads");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">광고 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">광고 수정</h2>
        <div className="text-sm text-gray-600">
          광고 ID: {id}
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
            name="brandName"
            placeholder="예: OO커튼, XX인테리어"
            value={ad.brandName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 광고 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            광고 유형 *
          </label>
          <select
            name="type"
            value={ad.type}
            onChange={handleChange}
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
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            value={ad.imageUrl}
            onChange={handleChange}
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
            name="linkUrl"
            placeholder="https://brand-homepage.com"
            value={ad.linkUrl}
            onChange={handleChange}
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
              name="startDate"
              value={ad.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일 *
            </label>
            <input
              type="date"
              name="endDate"
              value={ad.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 미리보기 */}
        {ad.imageUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              미리보기
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <img
                src={ad.imageUrl}
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

        {/* 기존 통계 정보 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">현재 통계</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">노출 수:</span>
              <span className="ml-2 font-medium">{(ad.views || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">클릭 수:</span>
              <span className="ml-2 font-medium">{(ad.clicks || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdEdit; 