import { db } from "../firebase/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";

/**
 * Worker Evaluation Interface
 * @typedef {Object} WorkerEvaluation
 * @property {string} workerId - Worker's unique ID
 * @property {string} evaluatorId - Evaluator's unique ID (seller/customer)
 * @property {string} evaluatorType - Type of evaluator ('seller', 'customer', 'admin')
 * @property {number} rating - Rating score (1-5)
 * @property {string} comment - Evaluation comment
 * @property {string} workOrderId - Related work order ID
 * @property {string} category - Evaluation category ('quality', 'punctuality', 'communication', 'overall')
 * @property {Object} createdAt - Timestamp when evaluation was created
 * @property {Object} updatedAt - Timestamp when evaluation was last updated
 */

/**
 * Submit a new worker evaluation and update worker's average rating
 * @param {WorkerEvaluation} evaluation - The evaluation data
 * @returns {Promise<Object>} - Result object with success status and evaluation ID
 */
export async function submitEvaluation(evaluation) {
  try {
    // Validate evaluation data
    if (!evaluation.workerId || !evaluation.evaluatorId || !evaluation.rating) {
      throw new Error('필수 평가 정보가 누락되었습니다.');
    }

    if (evaluation.rating < 1 || evaluation.rating > 5) {
      throw new Error('평점은 1-5 사이의 값이어야 합니다.');
    }

    // Add timestamps
    const evaluationData = {
      ...evaluation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add evaluation to Firestore
    const evalRef = await addDoc(collection(db, "workerEvaluations"), evaluationData);

    // Recalculate average rating
    await recalculateWorkerRating(evaluation.workerId);

    return {
      success: true,
      evaluationId: evalRef.id,
      message: '평가가 성공적으로 등록되었습니다.'
    };

  } catch (error) {
    console.error('평가 등록 실패:', error);
    throw new Error(`평가 등록에 실패했습니다: ${error.message}`);
  }
}

/**
 * Recalculate worker's average rating and update profile
 * @param {string} workerId - Worker's unique ID
 * @returns {Promise<void>}
 */
export async function recalculateWorkerRating(workerId) {
  try {
    // Get all evaluations for the worker
    const evalsQuery = query(
      collection(db, "workerEvaluations"),
      where("workerId", "==", workerId)
    );

    const evalsSnapshot = await getDocs(evalsQuery);
    
    if (evalsSnapshot.empty) {
      // No evaluations, set default values
      await updateDoc(doc(db, "workers", workerId), {
        averageRating: 0,
        totalEvaluations: 0,
        lastEvaluationUpdate: Timestamp.now()
      });
      return;
    }

    let totalRating = 0;
    let categoryRatings = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };
    let categoryCounts = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };

    evalsSnapshot.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
      
      // Calculate category-specific ratings
      if (data.category && categoryRatings.hasOwnProperty(data.category)) {
        categoryRatings[data.category] += data.rating;
        categoryCounts[data.category]++;
      }
    });

    const avgRating = totalRating / evalsSnapshot.size;
    
    // Calculate category averages
    const categoryAverages = {};
    Object.keys(categoryRatings).forEach(category => {
      categoryAverages[`${category}Rating`] = categoryCounts[category] > 0 
        ? categoryRatings[category] / categoryCounts[category] 
        : 0;
    });

    // Update worker profile
    await updateDoc(doc(db, "workers", workerId), {
      averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      totalEvaluations: evalsSnapshot.size,
      lastEvaluationUpdate: Timestamp.now(),
      ...categoryAverages
    });

  } catch (error) {
    console.error('평균 평점 재계산 실패:', error);
    throw new Error(`평균 평점 업데이트에 실패했습니다: ${error.message}`);
  }
}

/**
 * Get worker evaluations with pagination
 * @param {string} workerId - Worker's unique ID
 * @param {number} limit - Number of evaluations to fetch
 * @param {string} lastDocId - Last document ID for pagination
 * @returns {Promise<Array>} - Array of evaluations
 */
