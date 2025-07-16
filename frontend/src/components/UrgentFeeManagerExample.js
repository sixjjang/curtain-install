import React, { useState, useEffect } from 'react';
import { useUrgentFeeManager } from '../hooks/useUrgentFeeManager';

const UrgentFeeManagerExample = () => {
  const [formData, setFormData] = useState({
    jobId: '',
    increasePercent: 5,
    reason: '관리자 수동 인상'
  });

  const [settings, setSettings] = useState({
    enabled: true,
    increaseInterval: 600,
    increasePercent: 5,
    maxIncreasePercent: 50
  });

  const [stats, setStats] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('week');

  const { 
    loading, 
    error, 
    manualIncreaseUrgentFee, 
    getUrgentFeeStats, 
    updateUrgentFeeSettings,
    clearError 
  } = useUrgentFeeManager();

  const [result, setResult] = useState(null);

  useEffect(() => {
    loadStats();
  }, [selectedDateRange]);

  const loadStats = async () => {
    try {
      const statsData = await getUrgentFeeStats({ dateRange: selectedDateRange });
      setStats(statsData);
    } catch (err) {
      console.error('통계 로드 실패:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : type === 'checkbox' ? checked : value
    }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : type === 'checkbox' ? checked : value
    }));
  };

  const handleManualIncrease = async (e) => {
    e.preventDefault();
    setResult(null);
    clearError();

    try {
      const response = await manualIncreaseUrgentFee(formData);
      setResult(response);
      
      // 폼 초기화
      setFormData({
        jobId: '',
        increasePercent: 5,
        reason: '관리자 수동 인상'
      });

      // 통계 새로고침
      await loadStats();
    } catch (err) {
      console.error('수동 인상 실패:', err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const response = await updateUrgentFeeSettings(settings);
      setResult(response);
      console.log('설정 업데이트 성공:', response);
    } catch (err) {
      console.error('설정 업데이트 실패:', err);
    }
  };

  const formatExecutionTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}초`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            긴급 수수료 관리 시스템
          </h1>
          <p className="text-gray-600">
            긴급 수수료 자동 인상 및 수동 관리를 위한 종합 관리 도구입니다.
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  오류가 발생했습니다
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 성공 결과 표시 */}
        {result && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  작업이 성공적으로 완료되었습니다
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  {result.message}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 수동 긴급 수수료 인상 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              수동 긴급 수수료 인상
            </h2>

            <form onSubmit={handleManualIncrease} className="space-y-4">
              <div>
                <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
                  시공건 ID *
                </label>
                <input
                  type="text"
                  id="jobId"
                  name="jobId"
                  value={formData.jobId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="시공건 ID를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="increasePercent" className="block text-sm font-medium text-gray-700 mb-2">
                  인상 비율 (%) *
                </label>
                <input
                  type="number"
                  id="increasePercent"
                  name="increasePercent"
                  value={formData.increasePercent}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  인상 사유
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="인상 사유를 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !formData.jobId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : '긴급 수수료 인상'}
              </button>
            </form>
          </div>

          {/* 긴급 수수료 설정 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              긴급 수수료 설정
            </h2>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  checked={settings.enabled}
                  onChange={handleSettingsChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-700">
                  긴급 수수료 자동 인상 활성화
                </label>
              </div>

              <div>
                <label htmlFor="increaseInterval" className="block text-sm font-medium text-gray-700 mb-2">
                  인상 간격 (초)
                </label>
                <input
                  type="number"
                  id="increaseInterval"
                  name="increaseInterval"
                  value={settings.increaseInterval}
                  onChange={handleSettingsChange}
                  min="60"
                  max="3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  현재: {Math.floor(settings.increaseInterval / 60)}분마다
                </p>
              </div>

              <div>
                <label htmlFor="increasePercent" className="block text-sm font-medium text-gray-700 mb-2">
                  인상 비율 (%)
                </label>
                <input
                  type="number"
                  id="increasePercent"
                  name="increasePercent"
                  value={settings.increasePercent}
                  onChange={handleSettingsChange}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="maxIncreasePercent" className="block text-sm font-medium text-gray-700 mb-2">
                  최대 인상 비율 (%)
                </label>
                <input
                  type="number"
                  id="maxIncreasePercent"
                  name="maxIncreasePercent"
                  value={settings.maxIncreasePercent}
                  onChange={handleSettingsChange}
                  min="10"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '저장 중...' : '설정 저장'}
              </button>
            </form>
          </div>
        </div>

        {/* 통계 섹션 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              긴급 수수료 통계
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="today">오늘</option>
                <option value="week">최근 7일</option>
                <option value="month">이번 달</option>
              </select>
              <button
                onClick={loadStats}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300"
              >
                새로고침
              </button>
            </div>
          </div>

          {stats ? (
            <div>
              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-600">총 처리 건수</h3>
                  <p className="text-2xl font-bold text-blue-900">{stats.summary?.totalProcessed || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-600">인상된 건수</h3>
                  <p className="text-2xl font-bold text-green-900">{stats.summary?.totalIncreased || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-600">오류 건수</h3>
                  <p className="text-2xl font-bold text-red-900">{stats.summary?.totalErrors || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-600">성공률</h3>
                  <p className="text-2xl font-bold text-yellow-900">{stats.summary?.successRate || 0}%</p>
                </div>
              </div>

              {/* 상세 통계 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        실행 시간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        처리 건수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        인상 건수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        오류 건수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        실행 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.stats?.slice(0, 10).map((stat, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(stat.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stat.totalProcessed || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {stat.totalIncreased || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {stat.totalErrors || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatExecutionTime(stat.executionTimeMs || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {stats.stats?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">해당 기간의 통계 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">통계를 불러오는 중...</p>
            </div>
          )}
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용법 안내</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p><strong>• 자동 인상:</strong> 10분마다 자동으로 오픈 상태의 시공건에 긴급 수수료가 인상됩니다.</p>
            <p><strong>• 수동 인상:</strong> 특정 시공건에 대해 즉시 긴급 수수료를 인상할 수 있습니다.</p>
            <p><strong>• 설정 관리:</strong> 인상 간격, 비율, 최대 한도를 설정할 수 있습니다.</p>
            <p><strong>• 통계 모니터링:</strong> 처리 현황과 성공률을 실시간으로 확인할 수 있습니다.</p>
            <p><strong>• 오류 알림:</strong> 오류 발생 시 관리자에게 자동으로 알림이 발송됩니다.</p>
          </div>
        </div>

        {/* 빠른 테스트 버튼들 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 테스트</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setFormData({
                jobId: 'test_job_1',
                increasePercent: 5,
                reason: '테스트 - 긴급 수수료 인상'
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              기본 인상 테스트
            </button>
            <button
              onClick={() => setFormData({
                jobId: 'test_job_2',
                increasePercent: 10,
                reason: '테스트 - 대폭 인상'
              })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              대폭 인상 테스트
            </button>
            <button
              onClick={() => setSettings({
                enabled: true,
                increaseInterval: 300,
                increasePercent: 3,
                maxIncreasePercent: 30
              })}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              설정 테스트
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrgentFeeManagerExample; 