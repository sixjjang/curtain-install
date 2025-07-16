import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { writeAdminLog } from "../../utils/adminLogs";

const WorkerEarningsModal = ({ workerId, onClose, onUpdated, currentAdmin }) => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (workerId) fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    setLoading(true);
    const ref = doc(db, "workerEarnings", workerId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      setWorker(data);
      setStatus(data.withdrawalStatus);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!workerId) return;
    setLoading(true);
    
    try {
      const ref = doc(db, "workerEarnings", workerId);
      const prevStatus = worker.withdrawalStatus;
      
      // 상태 업데이트
      await updateDoc(ref, {
        withdrawalStatus: status,
      });
      
      // 관리자 로그 기록
      await writeAdminLog({
        adminId: currentAdmin.uid,
        adminName: currentAdmin.displayName,
        actionType: "withdrawalUpdate",
        targetWorkerId: workerId,
        targetWorkerName: worker.workerName,
        prevStatus: prevStatus,
        newStatus: status,
      });
      
      setLoading(false);
      onUpdated();
      onClose();
    } catch (error) {
      console.error("상태 업데이트 오류:", error);
      setLoading(false);
      alert("상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  if (!worker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">시공기사 수익 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">이름</p>
            <p className="text-lg font-bold text-blue-900">{worker.workerName}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">총 수익</p>
            <p className="text-lg font-bold text-green-900">
              {worker.totalEarnings?.toLocaleString()} 원
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">진행 건수</p>
            <p className="text-lg font-bold text-purple-900">{worker.totalJobs}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">수익 상세 내역</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">시공일</th>
                  <th className="border border-gray-300 p-3 text-left">시공 수익</th>
                  <th className="border border-gray-300 p-3 text-left">부업 수익</th>
                  <th className="border border-gray-300 p-3 text-left">합계</th>
                </tr>
              </thead>
              <tbody>
                {worker.earningsDetails?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">
                      {item.jobDate?.toDate().toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 p-3 text-green-600 font-medium">
                      {item.jobEarning?.toLocaleString()} 원
                    </td>
                    <td className="border border-gray-300 p-3 text-blue-600 font-medium">
                      {item.mediaEarning?.toLocaleString()} 원
                    </td>
                    <td className="border border-gray-300 p-3 font-bold">
                      {(item.jobEarning + item.mediaEarning)?.toLocaleString()} 원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2">
            <span className="text-sm font-medium text-gray-700">출금 상태</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="requested">출금 요청 중</option>
              <option value="completed">출금 완료</option>
              <option value="onHold">보류</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleStatusUpdate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerEarningsModal; 