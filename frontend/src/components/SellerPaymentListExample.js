import React, { useState } from 'react';
import SellerPaymentList from './SellerPaymentList';

export default function SellerPaymentListExample() {
  const [activeTab, setActiveTab] = useState('payments');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">판매자 대시보드</h1>
              <p className="mt-1 text-sm text-gray-600">
                결제 내역과 작업 현황을 확인하세요
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                결제 내역
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                대시보드
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'payments' ? (
            <div>
              <SellerPaymentList />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">판매자 대시보드</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 통계 카드들 */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">총 결제액</p>
                      <p className="text-2xl font-semibold text-blue-900">0원</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">완료된 작업</p>
                      <p className="text-2xl font-semibold text-green-900">0건</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">진행중인 작업</p>
                      <p className="text-2xl font-semibold text-yellow-900">0건</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 최근 활동 */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500 text-center">아직 활동 내역이 없습니다.</p>
                </div>
              </div>

              {/* 빠른 액션 */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 액션</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    새 작업 요청하기
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                    견적서 작성하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 