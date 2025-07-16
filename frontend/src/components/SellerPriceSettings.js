import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const SellerPriceSettings = () => {
  const { user, userData } = useAuth();
  const [photoPrice, setPhotoPrice] = useState(1000);
  const [videoPrice, setVideoPrice] = useState(3000);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user || userData?.role !== "seller") return;

      const docRef = doc(db, "sellers", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPhotoPrice(data.photoPrice || 1000);
        setVideoPrice(data.videoPrice || 3000);
      }
    };

    load();
  }, [user, userData]);

  const save = async () => {
    if (!user) return;
    const docRef = doc(db, "sellers", user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      photoPrice,
      videoPrice,
    });
    setMessage("저장되었습니다!");
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">사진/영상 단가 설정</h3>

      <label className="block">
        사진 단가 (원):
        <input
          type="number"
          value={photoPrice}
          onChange={(e) => setPhotoPrice(Number(e.target.value))}
          className="border p-2 w-full mt-1"
        />
      </label>

      <label className="block">
        영상 단가 (원):
        <input
          type="number"
          value={videoPrice}
          onChange={(e) => setVideoPrice(Number(e.target.value))}
          className="border p-2 w-full mt-1"
        />
      </label>

      <button
        className="bg-blue-600 text-white px-4 py-2"
        onClick={save}
      >
        저장
      </button>

      {message && <p className="text-green-600 mt-2">{message}</p>}
    </div>
  );
};

export default SellerPriceSettings; 