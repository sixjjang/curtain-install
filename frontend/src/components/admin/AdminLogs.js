import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "adminLogs"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(list);
      } catch (error) {
        console.error("관리자 로그 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionTypeText = (actionType) => {
    switch (actionType) {
      case "withdrawalUpdate": return "출금 상태 변경";
      case "earningAdjust": return "수익 조정";
      case "workerGradeUpdate": return "시공기사 등급 변경";
      case "paymentApproval": return "결제 승인";
      case "mediaApproval": return "미디어 승인";
      case "adminRoleGrant": return "관리자 권한 부여";
      case "adminRoleRevoke": return "관리자 권한 해제";
      default: return actionType;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "requested": return "출금 요청 중";
      case "completed": return "출금 완료";
      case "onHold": return "보류";
      case "pending": return "대기중";
      case "approved": return "승인됨";
      case "rejected": return "거절됨";
      default: return status;
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case "withdrawalUpdate": return "bg-blue-100 text-blue-800";
      case "earningAdjust": return "bg-green-100 text-green-800";
      case "workerGradeUpdate": return "bg-purple-100 text-purple-800";
      case "paymentApproval": return "bg-yellow-100 text-yellow-800";
      case "mediaApproval": return "bg-indigo-100 text-indigo-800";
      case "adminRoleGrant": return "bg-emerald-100 text-emerald-800";
      case "adminRoleRevoke": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">관리자 활동 로그</h2>
        <div className="text-sm text-gray-600">
          총 {logs.length}건의 활동 기록
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로그를 불러오는 중...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left">일시</th>
                <th className="border border-gray-300 p-3 text-left">관리자</th>
                <th className="border border-gray-300 p-3 text-left">동작</th>
                <th className="border border-gray-300 p-3 text-left">대상 기사</th>
                <th className="border border-gray-300 p-3 text-left">변경 내역</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">
                    {log.timestamp?.toDate().toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-3 font-medium">
                    {log.adminName}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                      {getActionTypeText(log.actionType)}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    {log.targetWorkerName || "-"}
                  </td>
                  <td className="border border-gray-300 p-3">
                    {log.prevStatus && log.newStatus ? (
                      <span className="text-gray-600">
                        <span className="text-red-600">{getStatusText(log.prevStatus)}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600">{getStatusText(log.newStatus)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              관리자 활동 로그가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogs; 