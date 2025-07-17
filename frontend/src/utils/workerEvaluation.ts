import { Firestore } from "firebase/firestore";
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
 */
export interface WorkerEvaluation {
  id?: string;
  workerId: string;
  evaluatorId: string;
  evaluatorType: 'seller' | 'customer' | 'admin';
  rating: number;
  comment: string;
  workOrderId?: string;
  category: 'quality' | 'punctuality' | 'communication' | 'overall';
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Evaluation Statistics Interface
 */
export interface EvaluationStats {
  totalEvaluations: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  categoryAverages: {
    quality: number;
    punctuality: number;
    communication: number;
    overall: number;
  };
}

/**
 * Result Interface for operations
 */
export interface EvaluationResult {
  success: boolean;
  evaluationId?: string;
  message: string;
}

/**
 * Submit a new worker evaluation and update worker's average rating
 */
export async function submitEvaluation(evaluation: WorkerEvaluation): Promise<EvaluationResult> {
  try {
    // Check if Firebase is initialized
    if (!db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }

    // Validate evaluation data
    if (!evaluation.workerId || !evaluation.evaluatorId || !evaluation.rating) {
      throw new Error('필수 평가 정보가 누락되었습니다.');
    }

    if (evaluation.rating < 1 || evaluation.rating > 5) {
      throw new Error('평점은 1-5 사이의 값이어야 합니다.');
    }

    // Add timestamps
    const evaluationData: WorkerEvaluation = {
      ...evaluation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add evaluation to Firestore
    const evalRef = await addDoc(collection(db as Firestore, "workerEvaluations"), evaluationData);

    // Recalculate average rating
    await recalculateWorkerRating(evaluation.workerId);

    return {
      success: true,
      evaluationId: evalRef.id,
      message: '평가가 성공적으로 등록되었습니다.'
    };

  } catch (error) {
    console.error('평가 등록 실패:', error);
    throw new Error(`평가 등록에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Recalculate worker's average rating and update profile
 */
export async function recalculateWorkerRating(workerId: string): Promise<void> {
  try {
    // Check if Firebase is initialized
    if (!db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }

    // Get all evaluations for the worker
    const evalsQuery = query(
      collection(db as Firestore, "workerEvaluations"),
      where("workerId", "==", workerId)
    );

    const evalsSnapshot = await getDocs(evalsQuery);
    
    if (evalsSnapshot.empty) {
      // No evaluations, set default values
      await updateDoc(doc(db as Firestore, "workers", workerId), {
        averageRating: 0,
        totalEvaluations: 0,
        lastEvaluationUpdate: Timestamp.now()
      });
      return;
    }

    let totalRating = 0;
    let categoryRatings: { [key: string]: number } = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };
    let categoryCounts: { [key: string]: number } = {
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
    const categoryAverages: { [key: string]: number } = {};
    Object.keys(categoryRatings).forEach(category => {
      categoryAverages[`${category}Rating`] = categoryCounts[category] > 0 
        ? categoryRatings[category] / categoryCounts[category] 
        : 0;
    });

    // Update worker profile
    await updateDoc(doc(db as Firestore, "workers", workerId), {
      averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      totalEvaluations: evalsSnapshot.size,
      lastEvaluationUpdate: Timestamp.now(),
      ...categoryAverages
    });

  } catch (error) {
    console.error('평균 평점 재계산 실패:', error);
    throw new Error(`평균 평점 업데이트에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get worker evaluations with pagination
 */
export async function getWorkerEvaluations(
  workerId: string, 
  limitCount: number = 10, 
  lastDocId?: string | null
): Promise<WorkerEvaluation[]> {
  try {
    // Check if Firebase is initialized
    if (!db) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }

    let q = query(
      collection(db as Firestore, "workerEvaluations"),
      where("workerId", "==", workerId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const evaluations: WorkerEvaluation[] = [];

    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      } as WorkerEvaluation);
    });

    return evaluations;

  } catch (error) {
    console.error('평가 조회 실패:', error);
    throw new Error(`평가 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get worker evaluation statistics
 */
export async function getWorkerEvaluationStats(workerId: string): Promise<EvaluationStats> {
  try {
    const evalsQuery = query(
      collection(db as Firestore, "workerEvaluations"),
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
    let ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let categoryRatings: { [key: string]: number } = {
      quality: 0,
      punctuality: 0,
      communication: 0,
      overall: 0
    };
    let categoryCounts: { [key: string]: number } = {
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
    const categoryAverages: { [key: string]: number } = {};
    Object.keys(categoryRatings).forEach(category => {
      categoryAverages[category] = categoryCounts[category] > 0 
        ? Math.round((categoryRatings[category] / categoryCounts[category]) * 10) / 10
        : 0;
    });

    return {
      totalEvaluations: evalsSnapshot.size,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      categoryAverages: categoryAverages as EvaluationStats['categoryAverages']
    };

  } catch (error) {
    console.error('평가 통계 조회 실패:', error);
    throw new Error(`평가 통계 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing evaluation
 */
export async function updateEvaluation(
  evaluationId: string, 
  updates: Partial<WorkerEvaluation>
): Promise<EvaluationResult> {
  try {
    const evalRef = doc(db as Firestore, "workerEvaluations", evaluationId);
    
    // Get current evaluation to find workerId
    const evalDoc = await getDocs(query(
      collection(db as Firestore, "workerEvaluations"),
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
    throw new Error(`평가 수정에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an evaluation
 */
export async function deleteEvaluation(evaluationId: string): Promise<EvaluationResult> {
  try {
    const evalRef = doc(db as Firestore, "workerEvaluations", evaluationId);
    
    // Get current evaluation to find workerId
    const evalDoc = await getDocs(query(
      collection(db as Firestore, "workerEvaluations"),
      where("__name__", "==", evaluationId)
    ));
    
    if (evalDoc.empty) {
      throw new Error('평가를 찾을 수 없습니다.');
    }

    const currentEval = evalDoc.docs[0].data();
    
    // Delete evaluation (soft delete)
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
    throw new Error(`평가 삭제에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user has already evaluated a worker for a specific work order
 */
export async function hasEvaluatedWorker(
  workerId: string, 
  evaluatorId: string, 
  workOrderId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db as Firestore, "workerEvaluations"),
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
 */
export async function getRecentEvaluations(limitCount: number = 5): Promise<WorkerEvaluation[]> {
  try {
    const q = query(
      collection(db as Firestore, "workerEvaluations"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const evaluations: WorkerEvaluation[] = [];

    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data()
      } as WorkerEvaluation);
    });

    return evaluations;

  } catch (error) {
    console.error('최근 평가 조회 실패:', error);
    throw new Error(`최근 평가 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 