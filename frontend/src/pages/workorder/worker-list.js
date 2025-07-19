import Navigation from '../../components/Navigation';

const mockWorkerOrders = [
  {
    id: 'WO-2024-001',
    title: '거실 커튼 설치',
    status: 'in_progress',
    client: '김철수',
    phone: '070-1234-5678',
    address: '서울시 강남구 역삼동',
    price: 150000,
    createdAt: '2024-01-15',
    priority: 'high',
    assigned: true
  },
  {
    id: 'WO-2024-003',
    title: '사무실 커튼 교체',
    status: 'completed',
    client: '박민수',
    phone: '070-5678-1234',
    address: '서울시 마포구 합정동',
    price: 200000,
    createdAt: '2024-01-13',
    priority: 'low',
    assigned: true
  }
];

export default function WorkerOrderList() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation title="시공기사 작업 목록" />
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">내가 맡은 작업</h1>
        <div className="space-y-4">
          {mockWorkerOrders.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">맡은 작업이 없습니다</h3>
              <p className="text-slate-600 mb-6">새로운 작업을 수락해보세요.</p>
            </div>
          ) : (
            mockWorkerOrders.map((order) => (
              <div key={order.id} className="card card-hover p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {order.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          주문번호: {order.id}
                        </p>
                      </div>
                      <span className={`badge ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {order.status === 'completed' ? '완료' : '진행 중'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">의뢰자:</span>
                        <span className="ml-2 font-medium text-slate-900">{order.client}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">연락처:</span>
                        <span className="ml-2 font-medium text-slate-900">{order.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">주소:</span>
                        <span className="ml-2 font-medium text-slate-900">{order.address}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">견적가:</span>
                        <span className="ml-2 font-bold text-green-600">{order.price.toLocaleString()}원</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      등록일: {order.createdAt}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button className="btn btn-outline text-sm">상세보기</button>
                    {order.status === 'in_progress' && (
                      <button className="btn btn-success text-sm">완료 처리</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 