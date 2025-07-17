import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  Firestore
} from "firebase/firestore";

interface SettlementSummary {
  totalSales: number;
  totalWorkerPayments: number;
  totalPlatformFees: number;
  totalUrgentFees: number;
  totalWorkOrders: number;
  averageOrderValue: number;
}

interface Settlement {
  id: string;
  workOrderId: string;
  totalFee: number;
  workerPayment: number;
  platformFee: number;
  urgentFee: number;
  baseFee: number;
  paymentStatus: string;
  createdAt: any;
  completedAt: any;
  status: string;
  workerId?: string;
  workerName?: string;
  customerAddress?: string;
  description?: string;
}

type FilterPeriod = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export default function SellerSettlementDashboard() {
  const [summary, setSummary] = useState<SettlementSummary>({
    totalSales: 0,
    totalWorkerPayments: 0,
    totalPlatformFees: 0,
    totalUrgentFees: 0,
    totalWorkOrders: 0,
    averageOrderValue: 0,
  });

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = auth.onAuthStateChanged((user: any) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setSettlements([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!db || !userId) return;

    async function fetchSettlementData(): Promise<void> {
      try {
        setLoading(true);
        setError(null);

        // 기본 쿼리 - 판매자 ID로 필터링
        let q = query(
          collection(db as Firestore, "workOrders"),
          where("sellerId", "==", userId),
          orderBy("createdAt", "desc")
        );

        // 기간 필터 적용
        if (filterPeriod !== 'all') {
          const now = new Date();
          let startDate: Date | null = null;

          switch (filterPeriod) {
            case 'thisMonth':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'lastMonth':
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              break;
            case 'thisYear':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            case 'custom':
              startDate = new Date(selectedYear, selectedMonth - 1, 1);
              break;
            default:
              startDate = null;
          }

          if (startDate) {
            q = query(
              collection(db as Firestore, "workOrders"),
              where("sellerId", "==", userId),
              where("createdAt", ">=", Timestamp.fromDate(startDate)),
              orderBy("createdAt", "desc")
            );
          }
        }

        const snapshot = await getDocs(q);
        const settlementsData: Settlement[] = [];
        let totalSales = 0;
        let totalWorkerPayments = 0;
        let totalPlatformFees = 0;
        let totalUrgentFees = 0;
        let totalWorkOrders = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          const settlement: Settlement = {
            id: doc.id,
            workOrderId: doc.id,
            totalFee: data.paymentDetails?.totalFee || data.baseFee || 0,
            workerPayment: data.paymentDetails?.workerPayment || 0,
            platformFee: data.paymentDetails?.platformFee || 0,
            urgentFee: data.paymentDetails?.urgentFee || 0,
            baseFee: data.baseFee || 0,
            paymentStatus: data.paymentStatus || 'pending',
            createdAt: data.createdAt,
            completedAt: data.completedAt,
            status: data.status || 'pending',
            workerId: data.workerId,
            workerName: data.workerName,
            customerAddress: data.customerAddress,
            description: data.description
          };

          settlementsData.push(settlement);

          // 통계 계산
          if (settlement.paymentStatus === 'paid') {
            totalSales += settlement.totalFee;
            totalWorkerPayments += settlement.workerPayment;
            totalPlatformFees += settlement.platformFee;
            totalUrgentFees += settlement.urgentFee;
          }
          totalWorkOrders++;
        });

        setSettlements(settlementsData);
        setSummary({
          totalSales,
          totalWorkerPayments,
          totalPlatformFees,
          totalUrgentFees,
          totalWorkOrders,
          averageOrderValue: totalWorkOrders > 0 ? Math.round(totalSales / totalWorkOrders) : 0,
        });

      } catch (err: any) {
        console.error('정산 데이터 조회 실패:', err);
        setError('정산 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchSettlementData();
  }, [db, userId, filterPeriod, selectedYear, selectedMonth]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR');
      }
      return new Date(timestamp).toLocaleDateString('ko-KR');
    } catch (error) {
      return '-';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paid':
        return '결제완료';
      case 'pending':
        return '결제대기';
      case 'failed':
        return '결제실패';
      default:
        return status;
    }
  };

  const handlePeriodChange = (period: FilterPeriod): void => {
    setFilterPeriod(period);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">정산 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">정산 대시보드</h1>
          <p className="text-gray-600 mt-1">판매자 정산 현황 및 통계</p>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => handlePeriodChange('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filterPeriod === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => handlePeriodChange('thisMonth')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filterPeriod === 'thisMonth'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                이번 달
              </button>
              <button
                onClick={() => handlePeriodChange('lastMonth')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filterPeriod === 'lastMonth'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                지난 달
              </button>
              <button
                onClick={() => handlePeriodChange('thisYear')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filterPeriod === 'thisYear'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                올해
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setFilterPeriod('custom');
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(parseInt(e.target.value));
                  setFilterPeriod('custom');
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">총 매출</p>
                  <p className="text-3xl font-bold">{summary.totalSales.toLocaleString()}원</p>
                </div>
                <div className="text-green-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">기사 지급액</p>
                  <p className="text-3xl font-bold">{summary.totalWorkerPayments.toLocaleString()}원</p>
                </div>
                <div className="text-blue-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">플랫폼 수수료</p>
                  <p className="text-3xl font-bold">{summary.totalPlatformFees.toLocaleString()}원</p>
                </div>
                <div className="text-yellow-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">긴급 수수료</p>
                  <p className="text-3xl font-bold">{summary.totalUrgentFees.toLocaleString()}원</p>
                </div>
                <div className="text-purple-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">총 작업 건수</p>
                  <p className="text-3xl font-bold">{summary.totalWorkOrders}건</p>
                </div>
                <div className="text-indigo-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium">평균 주문 금액</p>
                  <p className="text-3xl font-bold">{summary.averageOrderValue.toLocaleString()}원</p>
                </div>
                <div className="text-pink-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">정산 내역</h2>
              <p className="text-gray-600 text-sm">총 {settlements.length}건의 작업</p>
            </div>

            {settlements.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500 text-lg">정산 내역이 없습니다.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업 ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 금액
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        기사 지급액
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        플랫폼 수수료
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        긴급 수수료
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제 상태
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업 상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settlements.map((settlement, index) => (
                      <tr key={settlement.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {settlement.workOrderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(settlement.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                          {settlement.totalFee.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {settlement.workerPayment.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {settlement.platformFee.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {settlement.urgentFee.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(settlement.paymentStatus)}`}>
                            {getStatusText(settlement.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(settlement.status)}`}>
                            {getStatusText(settlement.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 