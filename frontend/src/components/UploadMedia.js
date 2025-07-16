import { useState, useEffect } from "react";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const UploadMedia = ({ projectId }) => {
  const [photoPrice, setPhotoPrice] = useState(1000);
  const [videoPrice, setVideoPrice] = useState(3000);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPrices = async () => {
      if (!projectId) return;
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const data = projectSnap.data();
        if (data.photoPrice) setPhotoPrice(data.photoPrice);
        if (data.videoPrice) setVideoPrice(data.videoPrice);
      }
    };
    fetchPrices();
  }, [projectId]);

  const handleFileChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
  };

  const uploadMedia = async () => {
    if (mediaFiles.length === 0) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }

    for (const file of mediaFiles) {
      const type = file.type.startsWith("video") ? "video" : "photo";
      const price = type === "video" ? videoPrice : photoPrice;

      // 파일 업로드 로직 (생략) → 업로드 후 URL 받아야 함
      // const url = await uploadFileToStorage(file);

      // 여기서는 임시 URL 생성 예시
      const url = URL.createObjectURL(file);

      await addDoc(collection(db, "media"), {
        projectId,
        type,
        price,
        url,
        uploadedAt: new Date(),
        downloaded: false,
      });
    }
    setMessage("업로드 완료!");
    setMediaFiles([]);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">미디어 업로드</h3>

      <label>
        사진 단가 (원):
        <input
          type="number"
          value={photoPrice}
          onChange={(e) => setPhotoPrice(Number(e.target.value))}
          className="border p-2 w-full mt-1"
        />
      </label>

      <label>
        영상 단가 (원):
        <input
          type="number"
          value={videoPrice}
          onChange={(e) => setVideoPrice(Number(e.target.value))}
          className="border p-2 w-full mt-1"
        />
      </label>

      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="border p-2 w-full mt-2"
      />

      <button
        className="bg-green-600 text-white px-4 py-2"
        onClick={uploadMedia}
      >
        업로드
      </button>

      {message && <p className="text-green-600">{message}</p>}
    </div>
  );
};

export default UploadMedia; 