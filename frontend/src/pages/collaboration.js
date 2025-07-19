import { useState } from 'react';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import CollaborationRequestList from '../components/CollaborationRequestList';
import MyCollaborationRequests from '../components/MyCollaborationRequests';
import { useAuth } from '../hooks/useAuth';

export default function CollaborationPage() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-requests' | 'my-collaborations'

  // 시공자가 아니면 접근 제한
  if (!user || !hasRole('contractor')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="협업 관리" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">접근 제한</h3>
                <p className="text-sm text-red-700 mt-1">
                  시공자만 협업 관리 페이지에 접근할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>협업 관리 - 커튼 설치 플랫폼</title>
        <meta name="description" content="시공자 협업요청 관리 및 협업 진행 상황을 확인하세요." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navigation title="협업 관리" />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white border rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'available'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🤝 협업요청 목록
                </button>
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📝 내가 요청한 협업
                </button>
                <button
                  onClick={() => setActiveTab('my-collaborations')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'my-collaborations'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ✅ 내가 수락한 협업
                </button>
              </nav>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="bg-white border rounded-lg shadow-sm">
            {activeTab === 'available' && (
              <div className="p-6">
                <CollaborationRequestList />
              </div>
            )}

            {activeTab === 'my-requests' && (
              <div className="p-6">
                <MyCollaborationRequests />
              </div>
            )}

            {activeTab === 'my-collaborations' && (
              <div className="p-6">
                <MyCollaborationRequests />
              </div>
            )}
          </div>

          {/* 협업 가이드 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🤝 협업 시스템 가이드</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">협업요청 생성</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 수락한 시공요청에서 "협업요청" 버튼 클릭</li>
                  <li>• 업무를 분배하고 각 업무별 금액 설정</li>
                  <li>• 총 금액이 원본 금액과 일치해야 함</li>
                  <li>• 협업자들에게 메모 작성 가능</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">협업요청 수락</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 협업요청 목록에서 원하는 업무 확인</li>
                  <li>• 본인에게 맞는 업무 선택 후 수락</li>
                  <li>• 여러 업무를 동시에 수락 가능</li>
                  <li>• 수락한 업무에 대한 금액 확인</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">협업 진행</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 모든 업무가 수락되면 협업 시작 가능</li>
                  <li>• 협업 진행 중에는 취소 불가</li>
                  <li>• 각자 담당 업무 완료 후 협업 완료</li>
                  <li>• 협업 완료 시 원본 시공요청도 완료됨</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">주의사항</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 협업요청은 신중하게 생성하세요</li>
                  <li>• 수락한 업무는 반드시 완료해야 합니다</li>
                  <li>• 협업자들과 원활한 소통이 중요합니다</li>
                  <li>• 문제 발생 시 즉시 요청자에게 연락하세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 