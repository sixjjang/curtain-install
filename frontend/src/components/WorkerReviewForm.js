import { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";

const WorkerReviewForm = ({ projectId, workerId }) => {
  const { user, userData } = useAuth();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [isReviewed, setIsReviewed] = useState(false);

  useEffect(() => {
    const checkReview = async () => {
      if (!user || userData?.role !== "seller") return;
      const q = query(
        collection(db, "workerReviews"),
        where("projectId", "==", projectId),
        where("sellerId", "==", user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setIsReviewed(true);
    };

    checkReview();
  }, [user, userData, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isReviewed) {
      setMessage("이미 평가하셨습니다.");
      return;
    }

    try {
      await addDoc(collection(db, "workerReviews"), {
        workerId,
        sellerId: user.uid,
        projectId,
        rating,
        review,
        createdAt: new Date(),
      });

      setMessage("평가가 등록되었습니다!");
      setIsReviewed(true);
    } catch (err) {
      console.error(err);
      setMessage("오류: " + err.message);
    }
  };

  if (isReviewed) {
    return <p className="text-green-600">이미 평가 완료된 건입니다.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-semibold">시공기사 평가</h3>

      <label className="block">
        별점:
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border p-2 w-full mt-1"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} 점
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        리뷰:
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="border p-2 w-full mt-1"
          rows={3}
        />
      </label>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2"
      >
        평가 등록
      </button>

      {message && <p className="text-red-600 mt-2">{message}</p>}
    </form>
  );
};

export default WorkerReviewForm; 