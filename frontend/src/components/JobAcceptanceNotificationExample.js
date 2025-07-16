import React, { useState, useEffect } from 'react';
import { useJobAcceptanceNotifications } from '../hooks/useJobAcceptanceNotifications';

const JobAcceptanceNotificationExample = ({ userId }) => {
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [notificationStats, setNotificationStats] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  
  const {
    fcmTokens,
    notificationPreferences,
    loading,
    error,
    lastNotification,
    initializeFCM,
    addFCMToken,
    removeFCMToken,
    updateNotificationPreferences,
    getNotificationLogs,
    getNotificationStats,
    hasValidTokens,
    isNotificationsEnabled
  } = useJobAcceptanceNotifications(userId);

  // 알림 로그 및 통계 로드
  useEffect(() => {
    if (userId) {
      loadNotificationData();
    }
  }, [userId]);

  const loadNotificationData = async () => {
    const [logs, stats] = await Promise.all([
      getNotificationLogs(20),
      getNotificationStats()
    ]);
    setNotificationLogs(logs);
    setNotificationStats(stats);
  };

  const handleInitializeFCM = async () => {
    await initializeFCM();
    await loadNotificationData();
  };

  const handleToggleNotification = async (type) => {
    const newPreferences = {
      ...notificationPreferences,
      [type]: !notificationPreferences[type]
    };
    await updateNotificationPreferences(newPreferences);
  };

  const handleRemoveToken = async (token) => {
    await removeFCMToken(token);
    await loadNotificationData();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('ko-KR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'partial': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">알림 설정을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            작업 수락 알림 관리
          </h1>
          <p className="text-gray-600">
            작업이 수락될 때 받는 알림을 관리하세요
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 알림 */}
        {lastNotification && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">최근 알림</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>{lastNotification.title}</strong></p>
                  <p>{lastNotification.body}</p>
                  <p className="text-xs mt-1">{formatDate(lastNotification.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 알림 통계 */}
        {notificationStats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{notificationStats.total}</div>
              <div className="text-sm text-gray-600">총 알림</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{notificationStats.success}</div>
              <div className="text-sm text-gray-600">성공</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{notificationStats.failed}</div>
              <div className="text-sm text-gray-600">실패</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{notificationStats.successRate}%</div>
              <div className="text-sm text-gray-600">성공률</div>
            </div>
          </div>
        )}

        {/* FCM 토큰 관리 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">FCM 토큰 관리</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">FCM 토큰 상태</p>
                  <p className="text-sm text-gray-500">
                    {hasValidTokens ? '토큰이 등록되어 있습니다' : '토큰이 등록되지 않았습니다'}
                  </p>
                </div>
                <button
                  onClick={handleInitializeFCM}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  FCM 초기화
                </button>
              </div>

              {fcmTokens.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">등록된 토큰 ({fcmTokens.length})</p>
                  <div className="space-y-2">
                    {fcmTokens.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-gray-600 truncate">{token}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveToken(token)}
                          className="ml-2 px-3 py-1 text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">알림 설정</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">푸시 알림</p>
                  <p className="text-sm text-gray-500">모바일 및 웹 푸시 알림</p>
                </div>
                <button
                  onClick={() => handleToggleNotification('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPreferences.push ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">이메일 알림</p>
                  <p className="text-sm text-gray-500">이메일로 알림 받기</p>
                </div>
                <button
                  onClick={() => handleToggleNotification('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPreferences.email ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">작업 수락 알림</p>
                  <p className="text-sm text-gray-500">작업이 수락될 때 알림</p>
                </div>
                <button
                  onClick={() => handleToggleNotification('jobAccepted')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationPreferences.jobAccepted ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPreferences.jobAccepted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 로그 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">알림 로그</h2>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showLogs ? '숨기기' : '보기'}
              </button>
            </div>
          </div>

          {showLogs && (
            <div className="p-6">
              {notificationLogs.length > 0 ? (
                <div className="space-y-4">
                  {notificationLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          <span className="text-sm text-gray-600">{log.jobName}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                      </div>
                      
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><strong>계약자:</strong> {log.contractorName}</p>
                        <p><strong>FCM 토큰:</strong> {log.fcmTokensCount}개</p>
                        <p><strong>성공:</strong> {log.successCount}개, <strong>실패:</strong> {log.failureCount}개</p>
                        {log.error && (
                          <p className="text-red-600"><strong>오류:</strong> {log.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">알림 로그가 없습니다</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    아직 작업 수락 알림이 발생하지 않았습니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• FCM 초기화:</strong> 브라우저 알림 권한을 요청하고 FCM 토큰을 등록합니다.</p>
            <p><strong>• 알림 설정:</strong> 푸시 알림과 이메일 알림을 개별적으로 설정할 수 있습니다.</p>
            <p><strong>• 알림 로그:</strong> 전송된 알림의 성공/실패 상태를 확인할 수 있습니다.</p>
            <p><strong>• 실시간 알림:</strong> 작업이 수락되면 즉시 알림을 받을 수 있습니다.</p>
            <p><strong>• 토큰 관리:</strong> 여러 기기에서 사용할 수 있도록 여러 FCM 토큰을 관리합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAcceptanceNotificationExample; 