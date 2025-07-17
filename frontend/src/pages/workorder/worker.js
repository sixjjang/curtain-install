import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Navigation from '../../components/Navigation';

export default function WorkerPage() {
  const router = useRouter();
  const auth = getAuth();
  
  const [user, setUser] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 사용자 정보 가져오기
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            if (userData.userType !== 'worker') {
              alert('시공기사만 접근할 수 있습니다.');
              router.push('/login');
              return;
            }
            setUser({ ...user, ...userData });
            
            // 작업 목록 가져오기
            await loadWorkOrders();
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          setError('사용자 정보를 불러오는데 실패했습니다.');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  const loadWorkOrders = async () => {
    try {
      const workOrdersQuery = query(
        collection(db, 'workOrders'),
        where('status', 'in', ['pending', 'assigned', 'in_progress'])
      );
      
      const querySnapshot = await getDocs(workOrdersQuery);
      const orders = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setWorkOrders(orders);
    } catch (error) {
      console.error('작업 목록 조회 오류:', error);
      setError('작업 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleAcceptWork = async (workOrderId) => {
    try {
      await updateDoc(doc(db, 'workOrders', workOrderId), {
        status: 'assigned',
        assignedWorkerId: user.uid,
        assignedWorkerName: user.name,
        assignedAt: new Date()
      });
      
      alert('작업을 수락했습니다!');
      await loadWorkOrders();
    } catch (error) {
      console.error('작업 수락 오류:', error);
      alert('작업 수락에 실패했습니다.');
    }
  };

  const handleStartWork = async (workOrderId) => {
    try {
      await updateDoc(doc(db, 'workOrders', workOrderId), {
        status: 'in_progress',
        startedAt: new Date()
      });
      
      alert('작업을 시작했습니다!');
      await loadWorkOrders();
    } catch (error) {
      console.error('작업 시작 오류:', error);
      alert('작업 시작에 실패했습니다.');
    }
  };

  const handleCompleteWork = async (workOrderId) => {
    try {
      await updateDoc(doc(db, 'workOrders', workOrderId), {
        status: 'completed',
        completedAt: new Date()
      });
      
      alert('작업을 완료했습니다!');
      await loadWorkOrders();
    } catch (error) {
      console.error('작업 완료 오류:', error);
      alert('작업 완료에 실패했습니다.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">대기중</span>;
      case 'assigned':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">배정됨</span>;
      case 'in_progress':
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">진행중</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">완료</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공기사 대시보드" />
      
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">시공기사 대시보드</h1>
              <p className="text-gray-600 mt-1">안녕하세요, {user.name}님!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">소속: {user.companyName || '개인'}</p>
              <p className="text-sm text-gray-600">자격증: {user.licenseNumber}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 작업 목록 */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">작업 목록</h2>
            <p className="text-sm text-gray-600 mt-1">배정된 작업과 대기 중인 작업을 확인하세요</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {workOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">작업이 없습니다</h3>
                <p className="text-gray-600">현재 배정된 작업이나 대기 중인 작업이 없습니다.</p>
              </div>
            ) : (
              workOrders.map((workOrder) => (
                <div key={workOrder.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {workOrder.customerName}님의 커튼 설치
                        </h3>
                        {getStatusBadge(workOrder.status)}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <p><span className="font-medium">주소:</span> {workOrder.address}</p>
                        <p><span className="font-medium">연락처:</span> {workOrder.customerPhone}</p>
                        <p><span className="font-medium">요청일:</span> {workOrder.createdAt?.toDate().toLocaleDateString('ko-KR')}</p>
                        
                        {workOrder.products && workOrder.products.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium">제품 정보:</p>
                            <ul className="list-disc list-inside ml-2">
                              {workOrder.products.map((product, index) => (
                                <li key={index}>
                                  {product.name} - {product.quantity} {product.unit}
                                  {product.description && ` (${product.description})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {workOrder.description && (
                          <p className="mt-1"><span className="font-medium">특이사항:</span> {workOrder.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      {workOrder.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptWork(workOrder.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          작업 수락
                        </button>
                      )}
                      
                      {workOrder.status === 'assigned' && workOrder.assignedWorkerId === user.uid && (
                        <button
                          onClick={() => handleStartWork(workOrder.id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          작업 시작
                        </button>
                      )}
                      
                      {workOrder.status === 'in_progress' && workOrder.assignedWorkerId === user.uid && (
                        <button
                          onClick={() => handleCompleteWork(workOrder.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          작업 완료
                        </button>
                      )}
                      
                      <button
                        onClick={() => router.push(`/workorder/${workOrder.id}`)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 