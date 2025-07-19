import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Navigation from '../../components/Navigation';

export default function EstimateListPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let q;
    
    try {
      if (statusFilter) {
        q = query(
          collection(db, 'estimates'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'estimates'),
          orderBy('createdAt', 'desc')
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setEstimates(list);
        setLoading(false);
        setError('');
      }, (error) => {
        console.error('견적 목록 조회 오류:', error);
        setError('견적 목록을 불러오는데 실패했습니다.');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('쿼리 오류:', error);
      setError('쿼리 생성 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [statusFilter]);

  const handleEstimateClick = (estimate) => {
    router.push(`/estimate/${estimate.id}`);
  };

  const handleCreateNew = () => {
    router.push('/estimate/new');
  };

  const formatDate = (date) => {
    if (!date) return '날짜 없음';
    
    try {
      if (date.toDate) {
        return date.toDate().toLocaleDateString('ko-KR');
      } else if (date instanceof Date) {
        return date.toLocaleDateString('ko-KR');
      } else {
        return new Date(date).toLocaleDateString('ko-KR');
      }
    } catch (error) {
      return '날짜 오류';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">대기중</span>;
      case 'accepted':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">승인됨</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">거절됨</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">완료됨</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const filteredEstimates = estimates.filter(estimate => 
    estimate.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.customerPhone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="견적서 목록" />
        <div className="max-w-6xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">견적 목록을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="견적서 목록" />
        <div className="max-w-6xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="견적서 목록" />
      
      <div className="max-w-6xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">견적서 목록</h2>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              새 견적서 작성
            </button>
          </div>

          {/* 필터 및 검색 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <input
                type="text"
                placeholder="고객명 또는 연락처로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 필터
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">전체</option>
                <option value="pending">대기중</option>
                <option value="accepted">승인됨</option>
                <option value="rejected">거절됨</option>
                <option value="completed">완료됨</option>
              </select>
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {estimates.filter(e => e.status === 'pending').length}
              </div>
              <div className="text-sm text-blue-700">대기중</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {estimates.filter(e => e.status === 'accepted').length}
              </div>
              <div className="text-sm text-green-700">승인됨</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {estimates.filter(e => e.status === 'rejected').length}
              </div>
              <div className="text-sm text-red-700">거절됨</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {estimates.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-purple-700">완료됨</div>
            </div>
          </div>

          {/* 견적서 목록 */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left font-semibold">고객명</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">연락처</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">견적 금액</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">상태</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">작성일</th>
                  <th className="border border-gray-300 p-3 text-left font-semibold">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">
                      {searchTerm || statusFilter ? '검색 결과가 없습니다.' : '등록된 견적서가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredEstimates.map((estimate) => (
                    <tr key={estimate.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 p-3">
                        <div className="font-medium text-gray-900">{estimate.customerName || '미입력'}</div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <div className="text-gray-900">{estimate.customerPhone || '미입력'}</div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <div className="font-semibold text-gray-900">
                          {estimate.total ? `${estimate.total.toLocaleString()}원` : '미정'}
                        </div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        {getStatusBadge(estimate.status)}
                      </td>
                      <td className="border border-gray-300 p-3">
                        <div className="text-gray-900">{formatDate(estimate.createdAt)}</div>
                      </td>
                      <td className="border border-gray-300 p-3">
                        <button
                          onClick={() => handleEstimateClick(estimate)}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 결과 요약 */}
          <div className="mt-4 text-sm text-gray-600">
            총 {filteredEstimates.length}건의 견적서가 있습니다.
            {searchTerm && ` (검색어: "${searchTerm}")`}
            {statusFilter && ` (상태: "${statusFilter}")`}
          </div>
        </div>
      </div>
    </div>
  );
} 