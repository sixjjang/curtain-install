import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";

const Dashboard = () => {
  const { user, userData, loading } = useAuth();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
        <p className="text-gray-600">서비스를 이용하려면 로그인해주세요.</p>
      </div>
    );
  }

  const isSeller = userData?.role === "seller";
  const isWorker = userData?.role === "worker";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isSeller ? "판매자" : "시공자"} 대시보드
            </h1>
            <p className="text-gray-600 mt-2">
              안녕하세요, {user.email}님!
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">역할</div>
            <div className="font-semibold text-blue-600">
              {isSeller ? "판매자" : "시공자"}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("projects")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "projects"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {isSeller ? "내 시공건" : "모집중인 시공건"}
            </button>
            {isSeller && (
              <button
                onClick={() => setActiveTab("create")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "create"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                새 시공건 등록
              </button>
            )}
            <button
              onClick={() => setActiveTab("photos")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "photos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              사진/영상
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              평가
            </button>
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === "projects" && (
          <div>
            {isSeller && (
              <div className="mb-6">
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  + 새 시공건 등록
                </button>
              </div>
            )}
            <ProjectList userRole={userData?.role} />
          </div>
        )}

        {activeTab === "create" && isSeller && (
          <div>
            <button
              onClick={() => setActiveTab("projects")}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← 목록으로 돌아가기
            </button>
            <ProjectForm onSuccess={() => setActiveTab("projects")} />
          </div>
        )}

        {activeTab === "photos" && (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">사진/영상 관리</h3>
            <p className="text-gray-600">사진/영상 업로드 및 관리 기능이 준비 중입니다.</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold mb-4">평가 관리</h3>
            <p className="text-gray-600">평가 작성 및 조회 기능이 준비 중입니다.</p>
          </div>
        )}
      </div>

      {/* 새 프로젝트 생성 모달 */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">새 시공건 등록</h2>
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <ProjectForm 
                onSuccess={() => {
                  setShowProjectForm(false);
                  setActiveTab("projects");
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 