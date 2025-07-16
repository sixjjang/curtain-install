import { useState } from "react";
import WorkerGradesAdmin from "./WorkerGradesAdmin";
import JobsAdmin from "./admin/JobsAdmin";
import PaymentsAdmin from "./admin/PaymentsAdmin";
import MediaAdmin from "./admin/MediaAdmin";
import MediaDownloadsAdmin from "./admin/MediaDownloadsAdmin";
import AdminRoleManager from "./AdminRoleManager";
import AdminLogs from "./admin/AdminLogs";
import DashboardOverview from "./admin/DashboardOverview";
import AdCreate from "./admin/AdCreate";
import AdDashboard from "./admin/AdDashboard";
import AdvertiserManagement from "./admin/AdvertiserManagement";
import AdvertiserPaymentManagement from "./admin/AdvertiserPaymentManagement";

const AdminDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState("overview");

  const menus = [
    { id: "overview", label: "대시보드", icon: "📊" },
    { id: "workerGrades", label: "시공기사 등급 관리", icon: "👷" },
    { id: "jobs", label: "시공 내역 관리", icon: "🏗️" },
    { id: "payments", label: "결제 관리", icon: "💰" },
    { id: "media", label: "사진/영상 관리", icon: "📸" },
    { id: "mediaDownloads", label: "미디어 다운로드 관리", icon: "⬇️" },
    { id: "adCreate", label: "광고 등록", icon: "📢" },
    { id: "adDashboard", label: "광고 통계", icon: "📈" },
    { id: "advertisers", label: "광고주 관리", icon: "🏢" },
    { id: "advertiserPayments", label: "광고주 결제 관리", icon: "💳" },
    { id: "adminRoles", label: "관리자 권한 관리", icon: "👑" },
    { id: "adminLogs", label: "관리자 활동 로그", icon: "📋" },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case "overview":
        return <DashboardOverview onNavigate={setSelectedMenu} />;
      case "workerGrades":
        return <WorkerGradesAdmin />;
      case "jobs":
        return <JobsAdmin />;
      case "payments":
        return <PaymentsAdmin />;
      case "media":
        return <MediaAdmin />;
      case "mediaDownloads":
        return <MediaDownloadsAdmin />;
      case "adCreate":
        return <AdCreate />;
      case "adDashboard":
        return <AdDashboard />;
      case "advertisers":
        return <AdvertiserManagement />;
      case "advertiserPayments":
        return <AdvertiserPaymentManagement />;
      case "adminRoles":
        return <AdminRoleManager />;
      case "adminLogs":
        return <AdminLogs />;
      default:
        return <DashboardOverview onNavigate={setSelectedMenu} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <nav className="w-64 bg-gray-800 text-white shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">관리자 대시보드</h1>
        </div>
        <ul className="p-4">
          {menus.map((menu) => (
            <li
              key={menu.id}
              className={`mb-2 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedMenu === menu.id 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-gray-700 text-gray-300"
              }`}
              onClick={() => setSelectedMenu(menu.id)}
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{menu.icon}</span>
                <span className="font-medium">{menu.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* 콘텐츠 영역 */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 