import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEstimatesBySeller } from "../utils/fetchEstimatesBySeller";

interface Estimate {
  id: string;
  sellerId: string;
  items: Array<{
    name: string;
    description: string;
    amount: number;
  }>;
  total: number;
  customerName?: string;
  customerPhone?: string;
  projectDescription?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  assigned: boolean;
  assignedTo?: string;
  assignedAt?: any;
  createdAt: any;
  updatedAt: any;
  itemCount: number;
  currency: string;
  version: string;
}

interface Stats {
  total: number;
  assigned: number;
  unassigned: number;
  totalAmount: number;
}

type FilterType = 'all' | 'assigned' | 'unassigned';

export default function EstimateListPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const sellerId = "abcd1234"; // 추후 로그인 연동

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEstimatesBySeller(sellerId);
        setEstimates(data);
      } catch (err) {
        console.error('견적 목록 로드 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sellerId]);

  // 필터링된 견적 목록
  const filteredEstimates = estimates.filter(estimate => {
    switch (filter) {
      case 'assigned':
        return estimate.assigned;
      case 'unassigned':
        return !estimate.assigned;
      default:
        return true;
    }
  });

  // 통계 계산
  const stats: Stats = {
    total: estimates.length,
    assigned: estimates.filter(e => e.assigned).length,
    unassigned: estimates.filter(e => !e.assigned).length,
    totalAmount: estimates.reduce((sum, e) => sum + e.total, 0)
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '날짜 없음';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusBadge = (assigned: boolean) => {
    return assigned ? (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
        배정 완료
      </span>
    ) : (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
        미배정
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">견적 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">견적 목록 로드 실패</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">견적 관리</h1>
          <p className="text-gray-600 mt-2">생성된 견적 목록을 확인하고 관리하세요</p>
        </div>
        <Link href="/estimate/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            새 견적 생성
          </button>
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 견적</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">배정 완료</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">미배정</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 금액</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">필터:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 ({stats.total})</option>
              <option value="assigned">배정 완료 ({stats.assigned})</option>
              <option value="unassigned">미배정 ({stats.unassigned})</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredEstimates.length}개 견적 표시
          </div>
        </div>
      </div>

      {/* 견적 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  견적 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  총액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">견적이 없습니다</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {filter === 'all' ? '새로운 견적을 생성해보세요.' : '해당 조건의 견적이 없습니다.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          견적 #{estimate.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(estimate.createdAt)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estimate.itemCount}개 항목
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {estimate.customerName || '미입력'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estimate.customerPhone || '연락처 없음'}
                        </div>
                        {estimate.assigned && estimate.assignedTo && (
                          <div className="text-sm text-purple-600">
                            할당: {estimate.assignedTo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(estimate.total)}원
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(estimate.assigned)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link href={`/estimate/${estimate.id}`}>
                          <span className="text-blue-600 hover:text-blue-900 cursor-pointer">
                            보기
                          </span>
                        </Link>
                        {!estimate.assigned && (
                          <>
                            <Link href={`/estimate/edit/${estimate.id}`}>
                              <span className="text-green-600 hover:text-green-900 cursor-pointer">
                                수정
                              </span>
                            </Link>
                            <Link href={`/estimate/assign/${estimate.id}`}>
                              <span className="text-purple-600 hover:text-purple-900 cursor-pointer">
                                배정
                              </span>
                            </Link>
                          </>
                        )}
                        {!estimate.assigned && (
                          <Link href={`/estimate/delete/${estimate.id}`}>
                            <span className="text-red-600 hover:text-red-900 cursor-pointer">
                              삭제
                            </span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 