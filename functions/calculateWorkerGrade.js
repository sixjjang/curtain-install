const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.calculateWorkerGrade = async (workerId) => {
  try {
    // 1. 리뷰별점 평균
    const reviewsSnapshot = await db
      .collection("workerReviews")
      .where("workerId", "==", workerId)
      .get();

    let totalRating = 0;
    let reviewCount = reviewsSnapshot.size;

    reviewsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
    });

    const avgRating = reviewCount ? totalRating / reviewCount : 0;

    // 2. 시공 완료 건수
    const jobsSnapshot = await db
      .collection("workerJobs")
      .where("workerId", "==", workerId)
      .where("status", "==", "completed")
      .get();

    const completedCount = jobsSnapshot.size;

    // 3. 지각 / 클레임 건수 집계 (예시)
    const lateCount = await db
      .collection("workerJobs")
      .where("workerId", "==", workerId)
      .where("late", "==", true)
      .get()
      .then((snap) => snap.size);

    const claimCount = await db
      .collection("workerJobs")
      .where("workerId", "==", workerId)
      .where("claim", "==", true)
      .get()
      .then((snap) => snap.size);

    // 4. 등급 산출 예시: 단순 점수 계산
    // 평균 별점 * 2 + 완료 건수 * 0.1 - 지각 0.5점 - 클레임 1점
    let score = avgRating * 2 + completedCount * 0.1 - lateCount * 0.5 - claimCount * 1;

    // 5. 등급 분류
    let grade = "D"; // 기본 등급

    if (score >= 8) grade = "A";
    else if (score >= 6) grade = "B";
    else if (score >= 4) grade = "C";

    // 6. Firestore 업데이트
    const workerRef = db.collection("workers").doc(workerId);
    await workerRef.update({ grade, score, avgRating, completedCount, lateCount, claimCount });

    return { grade, score };
  } catch (error) {
    console.error("Error calculating worker grade:", error);
    throw error;
  }
}; 