import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899"];

const NotificationStats = () => {
  const [stats, setStats] = useState({
    success: 0,
    failure: 0,
    pending: 0,
    retry: 0,
    byType: {},
    byCategory: {},
    byStatus: {},
    recentActivity: [],
    errorAnalysis: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("");

  // 시간 범위 옵션
  const timeRangeOptions = [
    { value: "1d", label: "최근 24시간" },
    { value: "7d", label: "최근 7일" },
    { value: "30d", label: "최근 30일" },
    { value: "90d", label: "최근 90일" }
  ];

  // 통계 데이터 조회
  const fetchStats = async () => {
    try {
      setLoading(true);

      // 시간 범위 계산
      const now = new Date();
      const timeRangeMap = {
        "1d": new Date(now.getTime() - 24 * 60 * 60 * 1000),
        "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      };

      const startDate = timeRangeMap[timeRange];

      // 기본 쿼리
      let q = query(
        collection(db, "notificationLogs"),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "desc")
      );

      // 광고주 필터 적용
      if (selectedAdvertiser) {
        q = query(q, where("advertiserId", "==", selectedAdvertiser));
      }

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp?.seconds * 1000)
      }));

      // 통계 계산
      const calculatedStats = calculateStats(logs);
      setStats(calculatedStats);
    } catch (error) {
      console.error("통계 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 계산 함수
  const calculateStats = (logs) => {
    const stats = {
      success: 0,
      failure: 0,
      pending: 0,
      retry: 0,
      byType: {},
      byCategory: {},
      byStatus: {},
      recentActivity: logs.slice(0, 10),
      errorAnalysis: []
    };

    // 상태별 통계
    logs.forEach(log => {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
      
      switch (log.status) {
        case "success":
          stats.success++;
          break;
        case "failure":
          stats.failure++;
          break;
        case "pending":
          stats.pending++;
          break;
        case "retry":
          stats.retry++;
          break;
      }

      // 타입별 통계
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

      // 카테고리별 통계
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    // 오류 분석
    const errorLogs = logs.filter(log => log.status === "failure");
    const errorTypes = {};
    errorLogs.forEach(log => {
      if (log.error && log.error.code) {
        errorTypes[log.error.code] = (errorTypes[log.error.code] || 0) + 1;
      }
    });

    stats.errorAnalysis = Object.entries(errorTypes)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  };

  // 시간 범위 변경 시 통계 재조회
  useEffect(() => {
    fetchStats();
  }, [timeRange, selectedAdvertiser]);

  // 성공률 계산
  const successRate = stats.success + stats.failure > 0 ? Math.round((stats.success / (stats.success + stats.failure)) * 100) : 0;

  // 차트 데이터 생성
  const getStatusData = () => [
    { name: "성공", value: stats.success, color: "#10B981" },
    { name: "실패", value: stats.failure, color: "#EF4444" },
    { name: "대기 중", value: stats.pending, color: "#F59E0B" },
    { name: "재시도", value: stats.retry, color: "#3B82F6" }
  ];

  const getTypeData = () => 
    Object.entries(stats.byType).map(([type, count]) => ({
      name: type === "email" ? "이메일" : type === "push" ? "푸시 알림" : type,
      value: count,
      type
    }));

  const getCategoryData = () => 
    Object.entries(stats.byCategory).map(([category, count]) => ({
      name: getCategoryLabel(category),
      value: count,
      category
    }));

  const getErrorData = () => 
    stats.errorAnalysis.map((error, index) => ({
      name: getErrorLabel(error.code),
      value: error.count,
      code: error.code
    }));

  // 카테고리 라벨
  const getCategoryLabel = (category) => {
    const labels = {
      settlement: "정산",
      ad_status: "광고 상태",
      payment: "결제",
      system: "시스템",
      worker_grade: "시공기사 등급",
      marketing: "마케팅",
      security: "보안"
    };
    return labels[category] || category;
  };

  // 오류 라벨
  const getErrorLabel = (code) => {
    const labels = {
      "messaging/invalid-registration-token": "무효한 토큰",
      "messaging/quota-exceeded": "할당량 초과",
      "messaging/registration-token-not-registered": "등록되지 않은 토큰"
    };
    return labels[code] || code;
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${payload[0].value}`}</p>
          {payload[0].payload.percentage && (
            <p className="text-sm text-gray-600">{`${payload[0].payload.percentage}%`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 및 필터 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">알림 발송 통계</h2>
          <p className="text-gray-600 mt-1">실시간 알림 발송 현황 및 분석</p>
        </div>
        <div className="flex gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={selectedAdvertiser}
            onChange={(e) => setSelectedAdvertiser(e.target.value)}
            placeholder="광고주 ID 필터"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 알림</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.success + stats.failure + stats.pending + stats.retry).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">성공률</p>
              <p className="text-2xl font-bold text-green-600">{successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">실패</p>
              <p className="text-2xl font-bold text-red-600">{stats.failure.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기 중</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 상태별 파이 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold mb-4">알림 상태 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getStatusData()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {getStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 타입별 바 차트 */}
        <div className="bg-white rounded-xl shadow-md p-6 border">
          <h3 className="text-lg font-semibold mb-4">알림 타입별 통계</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTypeData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 카테고리별 차트 */}
      <div className="bg-white rounded-xl shadow-md p-6 border mb-8">
        <h3 className="text-lg font-semibold mb-4">카테고리별 알림 분포</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getCategoryData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 오류 분석 */}
      {stats.errorAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 border mb-8">
          <h3 className="text-lg font-semibold mb-4">주요 오류 분석</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getErrorData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 최근 활동 */}
      <div className="bg-white rounded-xl shadow-md p-6 border">
        <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-medium text-gray-500">시간</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">광고주</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">유형</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">상태</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">메시지</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-sm">
                    {log.timestamp?.toLocaleString?.() || 
                     (log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : "N/A")}
                  </td>
                  <td className="py-2 text-sm">{log.advertiserId || "시스템"}</td>
                  <td className="py-2 text-sm">
                    <span className="flex items-center gap-1">
                      <span>{log.type === "email" ? "📧" : log.type === "push" ? "📱" : "📋"}</span>
                      <span className="capitalize">{log.type || "알 수 없음"}</span>
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      log.status === "success" ? "text-green-600 bg-green-100" :
                      log.status === "failure" ? "text-red-600 bg-red-100" :
                      log.status === "pending" ? "text-yellow-600 bg-yellow-100" :
                      log.status === "retry" ? "text-blue-600 bg-blue-100" :
                      "text-gray-600 bg-gray-100"
                    }`}>
                      {log.status === "success" && "성공"}
                      {log.status === "failure" && "실패"}
                      {log.status === "pending" && "대기 중"}
                      {log.status === "retry" && "재시도"}
                      {!["success", "failure", "pending", "retry"].includes(log.status) && log.status}
                    </span>
                  </td>
                  <td className="py-2 text-sm max-w-xs truncate">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationStats; 