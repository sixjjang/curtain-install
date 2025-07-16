import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getWorkerAverageRating = async (workerId) => {
  try {
    const q = query(
      collection(db, "workerReviews"),
      where("workerId", "==", workerId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const reviews = querySnapshot.docs.map(doc => doc.data());
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // 소수점 첫째 자리까지 반올림
    return Math.round(averageRating * 10) / 10;
  } catch (error) {
    console.error("Error calculating average rating:", error);
    return null;
  }
}; 