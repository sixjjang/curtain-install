/**
 * GPS 좌표 기반 거리 계산 유틸리티
 */

// 지구 반지름 (미터)
const EARTH_RADIUS = 6371000;

/**
 * 두 GPS 좌표 간의 거리를 계산 (Haversine 공식)
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 거리 (미터)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // 라디안으로 변환
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;

  // 위도와 경도의 차이
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  // Haversine 공식
  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;

  return distance;
}

/**
 * 거리를 사람이 읽기 쉬운 형태로 포맷팅
 * @param {number} distanceInMeters - 거리 (미터)
 * @returns {string} 포맷팅된 거리 문자열
 */
export function formatDistance(distanceInMeters) {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    const distanceInKm = distanceInMeters / 1000;
    if (distanceInKm < 10) {
      return `${distanceInKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceInKm)}km`;
    }
  }
}

/**
 * 이동 시간 계산 (교통 상황 고려)
 * @param {number} distanceInMeters - 거리 (미터)
 * @param {string} transportMode - 이동 수단 ('car', 'public', 'bike')
 * @returns {Object} 이동 시간 정보
 */
export function calculateTravelTime(distanceInMeters, transportMode = 'car') {
  const speeds = {
    car: {
      average: 25, // km/h (도시 평균 속도)
      min: 15,     // km/h (교통 체증 시)
      max: 40      // km/h (원활 시)
    },
    public: {
      average: 20, // km/h (대중교통 평균)
      min: 15,     // km/h
      max: 30      // km/h
    },
    bike: {
      average: 15, // km/h (자전거 평균)
      min: 10,     // km/h
      max: 25      // km/h
    }
  };

  const speed = speeds[transportMode];
  const distanceInKm = distanceInMeters / 1000;
  
  // 평균 시간 (분)
  const averageTimeMinutes = Math.round((distanceInKm / speed.average) * 60);
  
  // 최소 시간 (분)
  const minTimeMinutes = Math.round((distanceInKm / speed.max) * 60);
  
  // 최대 시간 (분)
  const maxTimeMinutes = Math.round((distanceInKm / speed.min) * 60);

  return {
    average: averageTimeMinutes,
    min: minTimeMinutes,
    max: maxTimeMinutes,
    formatted: formatTravelTime(averageTimeMinutes),
    range: `${formatTravelTime(minTimeMinutes)} ~ ${formatTravelTime(maxTimeMinutes)}`
  };
}

/**
 * 이동 시간을 사람이 읽기 쉬운 형태로 포맷팅
 * @param {number} minutes - 분
 * @returns {string} 포맷팅된 시간 문자열
 */
export function formatTravelTime(minutes) {
  if (minutes < 1) {
    return '1분 미만';
  } else if (minutes < 60) {
    return `${minutes}분`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}시간`;
    } else {
      return `${hours}시간 ${remainingMinutes}분`;
    }
  }
}

/**
 * 주소를 GPS 좌표로 변환 (카카오 API 사용)
 * @param {string} address - 주소 문자열
 * @returns {Promise<{lat: number, lng: number} | null>} GPS 좌표
 */
export async function geocodeAddress(address) {
  try {
    // 카카오 지도 API를 사용하여 주소를 좌표로 변환
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || 'your-kakao-api-key'}`
        }
      }
    );

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const firstResult = data.documents[0];
      return {
        lat: parseFloat(firstResult.y),
        lng: parseFloat(firstResult.x)
      };
    }
    
    return null;
  } catch (error) {
    console.error('주소 좌표 변환 실패:', error);
    return null;
  }
}

/**
 * 현재 위치 가져오기
 * @returns {Promise<{lat: number, lng: number} | null>} 현재 GPS 좌표
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분 캐시
      }
    );
  });
}

/**
 * 시공자와 시공요청 간의 거리 계산
 * @param {Object} contractorLocation - 시공자 위치 (lat, lng)
 * @param {Object} workOrderLocation - 시공요청 위치 (lat, lng)
 * @returns {Object} 거리 정보
 */
export function calculateWorkOrderDistance(contractorLocation, workOrderLocation) {
  if (!contractorLocation || !workOrderLocation) {
    return {
      distance: null,
      formattedDistance: '위치 정보 없음',
      isNearby: false
    };
  }

  const distance = calculateDistance(
    contractorLocation.lat,
    contractorLocation.lng,
    workOrderLocation.lat,
    workOrderLocation.lng
  );

  const formattedDistance = formatDistance(distance);
  const isNearby = distance <= 10000; // 10km 이내를 가까운 거리로 정의

  return {
    distance,
    formattedDistance,
    isNearby
  };
}

