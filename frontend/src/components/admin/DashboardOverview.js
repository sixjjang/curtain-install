import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useEffect, useState } from "react";

const DashboardOverview = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalEarnings: 0,
    mediaEarnings: 0,
    pendingWithdrawals: 0,
    newSellers: 0,
    newWorkers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 총 시공 건수
      const jobsSnapshot = await getDocs(collection(db, "orders"));
      const totalJobs = jobsSnapshot.size;

      // 시공 수익 합산
      let totalEarnings = 0;
      jobsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.price) totalEarnings += data.price;
      });

      // 미디어 다운로드 수익
      const mediaSnapshot = await getDocs(collection(db, "mediaDownloads"));
      let mediaEarnings = 0;
      mediaSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.price) mediaEarnings += data.price;
      });

      // 미처리 출금 요청 수
      const workerSnapshot = await getDocs(collection(db, "workerEarnings"));
      const pendingWithdrawals = workerSnapshot.docs.filter(
        (doc) => doc.data().withdrawalStatus === "requested"
      ).length;

      // 신규 판매자 수
      const sellersSnapshot = await getDocs(collection(db, "users"));
      const newSellers = sellersSnapshot.docs.filter(
        (doc) => doc.data().role === "seller"
      ).length;

      // 신규 시공기사 수
      const newWorkers = sellersSnapshot.docs.filter(
        (doc) => doc.data().role === "worker"
      ).length;

      setStats({
        totalJobs,
        totalEarnings,
        mediaEarnings,
        pendingWithdrawals,
        newSellers,
        newWorkers,
      });
    } catch (error) {
      console.error("대시보드 데이터 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNavigate = (menuId) => {
    if (onNavigate) {
      onNavigate(menuId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">관리자 대시보드</h2>
        <div className="text-sm text-gray-600">
          실시간 통계 정보
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">통계를 불러오는 중...</p>
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard 
              label="총 시공 건수" 
              value={`${stats.totalJobs} 건`} 
              icon="🏗️"
              color="blue"
            />
            <StatCard 
              label="총 시공 수익" 
              value={`${stats.totalEarnings.toLocaleString()} 원`} 
              icon="💰"
              color="green"
            />
            <StatCard 
              label="미디어 다운로드 수익" 
              value={`${stats.mediaEarnings.toLocaleString()} 원`} 
              icon="📸"
              color="purple"
            />
            <StatCard 
              label="미처리 출금 요청" 
              value={`${stats.pendingWithdrawals} 건`} 
              icon="⏳"
              color="orange"
            />
            <StatCard 
              label="판매자 수" 
              value={`${stats.newSellers} 명`} 
              icon="👤"
              color="indigo"
            />
            <StatCard 
              label="시공기사 수" 
              value={`${stats.newWorkers} 명`} 
              icon="👷"
              color="teal"
            />
          </div>

          {/* 빠른 이동 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">빠른 이동</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickLink 
                label="시공 내역 관리" 
                icon="🏗️"
                onClick={() => handleQuickNavigate("jobs")}
              />
              <QuickLink 
                label="결제 관리" 
                icon="💰"
                onClick={() => handleQuickNavigate("payments")}
              />
              <QuickLink 
                label="미디어 다운로드" 
                icon="⬇️"
                onClick={() => handleQuickNavigate("mediaDownloads")}
              />
              <QuickLink 
                label="관리자 로그" 
                icon="📋"
                onClick={() => handleQuickNavigate("adminLogs")}
              />
            </div>
          </div>

          {/* 요약 정보 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">📊 오늘의 요약</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 총 수익: {(stats.totalEarnings + stats.mediaEarnings).toLocaleString()}원</p>
              <p>• 활성 사용자: {stats.newSellers + stats.newWorkers}명</p>
              <p>• 대기 중인 작업: {stats.pendingWithdrawals}건</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
    teal: "bg-teal-50 border-teal-200 text-teal-800",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-lg font-bold mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
};

const QuickLink = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
  >
    <span className="text-2xl mb-2">{icon}</span>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

export default DashboardOverview; 