import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAllContractorGrades } from "../hooks/useContractorGrade";
import { getGradeStyle, getGradeBenefits } from "../utils/gradeCalculator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ContractorGradeManagement = () => {
  const [contractors, setContractors] = useState([]);
  const [filteredContractors, setFilteredContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    grade: "",
    search: "",
    sortBy: "name"
  });
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [showStats, setShowStats] = useState(true);

  const { updateAllGrades, gradeStats, averageRatingStats } = useAllContractorGrades();

  // 시공기사 데이터 로드
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const contractorsRef = collection(db, "contractors");
        const q = query(contractorsRef, orderBy("name"));
        const snapshot = await getDocs(q);
        
        const contractorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setContractors(contractorsData);
        setFilteredContractors(contractorsData);
      } catch (error) {
        console.error("시공기사 데이터 로드 오류:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  // 필터 적용
  useEffect(() => {
    let filtered = [...contractors];

    // 등급 필터
    if (filters.grade) {
      filtered = filtered.filter(contractor => contractor.grade === filters.grade);
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(contractor => 
        contractor.name?.toLowerCase().includes(searchLower) ||
        contractor.email?.toLowerCase().includes(searchLower) ||
        contractor.phone?.includes(filters.search)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "grade":
          const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
          return gradeOrder[b.grade || "C"] - gradeOrder[a.grade || "C"];
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "ratings":
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        default:
          return 0;
      }
    });

    setFilteredContractors(filtered);
  }, [contractors, filters]);

  // 전체 등급 업데이트
  const handleBulkGradeUpdate = async () => {
    try {
      const result = await updateAllGrades();
      alert(`등급 업데이트 완료: 성공 ${result.successful}건, 실패 ${result.failed}건`);
    } catch (error) {
      alert("등급 업데이트 중 오류가 발생했습니다.");
    }
  };

  // 개별 시공기사 선택
  const toggleContractorSelection = (contractorId) => {
    setSelectedContractors(prev => 
      prev.includes(contractorId) 
        ? prev.filter(id => id !== contractorId)
        : [...prev, contractorId]
    );
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedContractors.length === filteredContractors.length) {
      setSelectedContractors([]);
    } else {
      setSelectedContractors(filteredContractors.map(c => c.id));
    }
  };

  // 등급별 색상
  const getGradeColor = (grade) => {
    const colors = {
      A: "#10B981",
      B: "#3B82F6", 
      C: "#F59E0B",
      D: "#EF4444"
    };
    return colors[grade] || "#6B7280";
  };

  // 차트 데이터
  const getGradeChartData = () => {
    return Object.entries(gradeStats).map(([grade, count]) => ({
      grade: grade === "total" ? "전체" : `${grade}등급`,
      count,
      color: grade === "total" ? "#6B7280" : getGradeColor(grade)
    })).filter(item => item.grade !== "전체");
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${payload[0].value}명`}</p>
          <p className="text-sm text-gray-600">
            {Math.round((payload[0].value / gradeStats.total) * 100)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">시공기사 등급 관리</h1>
          <p className="text-gray-600 mt-1">총 {contractors.length}명의 시공기사</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showStats ? "통계 숨기기" : "통계 보기"}
          </button>
          <button
            onClick={handleBulkGradeUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            전체 등급 업데이트
          </button>
        </div>
      </div>

      {/* 통계 섹션 */}
      {showStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 등급 분포 차트 */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <h3 className="text-lg font-semibold mb-4">등급 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getGradeChartData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ grade, count }) => `${grade}: ${count}명`}
                >
                  {getGradeChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 등급별 통계 */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <h3 className="text-lg font-semibold mb-4">등급별 현황</h3>
            <div className="space-y-4">
              {Object.entries(gradeStats).map(([grade, count]) => {
                if (grade === "total") return null;
                const percentage = Math.round((count / gradeStats.total) * 100);
                const gradeStyle = getGradeStyle(grade);
                
                return (
                  <div key={grade} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
                        {grade}등급
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{count}명</p>
                      <p className="text-sm text-gray-500">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 평균 평점 통계 */}
          <div className="bg-white rounded-xl shadow-md p-6 border">
            <h3 className="text-lg font-semibold mb-4">평균 평점 통계</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">전체 평균</span>
                <span className="font-medium">{averageRatingStats.average}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최고 평점</span>
                <span className="font-medium text-green-600">{averageRatingStats.max}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최저 평점</span>
                <span className="font-medium text-red-600">{averageRatingStats.min}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-md p-6 border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">등급 필터</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 등급</option>
              <option value="A">A등급</option>
              <option value="B">B등급</option>
              <option value="C">C등급</option>
              <option value="D">D등급</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">이름순</option>
              <option value="grade">등급순</option>
              <option value="rating">평점순</option>
              <option value="ratings">평가수순</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="이름, 이메일, 전화번호로 검색"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 시공기사 목록 */}
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              시공기사 목록 ({filteredContractors.length}명)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedContractors.length === filteredContractors.length && filteredContractors.length > 0}
                onChange={toggleAllSelection}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">전체 선택</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  선택
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시공기사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평균 평점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평가 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최근 업데이트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContractors.map((contractor) => {
                const gradeStyle = getGradeStyle(contractor.grade || "C");
                const gradeBenefits = getGradeBenefits(contractor.grade || "C");
                
                return (
                  <tr key={contractor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedContractors.includes(contractor.id)}
                        onChange={() => toggleContractorSelection(contractor.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          {contractor.profileImage ? (
                            <img 
                              src={contractor.profileImage} 
                              alt="프로필" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>👷</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contractor.name || "이름 없음"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contractor.email || "이메일 없음"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
                        <span className="mr-1">{gradeStyle.icon}</span>
                        {contractor.grade || "C"}등급
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {contractor.averageRating || 0}
                        </span>
                        <div className="flex ml-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xs ${
                                star <= (contractor.averageRating || 0) ? "text-yellow-400" : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.totalRatings || 0}건
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contractor.lastGradeUpdate?.toDate?.()?.toLocaleDateString() || 
                       (contractor.lastGradeUpdate?.seconds ? 
                         new Date(contractor.lastGradeUpdate.seconds * 1000).toLocaleDateString() : 
                         "업데이트 없음")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => window.open(`/admin/contractors/${contractor.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredContractors.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">조건에 맞는 시공기사가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorGradeManagement; 