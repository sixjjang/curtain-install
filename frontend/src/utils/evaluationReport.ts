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
  Timestamp,
  getDoc,
  deleteDoc,
  Firestore
} from "firebase/firestore";

/**
 * Evaluation Report Interface
 */
export interface EvaluationReport {
  id?: string;
  evaluationId: string;
  reporterId: string;
  reporterType: 'seller' | 'customer' | 'admin' | 'worker';
  reason: string;
  description?: string;
  evidence?: string[]; // URLs to evidence files
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Report Result Interface
 */
export interface ReportResult {
  success: boolean;
  reportId?: string;
  message: string;
}

/**
 * Report Filters Interface
 */
export interface ReportFilters {
  evaluationId?: string;
  reporterId?: string;
  status?: string;
  reporterType?: string;
  limitCount?: number;
}

/**
 * Report an evaluation
 */
export async function reportEvaluation(
  evaluationId: string, 
  reporterId: string, 
  reason: string,
  description?: string,
  evidence?: string[]
): Promise<ReportResult> {
  try {
    // Validate inputs
    if (!evaluationId || !reporterId || !reason) {
      throw new Error('필수 신고 정보가 누락되었습니다.');
    }

    if (reason.trim().length < 10) {
      throw new Error('신고 사유는 최소 10자 이상 입력해주세요.');
    }

    // Check if evaluation exists
    const evalQuery = query(
      collection(db as Firestore, "workerEvaluations"),
      where("__name__", "==", evaluationId)
    );
    const evalSnapshot = await getDocs(evalQuery);
    
    if (evalSnapshot.empty) {
      throw new Error('신고하려는 평가를 찾을 수 없습니다.');
    }

    // Check if user has already reported this evaluation
    const existingReportQuery = query(
      collection(db as Firestore, "workerEvaluationReports"),
      where("evaluationId", "==", evaluationId),
      where("reporterId", "==", reporterId)
    );
    const existingReportSnapshot = await getDocs(existingReportQuery);
    
    if (!existingReportSnapshot.empty) {
      throw new Error('이미 신고한 평가입니다.');
    }

    // Get reporter type from user document
    let reporterType: 'seller' | 'customer' | 'admin' | 'worker' = 'customer';
    try {
      const userDoc = await getDoc(doc(db as Firestore, "users", reporterId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        reporterType = userData.role || 'customer';
      }
    } catch (error) {
      console.warn('사용자 역할 확인 실패, 기본값 사용:', error);
    }

    // Create report
    const reportData: EvaluationReport = {
      evaluationId,
      reporterId,
      reporterType,
      reason: reason.trim(),
      description: description?.trim(),
      evidence: evidence || [],
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const reportRef = await addDoc(collection(db as Firestore, "workerEvaluationReports"), reportData);

    return {
      success: true,
      reportId: reportRef.id,
      message: '평가 신고가 성공적으로 접수되었습니다.'
    };

  } catch (error) {
    console.error('평가 신고 실패:', error);
    throw new Error(`평가 신고에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get evaluation reports with filtering
 */
export async function getEvaluationReports(
  filters: ReportFilters = { limitCount: 20 }
): Promise<EvaluationReport[]> {
  try {
    let q = query(
      collection(db as Firestore, "workerEvaluationReports"),
      orderBy("createdAt", "desc"),
      limit(filters.limitCount || 20)
    );

    // Apply filters
    if (filters.evaluationId) {
      q = query(q, where("evaluationId", "==", filters.evaluationId));
    }
    if (filters.reporterId) {
      q = query(q, where("reporterId", "==", filters.reporterId));
    }
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.reporterType) {
      q = query(q, where("reporterType", "==", filters.reporterType));
    }

    const snapshot = await getDocs(q);
    const reports: EvaluationReport[] = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as EvaluationReport;
    });

    return reports;

  } catch (error) {
    console.error('평가 신고 조회 실패:', error);
    throw new Error(`평가 신고 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a specific evaluation report
 */
export async function getEvaluationReport(reportId: string): Promise<EvaluationReport | null> {
  try {
    const reportDoc = await getDoc(doc(db as Firestore, "workerEvaluationReports", reportId));
    
    if (!reportDoc.exists()) {
      return null;
    }

    return {
      id: reportDoc.id,
      ...reportDoc.data()
    } as EvaluationReport;

  } catch (error) {
    console.error('평가 신고 상세 조회 실패:', error);
    throw new Error(`평가 신고 상세 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update evaluation report status (admin only)
 */
export async function updateEvaluationReportStatus(
  reportId: string,
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed',
  adminNotes?: string,
  adminId?: string
): Promise<ReportResult> {
  try {
    const reportRef = doc(db as Firestore, "workerEvaluationReports", reportId);
    
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = Timestamp.now();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(reportRef, updateData);

    return {
      success: true,
      message: `신고 상태가 ${status}로 업데이트되었습니다.`
    };

  } catch (error) {
    console.error('평가 신고 상태 업데이트 실패:', error);
    throw new Error(`평가 신고 상태 업데이트에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete evaluation report (admin only)
 */
export async function deleteEvaluationReport(reportId: string): Promise<ReportResult> {
  try {
    await deleteDoc(doc(db as Firestore, "workerEvaluationReports", reportId));

    return {
      success: true,
      message: '평가 신고가 삭제되었습니다.'
    };

  } catch (error) {
    console.error('평가 신고 삭제 실패:', error);
    throw new Error(`평가 신고 삭제에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get evaluation report statistics
 */
export async function getEvaluationReportStats(): Promise<{
  total: number;
  pending: number;
  under_review: number;
  resolved: number;
  dismissed: number;
  byReporterType: { [key: string]: number };
}> {
  try {
    const reportsQuery = query(collection(db as Firestore, "workerEvaluationReports"));
    const reportsSnapshot = await getDocs(reportsQuery);
    
    const stats = {
      total: 0,
      pending: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0,
      byReporterType: {} as { [key: string]: number }
    };

    reportsSnapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      if (data.status && stats.hasOwnProperty(data.status)) {
        stats[data.status as keyof typeof stats]++;
      }
      
      if (data.reporterType) {
        stats.byReporterType[data.reporterType] = (stats.byReporterType[data.reporterType] || 0) + 1;
      }
    });

    return stats;

  } catch (error) {
    console.error('평가 신고 통계 조회 실패:', error);
    throw new Error(`평가 신고 통계 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if user has reported an evaluation
 */
export async function hasReportedEvaluation(
  evaluationId: string,
  reporterId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db as Firestore, "workerEvaluationReports"),
      where("evaluationId", "==", evaluationId),
      where("reporterId", "==", reporterId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;

  } catch (error) {
    console.error('평가 신고 확인 실패:', error);
    return false;
  }
}

/**
 * Get reports for a specific evaluation
 */
export async function getReportsForEvaluation(evaluationId: string): Promise<EvaluationReport[]> {
  try {
    const q = query(
      collection(db as Firestore, "workerEvaluationReports"),
      where("evaluationId", "==", evaluationId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const reports: EvaluationReport[] = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as EvaluationReport;
    });

    return reports;

  } catch (error) {
    console.error('평가별 신고 조회 실패:', error);
    throw new Error(`평가별 신고 조회에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 