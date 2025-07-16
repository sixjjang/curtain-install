import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getGradeStyle } from '../utils/gradeCalculator';

const functions = getFunctions();

const GradeUpdateManager = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [updateResults, setUpdateResults] = useState(null);
  const [filters, setFilters] = useState({
    active: true,
    grade: '',
    minEvaluations: 0
  });

  // Firebase Functions
  const updateContractorGrade = httpsCallable(functions, 'updateContractorGrade');
  const batchUpdateContractorGrades = httpsCallable(functions, 'batchUpdateContractorGrades');
  const updateGradesByFilter = httpsCallable(functions, 'updateGradesByFilter');

  useEffect(() => {
    fetchContractors();
  }, [filters]);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const contractorsRef = collection(db, 'contractors');
      let q = contractorsRef;

      // Apply filters
      if (filters.active !== undefined) {
        q = query(q, where('active', '==', filters.active));
      }
      if (filters.grade) {
        q = query(q, where('grade', '==', filters.grade));
      }
      if (filters.minEvaluations > 0) {
        q = query(q, where('totalRatings', '>=', filters.minEvaluations));
      }

      q = query(q, orderBy('lastGradeUpdate', 'desc'), limit(50));
      
      const snapshot = await getDocs(q);
      const contractorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setContractors(contractorsData);
    } catch (error) {
      console.error('시공기사 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleUpdate = async (contractorId) => {
    try {
      setLoading(true);
      const result = await updateContractorGrade({ 
        contractorId, 
        options: { 
          sendNotification: true, 
          logChanges: true 
        } 
      });
      
      setUpdateResults({
        type: 'single',
        data: result.data
      });

      // Refresh contractor list
      await fetchContractors();
      
    } catch (error) {
      console.error('등급 업데이트 오류:', error);
      setUpdateResults({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedContractors.length === 0) {
      alert('업데이트할 시공기사를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const result = await batchUpdateContractorGrades({
        contractorIds: selectedContractors,
        options: {
          sendNotification: true,
          logChanges: true
        }
      });
      
      setUpdateResults({
        type: 'batch',
        data: result.data
      });

      setSelectedContractors([]);
      await fetchContractors();
      
    } catch (error) {
      console.error('배치 업데이트 오류:', error);
      setUpdateResults({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterUpdate = async () => {
    try {
      setLoading(true);
      const result = await updateGradesByFilter({
        filters,
        options: {
          sendNotification: true,
          logChanges: true
        }
      });
      
      setUpdateResults({
        type: 'filter',
        data: result.data
      });

      await fetchContractors();
      
    } catch (error) {
      console.error('필터 업데이트 오류:', error);
      setUpdateResults({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
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
    if (selectedContractors.length === contractors.length) {
      setSelectedContractors([]);
    } else {
      setSelectedContractors(contractors.map(c => c.id));
    }
  };

  const getGradeChangeIndicator = (oldGrade, newGrade) => {
    if (oldGrade === newGrade) return null;
    
    const isUpgrade = ['A', 'B', 'C', 'D'].indexOf(newGrade) < ['A', 'B', 'C', 'D'].indexOf(oldGrade);
    
    return (
      <span className={`text-xs px-2 py-1 rounded ${
        isUpgrade 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isUpgrade ? '↑' : '↓'} {oldGrade}→{newGrade}
      </span>
    );
  };

  if (loading && contractors.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">시공기사 등급 관리</h2>
        <p className="text-gray-600">
          평가 데이터를 기반으로 시공기사의 등급을 자동으로 업데이트합니다.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">필터 설정</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">활성 상태</label>
            <select
              value={filters.active}
              onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value === 'true' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={true}>활성</option>
              <option value={false}>비활성</option>
              <option value="">전체</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전체</option>
              <option value="A">A등급</option>
              <option value="B">B등급</option>
              <option value="C">C등급</option>
              <option value="D">D등급</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 평가 수</label>
            <input
              type="number"
              min="0"
              value={filters.minEvaluations}
              onChange={(e) => setFilters(prev => ({ ...prev, minEvaluations: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleFilterUpdate}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              필터 적용 업데이트
            </button>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">배치 작업</h3>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {selectedContractors.length === contractors.length ? '전체 해제' : '전체 선택'}
            </button>
            <button
              onClick={handleBatchUpdate}
              disabled={selectedContractors.length === 0 || loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
            >
              선택된 시공기사 업데이트 ({selectedContractors.length}명)
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {updateResults && (
        <div className={`rounded-lg p-4 border ${
          updateResults.type === 'error' 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <h4 className="font-semibold mb-2">
            {updateResults.type === 'error' ? '오류 발생' : '업데이트 완료'}
          </h4>
          
          {updateResults.type === 'error' ? (
            <p className="text-red-700">{updateResults.message}</p>
          ) : (
            <div className="text-sm">
              {updateResults.type === 'batch' && (
                <div className="space-y-1">
                  <p>전체: {updateResults.data.total}명</p>
                  <p>성공: {updateResults.data.successful}명</p>
                  <p>실패: {updateResults.data.failed}명</p>
                  <p>등급 변경: {updateResults.data.gradeChanges}명</p>
                </div>
              )}
              {updateResults.type === 'single' && (
                <div>
                  <p>시공기사: {updateResults.data.contractorId}</p>
                  <p>등급 변경: {updateResults.data.oldGrade} → {updateResults.data.newGrade}</p>
                  <p>평균 평점: {updateResults.data.averageRating}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contractors List */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          시공기사 목록 ({contractors.length}명)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">
                  <input
                    type="checkbox"
                    checked={selectedContractors.length === contractors.length && contractors.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left py-2">이름</th>
                <th className="text-left py-2">현재 등급</th>
                <th className="text-left py-2">평균 평점</th>
                <th className="text-left py-2">평가 수</th>
                <th className="text-left py-2">마지막 업데이트</th>
                <th className="text-left py-2">작업</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => {
                const gradeStyle = getGradeStyle(contractor.grade || 'C');
                const isSelected = selectedContractors.includes(contractor.id);
                
                return (
                  <tr key={contractor.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleContractorSelect(contractor.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-2">
                      <div className="font-medium">{contractor.profile?.name || contractor.name || '이름 없음'}</div>
                      <div className="text-sm text-gray-500">{contractor.id}</div>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${gradeStyle.bgColor} ${gradeStyle.color}`}>
                        {contractor.grade || 'C'}등급
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="font-medium">{contractor.averageRating?.toFixed(1) || '0.0'}</div>
                      <div className="text-sm text-gray-500">/ 5.0</div>
                    </td>
                    <td className="py-2">
                      {contractor.totalRatings || 0}건
                    </td>
                    <td className="py-2">
                      <div className="text-sm text-gray-600">
                        {contractor.lastGradeUpdate?.toDate?.().toLocaleDateString() || '없음'}
                      </div>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleSingleUpdate(contractor.id)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                      >
                        업데이트
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GradeUpdateManager; 