export async function getWorkerEvaluations(workerId, limit = 10, lastDocId = null) {
  try {
    let q = query(
      collection(db, "workerEvaluations"),
      where("workerId", "==", workerId),
      orderBy("createdAt", "desc"),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    const evaluations = [];

    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return evaluations;

  } catch (error) {
    console.error('평가 조회 실패:', error);
    throw new Error(`평가 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * Get evaluation statistics for a worker
 * @param {string} workerId - Worker's unique ID
 * @returns {Promise<Object>} - Evaluation statistics
 */
export async function getWorkerEvaluationStats(workerId) {
  try {
    const evalsQuery = query(
      collection(db, "workerEvaluations"),
      where("workerId", "==", workerId)
    );

    const evalsSnapshot = await getDocs(evalsQuery);
    
    if (evalsSnapshot.empty) {
      return {
        totalEvaluations: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {
          quality: 0,
          punctuality: 0,
          communication: 0,
          overall: 0
        }
      };
    }

    let totalRating = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let categoryRatings = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };
    let categoryCounts = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };

    evalsSnapshot.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
      ratingDistribution[data.rating]++;
      
      if (data.category && categoryRatings.hasOwnProperty(data.category)) {
        categoryRatings[data.category] += data.rating;
        categoryCounts[data.category]++;
      }
    });

    const averageRating = totalRating / evalsSnapshot.size;
    
    // Calculate category averages
    const categoryAverages = {};
    Object.keys(categoryRatings).forEach(category => {
      categoryAverages[category] = categoryCounts[category] > 0 
        ? Math.round((categoryRatings[category] / categoryCounts[category]) * 10) / 10
        : 0;
    });

    return {
      totalEvaluations: evalsSnapshot.size,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      categoryAverages
    };

  } catch (error) {
    console.error('평가 통계 조회 실패:', error);
    throw new Error(`평가 통계 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * Update an existing evaluation
 * @param {string} evaluationId - Evaluation document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Result object
 */
export async function updateEvaluation(evaluationId, updates) {
  try {
    const evalRef = doc(db, "workerEvaluations", evaluationId);
    
    // Get current evaluation to find workerId
    const evalDoc = await getDocs(query(
      collection(db, "workerEvaluations"),
      where("__name__", "==", evaluationId)
    ));
    
    if (evalDoc.empty) {
      throw new Error('평가를 찾을 수 없습니다.');
    }

    const currentEval = evalDoc.docs[0].data();
    
    // Update evaluation
    await updateDoc(evalRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    // Recalculate worker rating
    await recalculateWorkerRating(currentEval.workerId);

    return {
      success: true,
      message: '평가가 성공적으로 수정되었습니다.'
    };

  } catch (error) {
    console.error('평가 수정 실패:', error);
    throw new Error(`평가 수정에 실패했습니다: ${error.message}`);
  }
}

/**
 * Delete an evaluation
 * @param {string} evaluationId - Evaluation document ID
 * @returns {Promise<Object>} - Result object
 */
export async function deleteEvaluation(evaluationId) {
  try {
    const evalRef = doc(db, "workerEvaluations", evaluationId);
    
    // Get current evaluation to find workerId
    const evalDoc = await getDocs(query(
      collection(db, "workerEvaluations"),
      where("__name__", "==", evaluationId)
    ));
    
    if (evalDoc.empty) {
      throw new Error('평가를 찾을 수 없습니다.');
    }

    const currentEval = evalDoc.docs[0].data();
    
    // Delete evaluation
    await updateDoc(evalRef, {
      deleted: true,
      deletedAt: Timestamp.now()
    });

    // Recalculate worker rating
    await recalculateWorkerRating(currentEval.workerId);

    return {
      success: true,
      message: '평가가 성공적으로 삭제되었습니다.'
    };

  } catch (error) {
    console.error('평가 삭제 실패:', error);
    throw new Error(`평가 삭제에 실패했습니다: ${error.message}`);
  }
}

/**
 * Check if user has already evaluated a worker for a specific work order
 * @param {string} workerId - Worker's unique ID
 * @param {string} evaluatorId - Evaluator's unique ID
 * @param {string} workOrderId - Work order ID
 * @returns {Promise<boolean>} - Whether evaluation exists
 */
export async function hasEvaluatedWorker(workerId, evaluatorId, workOrderId) {
  try {
    const q = query(
      collection(db, "workerEvaluations"),
      where("workerId", "==", workerId),
      where("evaluatorId", "==", evaluatorId),
      where("workOrderId", "==", workOrderId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;

  } catch (error) {
    console.error('평가 확인 실패:', error);
    return false;
  }
}

/**
 * Get recent evaluations for dashboard
 * @param {number} limit - Number of evaluations to fetch
 * @returns {Promise<Array>} - Array of recent evaluations
 */
export async function getRecentEvaluations(limit = 5) {
  try {
    const q = query(
      collection(db, "workerEvaluations"),
      orderBy("createdAt", "desc"),
      limit(limit)
    );

    const snapshot = await getDocs(q);
    const evaluations = [];

    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return evaluations;

  } catch (error) {
    console.error('최근 평가 조회 실패:', error);
    throw new Error(`최근 평가 조회에 실패했습니다: ${error.message}`);
  }
} 