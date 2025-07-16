import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { logMediaDownload } from "../utils/mediaLogs";

const MediaDownload = ({ mediaId, userId, currentSeller }) => {
  const [mediaData, setMediaData] = useState(null);
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMedia = async () => {
      const docRef = doc(db, "media", mediaId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMediaData(docSnap.data());
      }
    };

    const checkPayment = async () => {
      const q = query(
        collection(db, "mediaPayments"),
        where("mediaId", "==", mediaId),
        where("buyerId", "==", userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setPaid(true);
      }
    };

    fetchMedia();
    checkPayment();
  }, [mediaId, userId]);

  const handlePayment = async () => {
    if (!mediaData) return;

    // 간단히 결제 금액 설정 (수수료 10% 포함)
    const feePercent = 0.1;
    const amount = Math.round(mediaData.price * (1 + feePercent));

    // 실제 결제 로직(결제 API 연동)은 별도 구현 필요

    try {
      // 결제 성공 가정 후 결제 내역 저장
      await addDoc(collection(db, "mediaPayments"), {
        mediaId,
        buyerId: userId,
        amount,
        paidAt: new Date(),
      });

      // 미디어 다운로드 로그 기록
      await logMediaDownload({
        mediaId: mediaId,
        mediaType: mediaData.type,
        downloadedBy: currentSeller.uid,
        downloadedByName: currentSeller.displayName,
        workerId: mediaData.workerId,
        workerName: mediaData.workerName,
        price: amount
      });

      setPaid(true);
      setMessage(`결제 완료! ${amount}원 결제되었습니다.`);
    } catch (error) {
      console.error(error);
      setMessage("결제 처리 중 오류가 발생했습니다.");
    }
  };

  if (!mediaData) return <p>미디어 정보를 불러오는 중입니다...</p>;

  return (
    <div className="max-w-md mx-auto p-4 border rounded space-y-4">
      <h3 className="text-xl font-semibold">미디어 다운로드</h3>

      <p>파일 종류: {mediaData.type}</p>
      <p>가격: {mediaData.price}원</p>

      {paid ? (
        <>
          <p className="text-green-600">결제 완료! 아래에서 다운로드하세요.</p>
          <a
            href={mediaData.url}
            download
            className="block bg-blue-600 text-white px-4 py-2 rounded text-center"
          >
            다운로드
          </a>
        </>
      ) : (
        <>
          <button
            onClick={handlePayment}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            결제 후 다운로드
          </button>
          {message && <p className="text-red-600">{message}</p>}
        </>
      )}
    </div>
  );
};

export default MediaDownload; 