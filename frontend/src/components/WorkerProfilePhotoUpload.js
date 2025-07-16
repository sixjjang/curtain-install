import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { storage, db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const WorkerProfilePhotoUpload = () => {
  const { user, userData } = useAuth();
  const [file, setFile] = useState(null);
  const [photoURL, setPhotoURL] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadPhoto = async () => {
      if (!user) return;
      const docRef = doc(db, "workers", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPhotoURL(docSnap.data().photoURL || "");
      }
    };
    loadPhoto();
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      alert("사진을 선택해주세요.");
      return;
    }
    const storageRef = ref(storage, `workerPhotos/${user.uid}/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const docRef = doc(db, "workers", user.uid);
      await updateDoc(docRef, { photoURL: downloadURL });

      setPhotoURL(downloadURL);
      setMessage("사진이 성공적으로 업로드되었습니다!");
    } catch (error) {
      console.error(error);
      setMessage("업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-3 max-w-sm mx-auto mt-6">
      <h3 className="text-lg font-semibold">프로필 사진 업로드</h3>

      {photoURL && (
        <img
          src={photoURL}
          alt="프로필 사진"
          className="w-32 h-32 rounded-full object-cover mx-auto"
        />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border p-2 w-full"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 w-full"
      >
        업로드
      </button>

      {message && <p className="text-green-600">{message}</p>}
    </div>
  );
};

export default WorkerProfilePhotoUpload; 