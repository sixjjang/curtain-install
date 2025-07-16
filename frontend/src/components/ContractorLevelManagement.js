import { useEffect, useState } from "react";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firestore = getFirestore();
const functions = getFunctions();

const ContractorLevelManagement = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    level: "",
    minRating: "",
    searchTerm: ""
  });
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // 등급별 정보
  const gradeInfo = {
    1: { name: '브론즈', color: 'bg-gray-100 text-gray-800', description: '기본 서비스' },
    2: { name: '실버', color: 'bg-blue-100 text-blue-800', description: '우선 매칭' },
    3: { name: '골드', color: 'bg-green-100 text-green-800', description: '프리미엄 매칭' },
    4: { name: '플래티넘', color: 'bg-purple-100 text-purple-800', description: 'VIP 매칭' },
    5: { name: '다이아몬드', color: 'bg-yellow-100 text-yellow-800', description: '최고 등급' }
  };

  useEffect(() => {
    fetchContractors();
    fetchStatistics();
  }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(firestore, "contractors"));
      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({ 
          id: doc.id, 
          ...data,
          // 기본값 설정
          level: data.level || 1,
          rating: data.rating || 0,
          completedJobsCount: data.completedJobsCount || 0,
          photoQualityScore: data.photoQualityScore || 0,
          responseTime: data.responseTime || 120,
          onTimeRate: data.onTimeRate || 0,
          satisfactionRate: data.satisfactionRate || 0,
          weightedScore: data.weightedScore || 0
        });
      });
      
      // 가중 점수로 정렬
      list.sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));
      setContractors(list);
    } catch (error) {
      console.error("계약자 데이터 로딩 오류:", error);
      alert("계약자 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const getStatistics = httpsCallable(functions, 'getContractorGradeStatistics');
      const result = await getStatistics();
      setStatistics(result.data);
    } catch (error) {
      console.error("통계 데이터 로딩 오류:", error);
    }
  };

  const updateLevel = async (id, newLevel) => {
    try {
      setUpdating(prev => ({ ...prev, [id]: true }));
      
      // Firebase Cloud Function 사용
      const manualUpdate = httpsCallable(functions, 'manualUpdateContractorLevel');
      await manualUpdate({ contractorId: id });
      
      // 로컬 상태 업데이트
      setContractors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, level: newLevel } : c))
      );
      
      // 통계 새로고침
      await fetchStatistics();
      
      alert("등급이 성공적으로 업데이트되었습니다.");
    } catch (error) {
      console.error("등급 업데이트 오류:", error);
      alert("업데이트 중 오류가 발생했습니다: " + error.message);
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const batchUpdateLevels = async (newLevel) => {
    if (selectedContractors.length === 0) {
      alert("선택된 계약자가 없습니다.");
      return;
    }

    if (!confirm(`${selectedContractors.length}명의 계약자 등급을 ${gradeInfo[newLevel].name}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const batchUpdate = httpsCallable(functions, 'batchUpdateContractorLevels');
      const result = await batchUpdate({ 
        contractorIds: selectedContractors,
        filters: filters
      });
      
      if (result.data.success) {
        alert(`배치 업데이트 완료: ${result.data.totalProcessed}명 처리됨`);
        await fetchContractors();
        await fetchStatistics();
        setSelectedContractors([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error("배치 업데이트 오류:", error);
      alert("배치 업데이트 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleContractorSelect = (contractorId) => {
    setSelectedContractors(prev => 
      prev.includes(contractorId)
        ? prev.filter(id => id !== contractorId)
        : [...prev, contractorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContractors.length === filteredContractors.length) {
      setSelectedContractors([]);
    } else {
      setSelectedContractors(filteredContractors.map(c => c.id));
    }
  };

  // 필터링된 계약자 목록
  const filteredContractors = contractors.filter(contractor => {
    const matchesLevel = !filters.level || contractor.level === parseInt(filters.level);
    const matchesRating = !filters.minRating || contractor.rating >= parseFloat(filters.minRating);
    const matchesSearch = !filters.searchTerm || 
      contractor.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      contractor.email?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    return matchesLevel && matchesRating && matchesSearch;
  });

  const getGradeColor = (level) => {
    return gradeInfo[level]?.color || 'bg-gray-100 text-gray-800';
  };

  const getGradeName = (level) => {
    return gradeInfo[level]?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">계약자 데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            시공기사 등급 관리
          </h1>
          <p className="text-gray-600">
            계약자의 성과를 기반으로 등급을 관리하고 모니터링합니다.
          </p>
        </div>

        {/* 통계 카드 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">총 계약자</h3>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.statistics.totalContractors}
              </p>
            </div>
            {Object.entries(statistics.statistics.gradeDistribution).map(([level, count]) => (
              <div key={level} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">
                  {getGradeName(parseInt(level))}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">
                  {statistics.statistics.gradePercentages[level]}%
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                등급별 필터
              </label>
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">모든 등급</option>
                {Object.entries(gradeInfo).map(([level, info]) => (
                  <option key={level} value={level}>
                    {level} - {info.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 평점
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value }))}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="이름 또는 이메일"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ level: "", minRating: "", searchTerm: "" })}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 배치 액션 */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  배치 등급 변경
                </h3>
                <p className="text-blue-700">
                  {selectedContractors.length}명의 계약자가 선택되었습니다.
                </p>
              </div>
              <div className="flex gap-2">
                {Object.entries(gradeInfo).map(([level, info]) => (
                  <button
                    key={level}
                    onClick={() => batchUpdateLevels(parseInt(level))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {info.name}로 변경
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedContractors([]);
                    setShowBulkActions(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 계약자 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                계약자 목록 ({filteredContractors.length}명)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {selectedContractors.length === filteredContractors.length ? '전체 해제' : '전체 선택'}
                </button>
                <button
                  onClick={() => setShowBulkActions(true)}
                  disabled={selectedContractors.length === 0}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  배치 변경
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedContractors.length === filteredContractors.length && filteredContractors.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가중 점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료 건수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사진 품질
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    응답 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간 준수율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등급 변경
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContractors.map((contractor) => (
                  <tr key={contractor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedContractors.includes(contractor.id)}
                        onChange={() => handleContractorSelect(contractor.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contractor.name || '이름 없음'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contractor.email || '이메일 없음'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(contractor.level)}`}>
                        {contractor.level} - {getGradeName(contractor.level)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.weightedScore?.toFixed(1) || '0.0'}점
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.rating?.toFixed(2) || '0.00'} / 5.0
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.completedJobsCount || 0}건
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.photoQualityScore?.toFixed(1) || '0.0'} / 10.0
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.responseTime || 120}분
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.onTimeRate || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={contractor.level}
                        onChange={(e) => updateLevel(contractor.id, Number(e.target.value))}
                        disabled={updating[contractor.id]}
                        className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      >
                        {Object.entries(gradeInfo).map(([level, info]) => (
                          <option key={level} value={level}>
                            {level} - {info.name}
                          </option>
                        ))}
                      </select>
                      {updating[contractor.id] && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContractors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">조건에 맞는 계약자가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 개별 등급 변경:</strong> 각 계약자의 등급 드롭다운에서 선택하여 변경</p>
            <p><strong>• 배치 등급 변경:</strong> 체크박스로 여러 계약자 선택 후 "배치 변경" 버튼 사용</p>
            <p><strong>• 필터링:</strong> 등급, 최소 평점, 검색어로 계약자 목록 필터링</p>
            <p><strong>• 통계 확인:</strong> 상단 카드에서 전체 등급 분포 및 통계 확인</p>
            <p><strong>• 자동 업데이트:</strong> 평점 변경 시 자동으로 등급이 재계산됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorLevelManagement; 