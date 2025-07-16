import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  SafeAreaView
} from 'react-native';
import useRegisterSellerFCM from '../hooks/useRegisterSellerFCM';

const SellerNotificationExample = ({ userId }) => {
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
    requestNotificationPermission,
    getNotificationLogs,
    getNotificationStats,
    hasValidTokens,
    isNotificationsEnabled,
    platform
  } = useRegisterSellerFCM(userId);

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
    Alert.alert(
      '토큰 제거',
      '이 FCM 토큰을 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: async () => {
            await removeFCMToken(token);
            await loadNotificationData();
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('ko-KR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'failed': return '#EF4444';
      case 'partial': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>알림 설정을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>작업 수락 알림 관리</Text>
          <Text style={styles.subtitle}>작업이 수락될 때 받는 알림을 관리하세요</Text>
        </View>

        {/* 에러 표시 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>오류가 발생했습니다</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        {/* 최근 알림 */}
        {lastNotification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationTitle}>최근 알림</Text>
            <Text style={styles.notificationText}>{lastNotification.title}</Text>
            <Text style={styles.notificationBody}>{lastNotification.body}</Text>
            <Text style={styles.notificationTime}>
              {formatDate(lastNotification.timestamp)}
            </Text>
          </View>
        )}

        {/* 알림 통계 */}
        {notificationStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>알림 통계</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{notificationStats.total}</Text>
                <Text style={styles.statLabel}>총 알림</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {notificationStats.success}
                </Text>
                <Text style={styles.statLabel}>성공</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                  {notificationStats.failed}
                </Text>
                <Text style={styles.statLabel}>실패</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#3B82F6' }]}>
                  {notificationStats.successRate}%
                </Text>
                <Text style={styles.statLabel}>성공률</Text>
              </View>
            </View>
          </View>
        )}

        {/* FCM 토큰 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FCM 토큰 관리</Text>
          
          <View style={styles.tokenStatusContainer}>
            <View style={styles.tokenStatusInfo}>
              <Text style={styles.tokenStatusText}>FCM 토큰 상태</Text>
              <Text style={styles.tokenStatusDescription}>
                {hasValidTokens ? '토큰이 등록되어 있습니다' : '토큰이 등록되지 않았습니다'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleInitializeFCM}
            >
              <Text style={styles.primaryButtonText}>FCM 초기화</Text>
            </TouchableOpacity>
          </View>

          {fcmTokens.length > 0 && (
            <View style={styles.tokensContainer}>
              <Text style={styles.tokensTitle}>
                등록된 토큰 ({fcmTokens.length})
              </Text>
              {fcmTokens.map((token, index) => (
                <View key={index} style={styles.tokenItem}>
                  <Text style={styles.tokenText} numberOfLines={1}>
                    {token}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveToken(token)}
                  >
                    <Text style={styles.removeButtonText}>제거</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>푸시 알림</Text>
                <Text style={styles.preferenceDescription}>모바일 푸시 알림</Text>
              </View>
              <Switch
                value={notificationPreferences.push}
                onValueChange={() => handleToggleNotification('push')}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={notificationPreferences.push ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>이메일 알림</Text>
                <Text style={styles.preferenceDescription}>이메일로 알림 받기</Text>
              </View>
              <Switch
                value={notificationPreferences.email}
                onValueChange={() => handleToggleNotification('email')}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={notificationPreferences.email ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>작업 수락 알림</Text>
                <Text style={styles.preferenceDescription}>작업이 수락될 때 알림</Text>
              </View>
              <Switch
                value={notificationPreferences.jobAccepted}
                onValueChange={() => handleToggleNotification('jobAccepted')}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={notificationPreferences.jobAccepted ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* 알림 로그 */}
        <View style={styles.section}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>알림 로그</Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowLogs(!showLogs)}
            >
              <Text style={styles.secondaryButtonText}>
                {showLogs ? '숨기기' : '보기'}
              </Text>
            </TouchableOpacity>
          </View>

          {showLogs && (
            <View style={styles.logsContainer}>
              {notificationLogs.length > 0 ? (
                notificationLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logHeader}>
                      <View style={styles.logStatusContainer}>
                        <View
                          style={[
                            styles.logStatusBadge,
                            { backgroundColor: getStatusColor(log.status) }
                          ]}
                        >
                          <Text style={styles.logStatusText}>{log.status}</Text>
                        </View>
                        <Text style={styles.logJobName}>{log.jobName}</Text>
                      </View>
                      <Text style={styles.logTime}>{formatDate(log.timestamp)}</Text>
                    </View>
                    
                    <View style={styles.logDetails}>
                      <Text style={styles.logDetailText}>
                        <Text style={styles.logDetailLabel}>계약자:</Text> {log.contractorName}
                      </Text>
                      <Text style={styles.logDetailText}>
                        <Text style={styles.logDetailLabel}>FCM 토큰:</Text> {log.fcmTokensCount}개
                      </Text>
                      <Text style={styles.logDetailText}>
                        <Text style={styles.logDetailLabel}>성공:</Text> {log.successCount}개, 
                        <Text style={styles.logDetailLabel}> 실패:</Text> {log.failureCount}개
                      </Text>
                      {log.error && (
                        <Text style={styles.logErrorText}>
                          <Text style={styles.logDetailLabel}>오류:</Text> {log.error}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyLogsContainer}>
                  <Text style={styles.emptyLogsTitle}>알림 로그가 없습니다</Text>
                  <Text style={styles.emptyLogsDescription}>
                    아직 작업 수락 알림이 발생하지 않았습니다.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 플랫폼 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>플랫폼 정보</Text>
          <View style={styles.platformInfo}>
            <Text style={styles.platformText}>플랫폼: {platform}</Text>
            <Text style={styles.platformText}>알림 활성화: {isNotificationsEnabled ? '예' : '아니오'}</Text>
          </View>
        </View>

        {/* 사용법 안내 */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideTitle}>사용법 안내</Text>
          <Text style={styles.guideText}>• FCM 초기화: 브라우저 알림 권한을 요청하고 FCM 토큰을 등록합니다.</Text>
          <Text style={styles.guideText}>• 알림 설정: 푸시 알림과 이메일 알림을 개별적으로 설정할 수 있습니다.</Text>
          <Text style={styles.guideText}>• 알림 로그: 전송된 알림의 성공/실패 상태를 확인할 수 있습니다.</Text>
          <Text style={styles.guideText}>• 실시간 알림: 작업이 수락되면 즉시 알림을 받을 수 있습니다.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#DC2626',
  },
  notificationContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tokenStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenStatusInfo: {
    flex: 1,
  },
  tokenStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  tokenStatusDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  tokensContainer: {
    marginTop: 16,
  },
  tokensTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  tokenText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  preferencesContainer: {
    gap: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  logsContainer: {
    gap: 12,
  },
  logItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  logJobName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  logDetails: {
    gap: 4,
  },
  logDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  logDetailLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  logErrorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  emptyLogsContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyLogsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  emptyLogsDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  platformInfo: {
    gap: 8,
  },
  platformText: {
    fontSize: 14,
    color: '#6B7280',
  },
  guideContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 12,
  },
  guideText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default SellerNotificationExample; 