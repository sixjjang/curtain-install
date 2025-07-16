import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { 
  validateAdvertiserData, 
  getAdvertiserStatusText, 
  getAdvertiserStatusColor,
  filterAdvertisers,
  sortAdvertisers,
  calculateAdvertiserStats
} from "../../utils/advertiserUtils";
import AdvertiserDetailModal from "./AdvertiserDetailModal";
import { useNavigate } from "react-router-dom";

const AdvertiserManagement = () => {
  const [advertisers, setAdvertisers] = useState([]);
  const [filteredAdvertisers, setFilteredAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [stats, setStats] = useState({});
  const [selectedAdvertiser, setSelectedAdvertiser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    companyName: "",
    businessNumber: "",
    address: "",
    description: "",
    status: "active"
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAdvertisers();
  }, []);

  const fetchAdvertisers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "advertisers"));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdvertisers(list);
      setStats(calculateAdvertiserStats(list));
    } catch (error) {
      console.error("광고주 조회 오류:", error);
      setMessage("광고주 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 정렬 적용
  useEffect(() => {
    let filtered = filterAdvertisers(advertisers, searchTerm);
    filtered = sortAdvertisers(filtered, sortBy, sortOrder);
    setFilteredAdvertisers(filtered);
  }, [advertisers, searchTerm, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateAdvertiserData(formData);
    if (!validation.isValid) {
      setMessage(validation.errors.join('\n'));
      return;
    }

    try {
      if (editingId) {
        // 수정
        await updateDoc(doc(db, "advertisers", editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setMessage("광고주 정보가 수정되었습니다.");
      } else {
        // 새로 등록
        await addDoc(collection(db, "advertisers"), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setMessage("새 광고주가 등록되었습니다.");
      }
      
      resetForm();
      fetchAdvertisers();
    } catch (error) {
      console.error("광고주 저장 오류:", error);
      setMessage("저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (advertiser) => {
    setFormData({
      name: advertiser.name || "",
      contactEmail: advertiser.contactEmail || "",
      phone: advertiser.phone || "",
      companyName: advertiser.companyName || "",
      businessNumber: advertiser.businessNumber || "",
      address: advertiser.address || "",
      description: advertiser.description || "",
      status: advertiser.status || "active"
    });
    setEditingId(advertiser.id);
    setShowForm(true);
  };

  const handleViewDetail = (advertiser) => {
    setSelectedAdvertiser(advertiser);
    setShowDetailModal(true);
  };

  const handlePaymentPage = (advertiserId) => {
    navigate(`/advertiser-payment/${advertiserId}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말로 이 광고주를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "advertisers", id));
      setMessage("광고주가 삭제되었습니다.");
      fetchAdvertisers();
    } catch (error) {
      console.error("광고주 삭제 오류:", error);
      setMessage("삭제 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contactEmail: "",
      phone: "",
      companyName: "",
      businessNumber: "",
      address: "",
      description: "",
      status: "active"
    });
    setEditingId(null);
    setShowForm(false);
  };



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
        <h2 className="text-2xl font-bold">광고주 관리</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          새 광고주 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
          <div className="text-sm text-blue-700">총 광고주</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
          <div className="text-sm text-green-700">활성</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
          <div className="text-sm text-yellow-700">대기중</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.inactive || 0}</div>
          <div className="text-sm text-red-700">비활성</div>
        </div>
      </div>

      {/* 검색 및 정렬 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="담당자명, 회사명, 이메일, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">등록일</option>
            <option value="name">담당자명</option>
            <option value="companyName">회사명</option>
            <option value="status">상태</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "광고주 정보 수정" : "새 광고주 등록"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="담당자 이름"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 이메일 *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="OO커튼판매업체"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업자등록번호
                </label>
                <input
                  type="text"
                  value={formData.businessNumber}
                  onChange={(e) => setFormData({...formData, businessNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123-45-67890"
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
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="pending">대기중</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="서울시 강남구..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="광고주에 대한 추가 정보..."
              />
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left">ID</th>
              <th className="border border-gray-300 p-3 text-left">담당자명</th>
              <th className="border border-gray-300 p-3 text-left">회사명</th>
              <th className="border border-gray-300 p-3 text-left">연락처</th>
              <th className="border border-gray-300 p-3 text-left">상태</th>
              <th className="border border-gray-300 p-3 text-left">등록일</th>
              <th className="border border-gray-300 p-3 text-left">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdvertisers.map((advertiser) => (
              <tr key={advertiser.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-mono text-sm">
                  {advertiser.id}
                </td>
                <td className="border border-gray-300 p-3 font-medium">
                  {advertiser.name}
                </td>
                <td className="border border-gray-300 p-3">
                  {advertiser.companyName || "-"}
                </td>
                <td className="border border-gray-300 p-3">
                  <div>
                    <div className="text-sm">{advertiser.contactEmail}</div>
                    <div className="text-sm text-gray-600">{advertiser.phone}</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdvertiserStatusColor(advertiser.status)}`}>
                    {getAdvertiserStatusText(advertiser.status)}
                  </span>
                </td>
                <td className="border border-gray-300 p-3 text-sm">
                  {advertiser.createdAt?.toDate?.().toLocaleDateString() || "-"}
                </td>
                <td className="border border-gray-300 p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(advertiser)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                    >
                      상세
                    </button>
                    <button
                      onClick={() => handlePaymentPage(advertiser.id)}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 transition-colors"
                    >
                      결제
                    </button>
                    <button
                      onClick={() => handleEdit(advertiser)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(advertiser.id)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAdvertisers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "검색 결과가 없습니다." : "등록된 광고주가 없습니다."}
        </div>
      )}

      {/* 상세 정보 모달 */}
      <AdvertiserDetailModal
        advertiser={selectedAdvertiser}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAdvertiser(null);
        }}
      />
    </div>
  );
};

export default AdvertiserManagement; 