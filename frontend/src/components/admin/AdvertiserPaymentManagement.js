import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const AdvertiserPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [stats, setStats] = useState({});
  const [formData, setFormData] = useState({
    advertiserId: "",
    ads: [],
    amount: "",
    paymentMethod: "카드",
    paymentDate: "",
    status: "pending"
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch payments
      const paymentsSnapshot = await getDocs(query(
        collection(db, "advertiserPayments"),
        orderBy("createdAt", "desc")
      ));
      const paymentsList = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsList);

      // Fetch advertisers
      const advertisersSnapshot = await getDocs(collection(db, "advertisers"));
      const advertisersList = advertisersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdvertisers(advertisersList);

      // Fetch ads
      const adsSnapshot = await getDocs(collection(db, "ads"));
      const adsList = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAds(adsList);

      // Calculate stats
      calculateStats(paymentsList);
    } catch (error) {
      console.error("데이터 조회 오류:", error);
      setMessage("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsList) => {
    const stats = {
      total: paymentsList.length,
      totalAmount: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      paidAmount: 0,
      pendingAmount: 0,
      failedAmount: 0
    };

    paymentsList.forEach(payment => {
      stats.totalAmount += payment.amount || 0;
      
      switch (payment.status) {
        case "paid":
          stats.paid++;
          stats.paidAmount += payment.amount || 0;
          break;
        case "pending":
          stats.pending++;
          stats.pendingAmount += payment.amount || 0;
          break;
        case "failed":
          stats.failed++;
          stats.failedAmount += payment.amount || 0;
          break;
      }
    });

    setStats(stats);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.advertiserId || !formData.amount || formData.ads.length === 0) {
      setMessage("필수 필드를 모두 입력해주세요.");
      return;
    }

    try {
      const paymentData = {
        ...formData,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : new Date(),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // 수정
        await updateDoc(doc(db, "advertiserPayments", editingId), paymentData);
        setMessage("결제 정보가 수정되었습니다.");
      } else {
        // 새로 등록
        paymentData.createdAt = serverTimestamp();
        await addDoc(collection(db, "advertiserPayments"), paymentData);
        setMessage("새 결제가 등록되었습니다.");
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("결제 저장 오류:", error);
      setMessage("저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      advertiserId: payment.advertiserId || "",
      ads: payment.ads || [],
      amount: payment.amount?.toString() || "",
      paymentMethod: payment.paymentMethod || "카드",
      paymentDate: payment.paymentDate?.toDate?.().toISOString().split('T')[0] || "",
      status: payment.status || "pending"
    });
    setEditingId(payment.id);
    setShowForm(true);
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updateDoc(doc(db, "advertiserPayments", paymentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setMessage("결제 상태가 업데이트되었습니다.");
      fetchData();
    } catch (error) {
      console.error("상태 업데이트 오류:", error);
      setMessage("상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      advertiserId: "",
      ads: [],
      amount: "",
      paymentMethod: "카드",
      paymentDate: "",
      status: "pending"
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid": return "결제완료";
      case "pending": return "대기중";
      case "failed": return "실패";
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "카드": return "신용카드";
      case "계좌이체": return "계좌이체";
      case "현금": return "현금";
      case "기타": return "기타";
      default: return method;
    }
  };

  const getAdvertiserName = (advertiserId) => {
    const advertiser = advertisers.find(a => a.id === advertiserId);
    return advertiser ? (advertiser.companyName || advertiser.name) : "알 수 없음";
  };

  const getAdNames = (adIds) => {
    if (!Array.isArray(adIds)) return [];
    return adIds.map(adId => {
      const ad = ads.find(a => a.id === adId);
      return ad ? ad.brandName : adId;
    });
  };

  // 필터링된 결제 목록
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      getAdvertiserName(payment.advertiserId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">광고주 결제 관리</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          새 결제 등록
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
          {message}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
          <div className="text-sm text-blue-700">총 결제</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.paid || 0}</div>
          <div className="text-sm text-green-700">결제완료</div>
          <div className="text-xs text-green-600">{stats.paidAmount?.toLocaleString()}원</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
          <div className="text-sm text-yellow-700">대기중</div>
          <div className="text-xs text-yellow-600">{stats.pendingAmount?.toLocaleString()}원</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.failed || 0}</div>
          <div className="text-sm text-red-700">실패</div>
          <div className="text-xs text-red-600">{stats.failedAmount?.toLocaleString()}원</div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="광고주명, 결제ID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="paid">결제완료</option>
            <option value="pending">대기중</option>
            <option value="failed">실패</option>
          </select>
        </div>
      </div>

      {/* 결제 등록/수정 폼 */}
      {showForm && (
        <div className="mb-6 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "결제 정보 수정" : "새 결제 등록"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  광고주 *
                </label>
                <select
                  value={formData.advertiserId}
                  onChange={(e) => setFormData({...formData, advertiserId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">광고주 선택</option>
                  {advertisers.map(advertiser => (
                    <option key={advertiser.id} value={advertiser.id}>
                      {advertiser.companyName || advertiser.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  결제금액 (원) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  결제수단
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="카드">신용카드</option>
                  <option value="계좌이체">계좌이체</option>
                  <option value="현금">현금</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  결제일
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">대기중</option>
                  <option value="paid">결제완료</option>
                  <option value="failed">실패</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                결제 대상 광고 *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {ads.map(ad => (
                  <label key={ad.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.ads.includes(ad.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, ads: [...formData.ads, ad.id]});
                        } else {
                          setFormData({...formData, ads: formData.ads.filter(id => id !== ad.id)});
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{ad.brandName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingId ? "수정" : "등록"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 결제 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left">결제ID</th>
              <th className="border border-gray-300 p-3 text-left">광고주</th>
              <th className="border border-gray-300 p-3 text-left">결제금액</th>
              <th className="border border-gray-300 p-3 text-left">결제수단</th>
              <th className="border border-gray-300 p-3 text-left">결제일</th>
              <th className="border border-gray-300 p-3 text-left">상태</th>
              <th className="border border-gray-300 p-3 text-left">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-mono text-sm">
                  {payment.id}
                </td>
                <td className="border border-gray-300 p-3">
                  <div className="font-medium">{getAdvertiserName(payment.advertiserId)}</div>
                  <div className="text-xs text-gray-500">
                    {payment.ads?.length || 0}개 광고
                  </div>
                </td>
                <td className="border border-gray-300 p-3 font-semibold">
                  {payment.amount?.toLocaleString()}원
                </td>
                <td className="border border-gray-300 p-3">
                  {getPaymentMethodText(payment.paymentMethod)}
                </td>
                <td className="border border-gray-300 p-3 text-sm">
                  {payment.paymentDate?.toDate?.().toLocaleDateString() || "-"}
                </td>
                <td className="border border-gray-300 p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </td>
                <td className="border border-gray-300 p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(payment)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                    >
                      수정
                    </button>
                    {payment.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, "paid")}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                        >
                          완료
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(payment.id, "failed")}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          실패
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || statusFilter !== "all" ? "검색 결과가 없습니다." : "등록된 결제가 없습니다."}
        </div>
      )}
    </div>
  );
};

export default AdvertiserPaymentManagement; 