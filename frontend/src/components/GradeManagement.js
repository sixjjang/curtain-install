import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, where, orderBy, writeBatch } from "firebase/firestore";

const firestore = getFirestore();

const GradeManagement = () => {
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [newGrade, setNewGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterGrade, setFilterGrade] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [bulkGrade, setBulkGrade] = useState("");
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // 5단계 등급 시스템
  const gradeSystem = {
    1: { name: '브론즈', color: 'bg-gray-500', description: '기본 서비스 제공' },
    2: { name: '실버', color: 'bg-blue-500', description: '우선 매칭, 기본 혜택' },
    3: { name: '골드', color: 'bg-yellow-500', description: '프리미엄 매칭, 추가 혜택' },
    4: { name: '플래티넘', color: 'bg-purple-500', description: 'VIP 매칭, 특별 혜택' },
    5: { name: '다이아몬드', color: 'bg-yellow-400', description: '최고 등급, 모든 혜택' }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contractorsQuery = query(
        collection(firestore, "contractors"),
        orderBy("name", "asc")
      );
      
      const snapshot = await getDocs(contractorsQuery);
      const contractorsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setContractors(contractorsData);
    } catch (error) {
      console.error("Error fetching contractors:", error);
      setError("계약자 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const changeGrade = async () => {
    if (!selectedContractor || !newGrade) {
      setError("계약자와 등급을 선택해주세요.");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const contractorRef = doc(firestore, "contractors", selectedContractor.id);
      const previousGrade = selectedContractor.level || selectedContractor.grade || null;

      // 계약자 등급 업데이트
      await updateDoc(contractorRef, { 
        level: parseInt(newGrade),
        lastGradeUpdate: new Date(),
        previousGrade: previousGrade
      });

      // 등급 변경 히스토리 기록
      await addDoc(collection(firestore, "gradeChangeHistory"), {
        contractorId: selectedContractor.id,
        contractorName: selectedContractor.name || selectedContractor.displayName,
        previousGrade: previousGrade,
        newGrade: parseInt(newGrade),
        previousGradeName: previousGrade ? gradeSystem[previousGrade]?.name : '없음',
        newGradeName: gradeSystem[newGrade]?.name,
        changedAt: new Date(),
        changedBy: "admin", // 실제 구현시 현재 로그인한 관리자 ID로 교체
        reason: "관리자 수동 변경",
        notes: ""
      });

      // 성공 메시지
      setSuccess(`${selectedContractor.name || selectedContractor.displayName}님의 등급이 ${gradeSystem[newGrade]?.name}로 변경되었습니다.`);
      
      // 상태 초기화
      setNewGrade("");
      setSelectedContractor(null);
      
      // 목록 새로고침
      await fetchContractors();

    } catch (error) {
      console.error("Error changing grade:", error);
      setError("등급 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  const bulkUpdateGrades = async () => {
    if (selectedContractors.length === 0 || !bulkGrade) {
      setError("계약자와 등급을 선택해주세요.");
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const batch = writeBatch(firestore);
      const historyPromises = [];

      for (const contractorId of selectedContractors) {
        const contractor = contractors.find(c => c.id === contractorId);
        if (!contractor) continue;

        const contractorRef = doc(firestore, "contractors", contractorId);
        const previousGrade = contractor.level || contractor.grade || null;

        // 계약자 등급 업데이트
        batch.update(contractorRef, {
          level: parseInt(bulkGrade),
          lastGradeUpdate: new Date(),
          previousGrade: previousGrade
        });

        // 히스토리 기록을 위한 Promise 생성
        const historyPromise = addDoc(collection(firestore, "gradeChangeHistory"), {
          contractorId: contractorId,
          contractorName: contractor.name || contractor.displayName,
          previousGrade: previousGrade,
          newGrade: parseInt(bulkGrade),
          previousGradeName: previousGrade ? gradeSystem[previousGrade]?.name : '없음',
          newGradeName: gradeSystem[bulkGrade]?.name,
          changedAt: new Date(),
          changedBy: "admin",
          reason: "관리자 일괄 변경",
          notes: `일괄 변경 (${selectedContractors.length}명)`
        });

        historyPromises.push(historyPromise);
      }

      // 배치 커밋
      await batch.commit();
      
      // 히스토리 기록
      await Promise.all(historyPromises);

      setSuccess(`${selectedContractors.length}명의 계약자 등급이 ${gradeSystem[bulkGrade]?.name}로 일괄 변경되었습니다.`);
      
      // 상태 초기화
      setSelectedContractors([]);
      setBulkGrade("");
      setShowBulkUpdate(false);
      
      // 목록 새로고침
      await fetchContractors();

    } catch (error) {
      console.error("Error bulk updating grades:", error);
      setError("일괄 등급 변경 중 오류가 발생했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  const handleContractorSelect = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    setSelectedContractor(contractor);
    setNewGrade(contractor?.level?.toString() || "");
  };

  const handleBulkSelect = (contractorId) => {
    setSelectedContractors(prev => 
      prev.includes(contractorId) 
        ? prev.filter(id => id !== contractorId)
        : [...prev, contractorId]
    );
  };

  const handleSelectAll = () => {
    const filteredContractors = getFilteredContractors();
    setSelectedContractors(filteredContractors.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedContractors([]);
  };

  const getFilteredContractors = () => {
    return contractors.filter(contractor => {
      const matchesSearch = contractor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contractor.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = !filterGrade || contractor.level?.toString() === filterGrade;
      return matchesSearch && matchesGrade;
    });
  };

  const getGradeStatistics = () => {
    const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, none: 0 };
    contractors.forEach(contractor => {
      const grade = contractor.level || contractor.grade;
      if (grade && stats.hasOwnProperty(grade)) {
        stats[grade]++;
      } else {
        stats.none++;
      }
    });
    return stats;
  };

  const gradeStats = getGradeStatistics();
  const filteredContractors = getFilteredContractors();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">계약자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시공기사 등급 관리</h1>
          <p className="text-gray-600">계약자의 등급을 관리하고 변경할 수 있습니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {Object.entries(gradeStats).map(([grade, count]) => (
            <div key={grade} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold ${
                grade === 'none' ? 'text-gray-600' : gradeSystem[grade]?.color.replace('bg-', 'text-')
              }`}>
                {count}
              </div>
              <div className="text-sm text-gray-600">
                {grade === 'none' ? '등급 없음' : gradeSystem[grade]?.name}
              </div>
            </div>
          ))}
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="계약자 이름으로 검색"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">등급 필터</label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 등급</option>
                {Object.entries(gradeSystem).map(([grade, info]) => (
                  <option key={grade} value={grade}>{info.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowBulkUpdate(!showBulkUpdate)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                {showBulkUpdate ? '개별 변경' : '일괄 변경'}
              </button>
              <button
                onClick={fetchContractors}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>

          {/* 결과 수 표시 */}
          <p className="text-sm text-gray-600">
            총 {filteredContractors.length}명의 계약자가 표시됩니다.
          </p>
        </div>

        {/* 에러 및 성공 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400 mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-green-400 mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* 일괄 변경 섹션 */}
        {showBulkUpdate && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">일괄 등급 변경</h3>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                전체 선택
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                전체 해제
              </button>
              <span className="text-sm text-gray-600">
                {selectedContractors.length}명 선택됨
              </span>
            </div>
            <div className="flex gap-4">
              <select
                value={bulkGrade}
                onChange={(e) => setBulkGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">등급 선택</option>
                {Object.entries(gradeSystem).map(([grade, info]) => (
                  <option key={grade} value={grade}>{info.name}</option>
                ))}
              </select>
              <button
                onClick={bulkUpdateGrades}
                disabled={updating || selectedContractors.length === 0 || !bulkGrade}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? '변경 중...' : '일괄 변경'}
              </button>
            </div>
          </div>
        )}

        {/* 계약자 목록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {showBulkUpdate && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선택
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재 등급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평점
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    완료 작업
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등급 변경
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContractors.map((contractor) => (
                  <tr key={contractor.id} className="hover:bg-gray-50">
                    {showBulkUpdate && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContractors.includes(contractor.id)}
                          onChange={() => handleBulkSelect(contractor.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contractor.name || contractor.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{contractor.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contractor.level ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${gradeSystem[contractor.level]?.color}`}>
                          {gradeSystem[contractor.level]?.name}
                        </span>
                      ) : (
                        <span className="text-gray-500">등급 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.reviewStats?.averageRating ? 
                        `${contractor.reviewStats.averageRating.toFixed(1)}점 (${contractor.reviewStats.totalReviews || 0}건)` : 
                        '평가 없음'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contractor.completedJobsCount || 0}건
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!showBulkUpdate && (
                        <select
                          value={selectedContractor?.id === contractor.id ? newGrade : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleContractorSelect(contractor.id);
                              setNewGrade(e.target.value);
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">등급 선택</option>
                          {Object.entries(gradeSystem).map(([grade, info]) => (
                            <option key={grade} value={grade}>{info.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 개별 변경 버튼 */}
        {!showBulkUpdate && selectedContractor && newGrade && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-blue-900">
                  등급 변경 확인
                </h4>
                <p className="text-blue-700">
                  {selectedContractor.name || selectedContractor.displayName}님의 등급을{' '}
                  {selectedContractor.level ? gradeSystem[selectedContractor.level]?.name : '등급 없음'}에서{' '}
                  {gradeSystem[newGrade]?.name}로 변경하시겠습니까?
                </p>
              </div>
              <button
                onClick={changeGrade}
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? '변경 중...' : '등급 변경'}
              </button>
            </div>
          </div>
        )}

        {/* 등급 시스템 안내 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">등급 시스템 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(gradeSystem).map(([grade, info]) => (
              <div key={grade} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${info.color} mb-2`}>
                  {info.name}
                </div>
                <p className="text-xs text-yellow-800">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeManagement; 