/**
 * 여러 시공요청을 거리순으로 정렬
 * @param {Array} workOrders - 시공요청 목록
 * @param {Object} contractorLocation - 시공자 위치
 * @returns {Array} 거리순으로 정렬된 시공요청 목록
 */
export function sortWorkOrdersByDistance(workOrders, contractorLocation) {
  if (!contractorLocation) {
    return workOrders;
  }

  return workOrders.map(workOrder => {
    const distanceInfo = calculateWorkOrderDistance(
      contractorLocation,
      workOrder.location
    );
    
    return {
      ...workOrder,
      distanceInfo
    };
  }).sort((a, b) => {
    if (!a.distanceInfo.distance && !b.distanceInfo.distance) return 0;
    if (!a.distanceInfo.distance) return 1;
    if (!b.distanceInfo.distance) return -1;
    return a.distanceInfo.distance - b.distanceInfo.distance;
  });
}

/**
 * 스케줄의 작업 간 거리 및 이동 시간 계산
 * @param {Array} scheduledWorkOrders - 스케줄된 작업 목록
 * @returns {Array} 이동 정보가 포함된 스케줄
 */
export function calculateScheduleDistances(scheduledWorkOrders) {
  if (!scheduledWorkOrders || scheduledWorkOrders.length < 2) {
    return scheduledWorkOrders;
  }

  const scheduleWithDistances = [];

  for (let i = 0; i < scheduledWorkOrders.length; i++) {
    const currentWork = scheduledWorkOrders[i];
    const nextWork = scheduledWorkOrders[i + 1];

    const workWithDistance = {
      ...currentWork,
      travelInfo: null
    };

    // 다음 작업이 있으면 거리 및 이동 시간 계산
    if (nextWork && currentWork.locationCoordinates && nextWork.locationCoordinates) {
      const distance = calculateDistance(
        currentWork.locationCoordinates.lat,
        currentWork.locationCoordinates.lng,
        nextWork.locationCoordinates.lat,
        nextWork.locationCoordinates.lng
      );

      const travelTime = calculateTravelTime(distance, 'car');

      workWithDistance.travelInfo = {
        toNextWork: {
          distance: distance,
          formattedDistance: formatDistance(distance),
          travelTime: travelTime,
          nextWorkName: nextWork.customerName || '다음 작업',
          nextWorkLocation: nextWork.location
        }
      };
    }

    scheduleWithDistances.push(workWithDistance);
  }

  return scheduleWithDistances;
}

/**
 * 스케줄의 총 이동 거리 및 시간 계산
 * @param {Array} scheduledWorkOrders - 스케줄된 작업 목록
 * @returns {Object} 총 이동 정보
 */
export function calculateTotalTravelInfo(scheduledWorkOrders) {
  if (!scheduledWorkOrders || scheduledWorkOrders.length < 2) {
    return {
      totalDistance: 0,
      totalTravelTime: 0,
      formattedTotalDistance: '0m',
      formattedTotalTime: '0분'
    };
  }

  let totalDistance = 0;
  let totalTravelTime = 0;

  for (let i = 0; i < scheduledWorkOrders.length - 1; i++) {
    const currentWork = scheduledWorkOrders[i];
    const nextWork = scheduledWorkOrders[i + 1];

    if (currentWork.locationCoordinates && nextWork.locationCoordinates) {
      const distance = calculateDistance(
        currentWork.locationCoordinates.lat,
        currentWork.locationCoordinates.lng,
        nextWork.locationCoordinates.lat,
        nextWork.locationCoordinates.lng
      );

      const travelTime = calculateTravelTime(distance, 'car');
      
      totalDistance += distance;
      totalTravelTime += travelTime.average;
    }
  }

  return {
    totalDistance,
    totalTravelTime,
    formattedTotalDistance: formatDistance(totalDistance),
    formattedTotalTime: formatTravelTime(totalTravelTime)
  };
}

/**
 * 스케줄 최적화 (가장 효율적인 순서로 정렬)
 * @param {Array} workOrders - 작업 목록
 * @param {Object} startLocation - 시작 위치 (현재 위치 또는 첫 번째 작업 위치)
 * @returns {Array} 최적화된 스케줄
 */
