import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import WorkerEarningsModal from "./WorkerEarningsModal";
import { useAuth } from "../../hooks/useAuth";

const PaymentsAdmin = () => {
  const [earnings, setEarnings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings"); // "earnings" or "payments"
  const [filter, setFilter] = useState("all");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === "earnings") {
      fetchEarnings();
    } else {
      fetchPayments();
    }
  }, [activeTab, filter]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "workerEarnings"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEarnings(list);
    } catch (error) {
      console.error("시공기사 수익 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let q = collection(db, "mediaPayments");
      
      if (filter !== "all") {
        q = query(q, where("status", "==", filter));
      }
      
      q = query(q, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(list);
    } catch (error) {
      console.error("결제 내역 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "대기중";
      case "completed": return "완료";
      case "failed": return "실패";
      case "refunded": return "환불됨";
      default: return status;
    }
  };

  const getPaymentTypeText = (type) => {
    switch (type) {
      case "photo": return "사진";
      case "video": return "영상";
      default: return type;
    }
  };

  const getWithdrawalStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWithdrawalStatusText = (status) => {
    switch (status) {
      case "pending": return "대기중";
      case "approved": return "승인됨";
      case "rejected": return "거절됨";
      case "completed": return "완료";
      case "requested": return "출금 요청 중";
      case "onHold": return "보류";
      default: return status || "없음";
    }
  };

  const handleWorkerUpdated = () => {
    fetchEarnings();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">결제 관리</h2>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("earnings")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "earnings"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          시공기사 수익 관리
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          결제 내역 관리
        </button>
      </div>
      
      {/* 통계 */}
      {activeTab === "earnings" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">총 시공기사</h3>
            <p className="text-2xl font-bold text-blue-900">{earnings.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">총 수익</h3>
            <p className="text-2xl font-bold text-green-900">
              {earnings.reduce((sum, worker) => sum + (worker.totalEarnings || 0), 0).toLocaleString()}원
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">출금요청 대기</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {earnings.filter(w => w.withdrawalStatus === "pending").length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">총 시공 건수</h3>
            <p className="text-2xl font-bold text-purple-900">
              {earnings.reduce((sum, worker) => sum + (worker.totalJobs || 0), 0)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">총 결제 건수</h3>
            <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">완료된 결제</h3>
            <p className="text-2xl font-bold text-green-900">
              {payments.filter(p => p.status === "completed").length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">대기중 결제</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {payments.filter(p => p.status === "pending").length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-600">실패한 결제</h3>
            <p className="text-2xl font-bold text-red-900">
              {payments.filter(p => p.status === "failed").length}
            </p>
          </div>
        </div>
      )}

      {/* 필터 */}
      {activeTab === "payments" && (
        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="completed">완료</option>
            <option value="failed">실패</option>
            <option value="refunded">환불됨</option>
          </select>
        </div>
      )}

              {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "earnings" ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">시공기사명</th>
                    <th className="border border-gray-300 p-3 text-left">누적 수익</th>
                    <th className="border border-gray-300 p-3 text-left">진행 건수</th>
                    <th className="border border-gray-300 p-3 text-left">출금요청 상태</th>
                    <th className="border border-gray-300 p-3 text-left">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-medium">{worker.workerName}</td>
                      <td className="border border-gray-300 p-3 font-semibold text-green-600">
                        {worker.totalEarnings?.toLocaleString()} 원
                      </td>
                      <td className="border border-gray-300 p-3">{worker.totalJobs || 0}</td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWithdrawalStatusColor(worker.withdrawalStatus)}`}>
                          {getWithdrawalStatusText(worker.withdrawalStatus)}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <button
                          className="text-blue-600 underline hover:text-blue-800 transition-colors"
                          onClick={() => setSelectedWorkerId(worker.id)}
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">결제 ID</th>
                    <th className="border border-gray-300 p-3 text-left">구매자</th>
                    <th className="border border-gray-300 p-3 text-left">판매자</th>
                    <th className="border border-gray-300 p-3 text-left">미디어 타입</th>
                    <th className="border border-gray-300 p-3 text-left">금액</th>
                    <th className="border border-gray-300 p-3 text-left">상태</th>
                    <th className="border border-gray-300 p-3 text-left">결제일</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 font-mono text-sm">{payment.id}</td>
                      <td className="border border-gray-300 p-3">{payment.buyerName || payment.buyerId}</td>
                      <td className="border border-gray-300 p-3">{payment.sellerName || payment.sellerId}</td>
                      <td className="border border-gray-300 p-3">{getPaymentTypeText(payment.mediaType)}</td>
                      <td className="border border-gray-300 p-3 font-medium">
                        {payment.amount ? `${payment.amount.toLocaleString()}원` : "-"}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3">
                        {payment.createdAt ? new Date(payment.createdAt.toDate()).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {((activeTab === "earnings" && earnings.length === 0) || 
              (activeTab === "payments" && payments.length === 0)) && (
              <div className="text-center py-8 text-gray-500">
                {activeTab === "earnings" ? "시공기사 수익 내역이 없습니다." : "결제 내역이 없습니다."}
              </div>
            )}
          </div>
        )}

      {/* Worker Earnings Modal */}
      {selectedWorkerId && (
        <WorkerEarningsModal
          workerId={selectedWorkerId}
          onClose={() => setSelectedWorkerId(null)}
          onUpdated={handleWorkerUpdated}
          currentAdmin={user}
        />
      )}
    </div>
  );
};

export default PaymentsAdmin; 