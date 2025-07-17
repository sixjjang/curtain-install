import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase/firebase";
import { collection, query, onSnapshot, orderBy, where, limit } from "firebase/firestore";

// JSDoc for PaymentInfo
/**
 * @typedef {Object} PaymentInfo
 * @property {string} workOrderId
 * @property {string} customerName
 * @property {string=} customerId
 * @property {string=} workerId
 * @property {string=} workerName
 * @property {number} baseFee
 * @property {number} urgentFeePercent
 * @property {number} platformFeePercent
 * @property {string} paymentStatus
 * @property {any=} createdAt
 * @property {any=} updatedAt
 * @property {Object} paymentDetails
 * @property {number} paymentDetails.urgentFee
 * @property {number} paymentDetails.totalFee
 * @property {number} paymentDetails.platformFee
 * @property {number} paymentDetails.workerPayment
 * @property {number=} paymentDetails.customerTotalPayment
 * @property {any=} paymentDetails.paidAt
 * @property {string=} paymentDetails.paymentMethod
 * @property {string=} paymentDetails.transactionId
 * @property {number=} paymentDetails.actualAmount
 * @property {string=} paymentDetails.notes
 */

export default function AdminPaymentList() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("paidAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Date range for filtering
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      let q = query(collection(db, "workOrders"));

      // Apply status filter
      if (statusFilter !== "all") {
        q = query(q, where("paymentStatus", "==", statusFilter));
      }

      // Apply date filter
      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        q = query(q, where("paymentDetails.paidAt", ">=", today));
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(q, where("paymentDetails.paidAt", ">=", weekAgo));
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        q = query(q, where("paymentDetails.paidAt", ">=", monthAgo));
      } else if (dateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        q = query(
          q, 
          where("paymentDetails.paidAt", ">=", start),
          where("paymentDetails.paidAt", "<=", end)
        );
      }

      // Apply sorting
      if (sortBy === "paidAt") {
        q = query(q, orderBy("paymentDetails.paidAt", sortOrder));
      } else if (sortBy === "totalFee") {
        q = query(q, orderBy("paymentDetails.totalFee", sortOrder));
      } else if (sortBy === "createdAt") {
        q = query(q, orderBy("createdAt", sortOrder));
      }

      // Apply pagination
      q = query(q, limit(itemsPerPage * page));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          data.push({
            workOrderId: doc.id,
            customerName: d.customerName || d.customer?.name || "N/A",
            customerId: d.customerId,
            workerId: d.workerId,
            workerName: d.workerName || d.worker?.name,
            baseFee: d.baseFee || 0,
            urgentFeePercent: d.urgentFeePercent || 0,
            platformFeePercent: d.platformFeePercent || 0,
            paymentStatus: d.paymentStatus || "pending",
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            paymentDetails: {
              urgentFee: d.paymentDetails?.urgentFee || 0,
              totalFee: d.paymentDetails?.totalFee || 0,
              platformFee: d.paymentDetails?.platformFee || 0,
              workerPayment: d.paymentDetails?.workerPayment || 0,
              customerTotalPayment: d.paymentDetails?.customerTotalPayment || 0,
              paidAt: d.paymentDetails?.paidAt,
              paymentMethod: d.paymentDetails?.paymentMethod,
              transactionId: d.paymentDetails?.transactionId,
              actualAmount: d.paymentDetails?.actualAmount,
              notes: d.paymentDetails?.notes,
            },
          });
        });
        setPayments(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching payments:", error);
        setError("결제 내역을 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up query:", error);
      setError("쿼리 설정 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [statusFilter, dateFilter, startDate, endDate, sortBy, sortOrder, page]);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.workerName && payment.workerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [payments, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalPayments: filteredPayments.length,
      totalRevenue: 0,
      totalWorkerPayments: 0,
      totalPlatformFees: 0,
      averagePayment: 0,
      statusCounts: {},
      paymentMethodCounts: {},
    };

    filteredPayments.forEach(payment => {
      stats.totalRevenue += payment.paymentDetails.totalFee || 0;
      stats.totalWorkerPayments += payment.paymentDetails.workerPayment || 0;
      stats.totalPlatformFees += payment.paymentDetails.platformFee || 0;
      
      stats.statusCounts[payment.paymentStatus] = (stats.statusCounts[payment.paymentStatus] || 0) + 1;
      
      if (payment.paymentDetails.paymentMethod) {
        stats.paymentMethodCounts[payment.paymentDetails.paymentMethod] = 
          (stats.paymentMethodCounts[payment.paymentDetails.paymentMethod] || 0) + 1;
      }
    });

    stats.averagePayment = stats.totalPayments > 0 ? stats.totalRevenue / stats.totalPayments : 0;

    return stats;
  }, [filteredPayments]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(0, page * itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-purple-100 text-purple-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      card: "카드",
      bank_transfer: "계좌이체",
      cash: "현금",
      mobile_payment: "모바일결제",
      other: "기타",
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">오류 발생</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">관리자 결제 내역</h1>
        <div className="text-sm text-gray-500">
          총 {statistics.totalPayments}건의 결제 내역
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">총 매출</div>
          <div className="text-2xl font-bold text-green-600">
            {statistics.totalRevenue.toLocaleString()}원
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">작업자 지급액</div>
          <div className="text-2xl font-bold text-blue-600">
            {statistics.totalWorkerPayments.toLocaleString()}원
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">플랫폼 수수료</div>
          <div className="text-2xl font-bold text-orange-600">
            {statistics.totalPlatformFees.toLocaleString()}원
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500">평균 결제액</div>
          <div className="text-2xl font-bold text-purple-600">
            {statistics.averagePayment.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              placeholder="작업 ID, 고객명, 작업자명"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">결제 상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="pending">대기중</option>
              <option value="processing">처리중</option>
              <option value="paid">결제완료</option>
              <option value="failed">결제실패</option>
              <option value="refunded">환불</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
              <option value="custom">사용자 지정</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-3">결제 상태 분포</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statistics.statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
              <span className="text-sm text-gray-600">{count}건</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("workOrderId")}
                >
                  작업 ID
                  {sortBy === "workOrderId" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업자
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("totalFee")}
                >
                  총 결제금액
                  {sortBy === "totalFee" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기사 지급액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  플랫폼 수수료
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 방법
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 상태
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("paidAt")}
                >
                  결제일
                  {sortBy === "paidAt" && (
                    <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPayments.map((payment) => (
                <tr key={payment.workOrderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.workOrderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.workerName || "미배정"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {payment.paymentDetails.customerTotalPayment?.toLocaleString() || 
                     payment.paymentDetails.totalFee?.toLocaleString() || "0"}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentDetails.workerPayment?.toLocaleString() || "0"}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentDetails.platformFee?.toLocaleString() || "0"}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentDetails.paymentMethod ? 
                      getPaymentMethodLabel(payment.paymentDetails.paymentMethod) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentDetails.paidAt ? 
                      new Date(payment.paymentDetails.paidAt.seconds * 1000).toLocaleDateString('ko-KR') : 
                      payment.paymentStatus === 'paid' ? '날짜 없음' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-2"
                      onClick={() => window.open(`/admin/payment/${payment.workOrderId}`, '_blank')}
                    >
                      상세보기
                    </button>
                    {payment.paymentDetails.transactionId && (
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => navigator.clipboard.writeText(payment.paymentDetails.transactionId)}
                        title="거래 ID 복사"
                      >
                        복사
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> -{" "}
                  <span className="font-medium">
                    {Math.min(page * itemsPerPage, filteredPayments.length)}
                  </span>{" "}
                  / <span className="font-medium">{filteredPayments.length}</span> 결과
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="mt-6 flex justify-end space-x-2">
        <button
          onClick={() => {
            const csv = convertToCSV(filteredPayments);
            downloadCSV(csv, `payment-list-${new Date().toISOString().split('T')[0]}.csv`);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          CSV 다운로드
        </button>
        <button
          onClick={() => {
            const json = JSON.stringify(filteredPayments, null, 2);
            downloadJSON(json, `payment-list-${new Date().toISOString().split('T')[0]}.json`);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          JSON 다운로드
        </button>
      </div>
    </div>
  );
}

// Utility functions
function convertToCSV(data) {
  const headers = [
    '작업 ID',
    '고객명',
    '작업자',
    '총 결제금액',
    '기사 지급액',
    '플랫폼 수수료',
    '결제 방법',
    '결제 상태',
    '결제일',
    '거래 ID'
  ];

  const rows = data.map(payment => [
    payment.workOrderId,
    payment.customerName,
    payment.workerName || '미배정',
    payment.paymentDetails.customerTotalPayment || payment.paymentDetails.totalFee || 0,
    payment.paymentDetails.workerPayment || 0,
    payment.paymentDetails.platformFee || 0,
    payment.paymentDetails.paymentMethod || '',
    payment.paymentStatus,
    payment.paymentDetails.paidAt ? 
      new Date(payment.paymentDetails.paidAt.seconds * 1000).toLocaleDateString('ko-KR') : '',
    payment.paymentDetails.transactionId || ''
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function downloadJSON(json, filename) {
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
} 