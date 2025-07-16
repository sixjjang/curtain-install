import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const JobDetailModal = ({ jobId, onClose, onUpdated }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!jobId) return;

    const fetchJob = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "workerJobs", jobId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setJob(data);
          setStatus(data.status);
        }
      } catch (error) {
        console.error("시공 내역 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const updateStatus = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const docRef = doc(db, "workerJobs", jobId);
      await updateDoc(docRef, { status });
      onUpdated();
      onClose();
    } catch (error) {
      console.error("상태 업데이트 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "inProgress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "대기";
      case "inProgress": return "진행중";
      case "completed": return "완료";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  if (!jobId) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : job ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">시공 내역 상세</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">고객 정보</h4>
                <p className="text-lg font-semibold text-gray-900">{job.customerName}</p>
                {job.address && (
                  <p className="text-sm text-gray-600 mt-1">{job.address}</p>
                )}
              </div>

              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">시공기사</h4>
                <p className="text-lg font-semibold text-gray-900">{job.workerName || "미배정"}</p>
              </div>

              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">예약일</h4>
                <p className="text-lg font-semibold text-gray-900">
                  {job.scheduledDate ? new Date(job.scheduledDate.toDate()).toLocaleDateString() : "미정"}
                </p>
              </div>

              <div className="border-b pb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">현재 상태</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusText(job.status)}
                </span>
              </div>

              {job.description && (
                <div className="border-b pb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">작업 내용</h4>
                  <p className="text-gray-900">{job.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태 변경
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="pending">대기</option>
                  <option value="inProgress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소됨</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                취소
              </button>
              <button
                onClick={updateStatus}
                disabled={loading || status === job.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">시공 내역을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailModal; 