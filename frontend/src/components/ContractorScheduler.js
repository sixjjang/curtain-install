import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import { 
  calculateScheduleDistances, 
  calculateTotalTravelInfo, 
  optimizeSchedule,
  calculateScheduleDistancesWithPickup,
  calculateTotalTravelInfoWithPickup,
  optimizeScheduleWithPickup,
  getDistanceColor,
  getTravelTimeColor,
  formatDistance,
  formatTravelTime
} from '../utils/distanceCalculator';

function ContractorScheduler() {
  const { user } = useAuth();
  const [scheduledWorkOrders, setScheduledWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('pending');
  const [optimizedSchedule, setOptimizedSchedule] = useState([]);
  const [showOptimized, setShowOptimized] = useState(false);
  const [pickupMode, setPickupMode] = useState(true); // 픽업 정보 고려 모드

  // 현재 위치 가져오기
  useEffect(() => {
    const getLocation = async () => {
      try {
        if (navigator.geolocation) {
          setLocationPermission('pending');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setLocationPermission('granted');
            },
            (error) => {
              console.error('위치 정보 가져오기 실패:', error);
              setLocationPermission('denied');
            }
          );
        } else {
          setLocationPermission('denied');
        }
      } catch (error) {
        console.error('위치 정보 오류:', error);
        setLocationPermission('denied');
      }
    };

    getLocation();
  }, []);

  // 스케줄된 작업 로드
  useEffect(() => {
    const loadScheduledWorkOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // 현재 주의 시작과 끝 계산
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // 시공자가 수락한 작업 조회
        const q = query(
          collection(db, 'workOrders'),
          where('status', 'in', ['수락', '진행중']),
          where('scheduledDate', '>=', startOfWeek),
          where('scheduledDate', '<=', endOfWeek),
          orderBy('scheduledDate', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const workOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setScheduledWorkOrders(workOrders);
      } catch (error) {
        console.error('스케줄 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScheduledWorkOrders();
  }, [user]);

  // 스케줄 최적화
  const handleOptimizeSchedule = async () => {
    if (!currentLocation || scheduledWorkOrders.length === 0) return;

    try {
      setLoading(true);
      
      let optimized;
      if (pickupMode) {
        // 픽업 정보를 고려한 최적화
        optimized = await optimizeScheduleWithPickup(scheduledWorkOrders, currentLocation);
      } else {
        // 기존 최적화 (픽업 정보 무시)
        optimized = optimizeSchedule(scheduledWorkOrders, currentLocation);
      }
      
      setOptimizedSchedule(optimized);
      setShowOptimized(true);
    } catch (error) {
      console.error('스케줄 최적화 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 원래 스케줄로 복원
  const handleRestoreSchedule = () => {
    setShowOptimized(false);
    setOptimizedSchedule([]);
  };

  // 현재 표시할 스케줄 결정
  const displaySchedule = showOptimized ? optimizedSchedule : scheduledWorkOrders;

  // 스케줄 거리 계산
  const scheduleWithDistances = pickupMode 
    ? calculateScheduleDistancesWithPickup(displaySchedule, currentLocation)
    : calculateScheduleDistances(displaySchedule);

  // 총 이동 정보 계산
  const totalTravelInfo = pickupMode
    ? calculateTotalTravelInfoWithPickup(scheduleWithDistances)
    : calculateTotalTravelInfo(scheduleWithDistances);

  // 날짜별로 그룹화
  const groupedByDate = scheduleWithDistances.reduce((groups, workOrder) => {
    const date = workOrder.scheduledDate?.toDate?.() 
      ? workOrder.scheduledDate.toDate().toLocaleDateString('ko-KR')
      : new Date(workOrder.scheduledDate).toLocaleDateString('ko-KR');
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(workOrder);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">스케줄을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">📅 시공 스케줄</h1>
          <div className="flex items-center space-x-4">
            {/* 픽업 모드 토글 */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pickupMode"
                checked={pickupMode}
                onChange={(e) => setPickupMode(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="pickupMode" className="text-sm font-medium text-gray-700">
                픽업 정보 고려
              </label>
            </div>
            
            {/* 위치 권한 상태 */}
            <div className="flex items-center space-x-2">
              {locationPermission === 'pending' && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  📍 위치 확인 중...
                </span>
              )}
              {locationPermission === 'granted' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  📍 위치 정보 사용 가능
                </span>
              )}
              {locationPermission === 'denied' && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  📍 위치 정보 없음
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 총 이동 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600">총 이동 거리</div>
            <div className="text-xl font-bold text-blue-800">
              {totalTravelInfo.formattedTotalDistance}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600">총 이동 시간</div>
            <div className="text-xl font-bold text-green-800">
              {totalTravelInfo.formattedTotalTravelTime}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600">총 작업 수</div>
            <div className="text-xl font-bold text-purple-800">
              {scheduledWorkOrders.length}건
            </div>
          </div>
          {pickupMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600">픽업 필요</div>
              <div className="text-xl font-bold text-yellow-800">
                {totalTravelInfo.pickupCount}건
              </div>
            </div>
          )}
        </div>

        {/* 스케줄 최적화 컨트롤 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {showOptimized ? '최적화된 스케줄이 표시됩니다' : '원래 스케줄이 표시됩니다'}
          </div>
          <div className="flex space-x-3">
            {!showOptimized ? (
              <button
                onClick={handleOptimizeSchedule}
                disabled={!currentLocation || scheduledWorkOrders.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                🚀 스케줄 최적화
              </button>
            ) : (
              <button
                onClick={handleRestoreSchedule}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ↩️ 원래 스케줄로 복원
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 스케줄 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(groupedByDate).map(([date, workOrders]) => (
          <div key={date} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">{date}</h3>
              <p className="text-sm text-gray-600">{workOrders.length}건의 작업</p>
            </div>
            
            <div className="p-4 space-y-4">
              {workOrders.map((workOrder, index) => (
                <div key={workOrder.id} className="border border-gray-200 rounded-lg p-3">
                  {/* 작업 정보 */}
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {workOrder.customerName}님
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {workOrder.location}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        workOrder.status === '수락' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {workOrder.status}
                      </span>
                      <span className="text-gray-500">
                        {workOrder.scheduledDate?.toDate?.() 
                          ? workOrder.scheduledDate.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                          : new Date(workOrder.scheduledDate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                        }
                      </span>
                    </div>
                  </div>

                  {/* 픽업 정보 표시 */}
                  {pickupMode && workOrder.pickupRequired && workOrder.pickupInfo && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center mb-1">
                        <span className="text-yellow-600 mr-1">📦</span>
                        <span className="text-xs font-medium text-yellow-800">픽업 정보</span>
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        <div>픽업: {workOrder.pickupLocation}</div>
                        <div>픽업 거리: {formatDistance(workOrder.pickupInfo.pickupDistance)}</div>
                        <div>픽업 시간: {formatTravelTime(workOrder.pickupInfo.pickupTravelTime)}</div>
                      </div>
                    </div>
                  )}

                  {/* 이동 정보 표시 */}
                  {workOrder.travelInfo && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">다음 작업까지:</span>
                        <div className="text-right">
                          <div className={`font-medium ${getDistanceColor(workOrder.travelInfo.toNextWork.distance)}`}>
                            {workOrder.travelInfo.toNextWork.formattedDistance}
                          </div>
                          <div className={`font-medium ${getTravelTimeColor(workOrder.travelInfo.toNextWork.travelTime)}`}>
                            {formatTravelTime(workOrder.travelInfo.toNextWork.travelTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 픽업 모드에서 총 이동 정보 표시 */}
                  {pickupMode && workOrder.pickupInfo && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">총 이동:</span>
                        <div className="text-right">
                          <div className={`font-medium ${getDistanceColor(workOrder.pickupInfo.totalDistance)}`}>
                            {formatDistance(workOrder.pickupInfo.totalDistance)}
                          </div>
                          <div className={`font-medium ${getTravelTimeColor(workOrder.pickupInfo.totalTravelTime)}`}>
                            {formatTravelTime(workOrder.pickupInfo.totalTravelTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {scheduledWorkOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">스케줄된 작업이 없습니다</h3>
          <p className="text-gray-600">이번 주에 수락한 시공 작업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default ContractorScheduler; 