export function optimizeSchedule(workOrders, startLocation = null) {
  if (!workOrders || workOrders.length < 2) {
    return workOrders;
  }

  // 시작 위치가 없으면 첫 번째 작업 위치를 사용
  const start = startLocation || workOrders[0].locationCoordinates;
  
  if (!start) {
    return workOrders;
  }

  // 각 작업 간의 거리 매트릭스 생성
  const distances = {};
  const allLocations = [start, ...workOrders.map(w => w.locationCoordinates).filter(Boolean)];

  for (let i = 0; i < allLocations.length; i++) {
    for (let j = i + 1; j < allLocations.length; j++) {
      const distance = calculateDistance(
        allLocations[i].lat, allLocations[i].lng,
        allLocations[j].lat, allLocations[j].lng
      );
      
      const key1 = `${i}-${j}`;
      const key2 = `${j}-${i}`;
      distances[key1] = distance;
      distances[key2] = distance;
    }
  }

  // 가장 가까운 이웃 알고리즘으로 최적화
  const optimized = [];
  const visited = new Set();
  let currentIndex = 0; // 시작 위치

  while (optimized.length < workOrders.length) {
    let nearestIndex = -1;
    let minDistance = Infinity;

    // 방문하지 않은 작업 중 가장 가까운 것 찾기
    for (let i = 1; i < allLocations.length; i++) {
      if (!visited.has(i - 1)) {
        const distance = distances[`${currentIndex}-${i}`];
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
    }

    if (nearestIndex !== -1) {
      optimized.push(workOrders[nearestIndex - 1]);
      visited.add(nearestIndex - 1);
      currentIndex = nearestIndex;
    }
  }

  return optimized;
}

/**
 * 거리에 따른 색상 반환
 * @param {number} distance - 거리 (미터)
 * @returns {string} CSS 색상 클래스
 */
export function getDistanceColor(distance) {
  if (!distance) return 'text-gray-500';
  
  if (distance <= 5000) return 'text-green-600'; // 5km 이내
  if (distance <= 10000) return 'text-blue-600'; // 10km 이내
  if (distance <= 20000) return 'text-yellow-600'; // 20km 이내
  return 'text-red-600'; // 20km 초과
}

/**
 * 거리에 따른 아이콘 반환
 * @param {number} distance - 거리 (미터)
 * @returns {string} 이모지 아이콘
 */
export function getDistanceIcon(distance) {
  if (!distance) return '📍';
  
  if (distance <= 5000) return '🟢'; // 5km 이내
  if (distance <= 10000) return '🔵'; // 10km 이내
  if (distance <= 20000) return '🟡'; // 20km 이내
  return '🔴'; // 20km 초과
}

/**
 * 이동 시간에 따른 색상 반환
 * @param {number} minutes - 이동 시간 (분)
 * @returns {string} CSS 색상 클래스
 */
export function getTravelTimeColor(minutes) {
  if (!minutes) return 'text-gray-500';
  
  if (minutes <= 15) return 'text-green-600'; // 15분 이내
  if (minutes <= 30) return 'text-blue-600'; // 30분 이내
  if (minutes <= 60) return 'text-yellow-600'; // 1시간 이내
  return 'text-red-600'; // 1시간 초과
} 

// 픽업 정보를 고려한 스케줄 거리 계산
export const calculateScheduleDistancesWithPickup = async (workOrders, currentLocation) => {
  const scheduleWithPickup = [];
  
  for (let i = 0; i < workOrders.length; i++) {
    const workOrder = workOrders[i];
    const prevWorkOrder = i > 0 ? workOrders[i - 1] : null;
    
    let fromLocation = currentLocation;
    let pickupInfo = null;
    
    // 이전 작업이 있으면 이전 작업의 시공 장소에서 시작
    if (prevWorkOrder) {
      fromLocation = prevWorkOrder.locationCoordinates || prevWorkOrder.location;
    }
    
    // 픽업이 필요한 경우 픽업 경로 계산
    if (workOrder.pickupRequired && workOrder.pickupLocation) {
      try {
        // 현재 위치에서 픽업 장소까지의 거리
        const pickupCoordinates = await geocodeAddress(workOrder.pickupLocation);
        if (pickupCoordinates) {
          const pickupDistance = calculateDistance(fromLocation, pickupCoordinates);
          const pickupTravelTime = calculateTravelTime(pickupDistance, 'car');
          
          // 픽업 장소에서 시공 장소까지의 거리
          const workOrderCoordinates = workOrder.locationCoordinates || await geocodeAddress(workOrder.location);
          if (workOrderCoordinates) {
            const workOrderDistance = calculateDistance(pickupCoordinates, workOrderCoordinates);
            const workOrderTravelTime = calculateTravelTime(workOrderDistance, 'car');
            
            pickupInfo = {
              pickupLocation: workOrder.pickupLocation,
              pickupDate: workOrder.pickupDate,
              pickupTime: workOrder.pickupTime,
              pickupDistance: pickupDistance,
              pickupTravelTime: pickupTravelTime,
              workOrderDistance: workOrderDistance,
              workOrderTravelTime: workOrderTravelTime,
              totalDistance: pickupDistance + workOrderDistance,
              totalTravelTime: pickupTravelTime + workOrderTravelTime
            };
          }
        }
      } catch (error) {
        console.error('픽업 경로 계산 오류:', error);
      }
    } else {
      // 픽업이 없는 경우 직접 시공 장소로 이동
      try {
        const workOrderCoordinates = workOrder.locationCoordinates || await geocodeAddress(workOrder.location);
        if (workOrderCoordinates) {
          const distance = calculateDistance(fromLocation, workOrderCoordinates);
          const travelTime = calculateTravelTime(distance, 'car');
          
          pickupInfo = {
            pickupLocation: null,
            pickupDate: null,
            pickupTime: null,
            pickupDistance: 0,
            pickupTravelTime: 0,
            workOrderDistance: distance,
            workOrderTravelTime: travelTime,
            totalDistance: distance,
            totalTravelTime: travelTime
          };
        }
      } catch (error) {
        console.error('시공 장소 경로 계산 오류:', error);
      }
    }
    
    scheduleWithPickup.push({
      ...workOrder,
      pickupInfo
    });
  }
  
  return scheduleWithPickup;
};

// 픽업 정보를 고려한 총 이동 거리 및 시간 계산
export const calculateTotalTravelInfoWithPickup = (scheduleWithPickup) => {
  let totalDistance = 0;
  let totalTravelTime = 0;
  let pickupCount = 0;
  
  scheduleWithPickup.forEach(workOrder => {
    if (workOrder.pickupInfo) {
      totalDistance += workOrder.pickupInfo.totalDistance;
      totalTravelTime += workOrder.pickupInfo.totalTravelTime;
      if (workOrder.pickupInfo.pickupLocation) {
        pickupCount++;
      }
    }
  });
  
  return {
    totalDistance,
    totalTravelTime,
    pickupCount,
    formattedTotalDistance: formatDistance(totalDistance),
    formattedTotalTravelTime: formatTravelTime(totalTravelTime)
  };
};

// 픽업 정보를 고려한 스케줄 최적화
export const optimizeScheduleWithPickup = async (workOrders, currentLocation) => {
  if (workOrders.length <= 1) return workOrders;
  
  // 픽업이 필요한 작업과 없는 작업을 분리
  const workOrdersWithPickup = workOrders.filter(wo => wo.pickupRequired);
  const workOrdersWithoutPickup = workOrders.filter(wo => !wo.pickupRequired);
  
  // 각 그룹 내에서 최적화
  const optimizedWithPickup = await optimizeSchedule(workOrdersWithPickup, currentLocation);
  const optimizedWithoutPickup = await optimizeSchedule(workOrdersWithoutPickup, currentLocation);
  
  // 두 그룹을 합치고 전체적으로 최적화
  const allWorkOrders = [...optimizedWithPickup, ...optimizedWithoutPickup];
  
  // 전체 스케줄에서 가장 효율적인 순서 찾기
  let bestOrder = [...allWorkOrders];
  let bestTotalDistance = Infinity;
  
  // 간단한 휴리스틱: 픽업이 필요한 작업을 먼저 처리하는 것이 효율적일 수 있음
  const pickupFirst = [...workOrdersWithPickup, ...workOrdersWithoutPickup];
  const noPickupFirst = [...workOrdersWithoutPickup, ...workOrdersWithPickup];
  
  const orders = [pickupFirst, noPickupFirst, allWorkOrders];
  
  for (const order of orders) {
    const scheduleWithPickup = await calculateScheduleDistancesWithPickup(order, currentLocation);
    const totalInfo = calculateTotalTravelInfoWithPickup(scheduleWithPickup);
    
    if (totalInfo.totalDistance < bestTotalDistance) {
      bestTotalDistance = totalInfo.totalDistance;
      bestOrder = order;
    }
  }
  
  return bestOrder;
}; 