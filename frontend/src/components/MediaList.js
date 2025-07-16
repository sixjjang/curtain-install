import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const MediaList = ({ projectId }) => {
  const { user, userData } = useAuth();
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const loadMedia = async () => {
      if (!user || userData?.role !== "seller") return;

      const q = query(
        collection(db, "photos"),
        where("projectId", "==", projectId)
      );

      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMediaList(list);
      setLoading(false);
    };

    loadMedia();
  }, [user, userData, projectId]);

  const toggleSelect = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleDownload = async (item) => {
    try {
      // (추후 결제 로직 삽입 필요)
      const docRef = doc(db, "photos", item.id);
      await updateDoc(docRef, {
        downloaded: true,
      });
      setMessage(`다운로드 완료: ${item.url}`);
      window.open(item.url, "_blank");
    } catch (err) {
      console.error(err);
      setMessage("다운로드 오류: " + err.message);
    }
  };

  const handlePayAndDownload = async () => {
    const selectedMedia = mediaList.filter((item) =>
      selectedItems.includes(item.id)
    );

    const totalPrice = selectedMedia.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    if (selectedMedia.length === 0) {
      alert("선택된 항목이 없습니다.");
      return;
    }

    // MVP: 가상 결제 처리
    const isPaid = window.confirm(
      `총 결제금액: ${totalPrice.toLocaleString()}원\n결제하시겠습니까?`
    );

    if (!isPaid) return;

    for (const item of selectedMedia) {
      const docRef = doc(db, "photos", item.id);
      await updateDoc(docRef, {
        downloaded: true,
      });
      window.open(item.url, "_blank");
    }

    setSelectedItems([]);
    setMessage("다운로드 및 결제 완료!");
  };

  if (loading) return <p>로딩 중...</p>;

  if (mediaList.length === 0) {
    return <p>업로드된 미디어가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">업로드된 사진/영상 목록</h2>

      {selectedItems.length > 0 && (
        <button
          className="bg-green-700 text-white px-4 py-2 mt-4"
          onClick={handlePayAndDownload}
        >
          선택 항목 결제 및 다운로드
        </button>
      )}

      {mediaList.map((item) => (
        <div key={item.id} className="border p-4 rounded">
          <label className="flex items-center space-x-2">
            {!item.downloaded && (
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleSelect(item.id)}
              />
            )}
            <span>{item.type === "photo" ? "사진" : "영상"}</span>
          </label>

          {item.type === "photo" ? (
            <img src={item.url} alt="preview" className="w-48 h-auto rounded mb-2" />
          ) : (
            <video src={item.url} controls className="w-64 mb-2" />
          )}

          <p>레벨: {item.level}</p>
          <p>단가: {item.price?.toLocaleString()}원</p>
          <p>
            다운로드 여부:{" "}
            <span className={item.downloaded ? "text-green-600" : "text-red-600"}>
              {item.downloaded ? "다운로드 완료" : "미다운로드"}
            </span>
          </p>

          {item.downloaded && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              다시보기
            </a>
          )}
        </div>
      ))}

      {message && <p className="text-red-600 mt-2">{message}</p>}
    </div>
  );
};

export default MediaList; 