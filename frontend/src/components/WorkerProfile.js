import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getWorkerAverageRating } from "../utils/getWorkerAverageRating";

const WorkerProfile = ({ workerId }) => {
  const [worker, setWorker] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!workerId) return;

      // Load worker profile
      const docRef = doc(db, "workers", workerId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorker(docSnap.data());
      }

      // Load average rating
      const avg = await getWorkerAverageRating(workerId);
      setAvgRating(avg);

      // Load reviews
      const q = query(
        collection(db, "workerReviews"),
        where("workerId", "==", workerId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => doc.data());
      setReviews(list);
    };

    loadData();
  }, [workerId]);

  if (!worker) return <p>로딩 중...</p>;

  return (
    <div className="border p-4 rounded space-y-3">
      <h2 className="text-xl font-bold">시공기사 프로필</h2>

      {/* 사진 자리 */}
      <div className="w-32 h-32 bg-gray-200 rounded-full"></div>

      <p>
        <strong>이름:</strong> {worker.name}
      </p>
      <p>
        <strong>연락처:</strong> {worker.phone || "070-xxxx-xxxx"}
      </p>

      <p>
        <strong>평균 별점:</strong>{" "}
        {avgRating ? `${avgRating} / 5` : "평가 없음"}
      </p>

      <div>
        <h3 className="text-lg mt-4 mb-2 font-semibold">
          받은 리뷰
        </h3>
        {reviews.length === 0 ? (
          <p>아직 리뷰가 없습니다.</p>
        ) : (
          reviews.map((r, idx) => (
            <div key={idx} className="border-t pt-2 mt-2">
              <p>
                <strong>별점:</strong> {r.rating} / 5
              </p>
              <p>{r.review}</p>
              <p className="text-gray-500 text-sm">
                작성일:{" "}
                {r.createdAt?.toDate
                  ? r.createdAt.toDate().toLocaleDateString()
                  : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkerProfile; 