import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import WorkOrderStatusChanger from "../../components/WorkOrderStatusChanger";
import WorkOrderChat from "../../components/WorkOrderChat";
import WorkOrderPhotoUpload from "../../components/WorkOrderPhotoUpload";
import WorkOrderScheduleManager from "../../components/WorkOrderScheduleManager";
import { generateReviewLink, generateSMSReviewLink, generateEmailReviewLink } from "../../utils/reviewLinkGenerator";
import Navigation from "../../components/Navigation";
import PhoneCallButton from "../../components/PhoneCallButton";
import CollaborationRequestForm from "../../components/CollaborationRequestForm";
import { useAuth } from "../../hooks/useAuth";

export default function WorkOrderDetail() {
  const router = useRouter();
  const { id, tab } = router.query;
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewLinkModal, setShowReviewLinkModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || 'details');

  useEffect(() => {
    if (!id) {
      setError("작업 주문 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    const workOrderRef = doc(db, "workOrders", id);

    const unsubscribe = onSnapshot(
      workOrderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkOrder({ 
            id: docSnap.id, 
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
            scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate
          });
          setError(null);
        } else {
          setError("작업 정보를 찾을 수 없습니다.");
          setWorkOrder(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("작업 주문 조회 실패:", error);
        setError("작업 정보를 불러오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleStatusChanged = (newStatus) => {
    setWorkOrder((prev) => ({ ...prev, status: newStatus }));
    console.log(`작업 상태가 ${newStatus}로 변경되었습니다.`);
  };

  const handleBackToList = () => {
    router.push('/workorder/list');
  };

  const handleGenerateReviewLink = () => {
    setShowReviewLinkModal(true);
  };

  const handleCopyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleSendSMS = () => {
    const smsInfo = generateSMSReviewLink(workOrder.id);
    const smsUrl = `sms:${workOrder.customerPhone}?body=${encodeURIComponent(smsInfo.smsText)}`;
    window.open(smsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    const emailInfo = generateEmailReviewLink(workOrder.id, workOrder.customerName);
    const emailUrl = `mailto:?subject=${encodeURIComponent(emailInfo.subject)}&body=${encodeURIComponent(emailInfo.body)}`;
    window.open(emailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    router.push(`/workorder/${id}?tab=${tabName}`, undefined, { shallow: true });
  };

  const formatDate = (date) => {
    if (!date) return "미정";
    if (date instanceof Date) {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getStatusColor = (status) => {
    const colors = {
      '등록': 'bg-blue-100 text-blue-800',
      '배정완료': 'bg-yellow-100 text-yellow-800',
      '진행중': 'bg-orange-100 text-orange-800',
      '완료': 'bg-green-100 text-green-800',
      '취소': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">작업 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleBackToList}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="작업 상세 정보" />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">작업 정보를 찾을 수 없습니다.</p>
            <button
              onClick={handleBackToList}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="작업 상세 정보" />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">작업 상세 정보</h1>
            <p className="text-gray-600 mt-1">
              작업 주문 ID: 
              <span className="font-mono text-blue-600 ml-1">
                {workOrder.id}
              </span>
            </p>
          </div>
          <div className="flex space-x-3">
            {/* 협업요청 버튼 - 시공자이고 배정완료 상태일 때만 표시 */}
            {user && workOrder.contractorId === user.uid && workOrder.status === '배정완료' && !workOrder.collaborationRequestId && (
              <button
                onClick={() => setShowCollaborationModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <span className="mr-2">🤝</span>
                협업요청
              </button>
            )}
            
            {workOrder.status === '완료' && !workOrder.reviewCompleted && (
              <button
                onClick={handleGenerateReviewLink}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">⭐</span>
                평가 링크 생성
              </button>
            )}
            <button
              onClick={handleBackToList}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white border rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 상세정보
              </button>
              <button
                onClick={() => handleTabChange('chat')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💬 채팅
              </button>
              <button
                onClick={() => handleTabChange('photos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'photos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📸 사진업로드
              </button>
              <button
                onClick={() => handleTabChange('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📅 일정관리
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white border rounded-lg shadow-sm">
          {activeTab === 'details' && (
            <div className="p-6">
              {/* 작업 정보 카드 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고객명
                    </label>
                    <p className="text-gray-900">{workOrder.customerName || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      현재 상태
                    </label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(workOrder.status)}`}>
                      {workOrder.status || '미정'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시공 장소
                    </label>
                    <p className="text-gray-900">{workOrder.location || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시공 예정일
                    </label>
                    <p className="text-gray-900">{formatDate(workOrder.scheduledDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고객 연락처
                    </label>
                    <div className="space-y-2">
                      <p className="text-gray-900">
                        {workOrder.workerPhone || workOrder.customerPhone || "미입력"}
                        {workOrder.workerPhone && workOrder.customerPhone && workOrder.workerPhone !== workOrder.customerPhone && (
                          <span className="ml-2 text-xs text-blue-600">(070 변환)</span>
                        )}
                      </p>
                      {(workOrder.workerPhone || workOrder.customerPhone) && (
                        <PhoneCallButton
                          phoneNumber={workOrder.workerPhone || workOrder.customerPhone}
                          displayName={workOrder.customerName}
                          showSMS={true}
                          showMasked={false}
                          size="small"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      긴급 수수료
                    </label>
                    <p className="text-gray-900">
                      {workOrder.urgentFeeRate > 0 ? `${workOrder.urgentFeeRate}%` : "없음"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 판매자 정보 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  판매자 정보
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      판매자명
                    </label>
                    <p className="text-gray-900 font-medium">{workOrder.sellerName || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      판매자 연락처
                    </label>
                    <div className="space-y-2">
                      <p className="text-gray-900">
                        {workOrder.sellerPhone || workOrder.sellerBusinessPhone || "미입력"}
                      </p>
                      {(workOrder.sellerPhone || workOrder.sellerBusinessPhone) && (
                        <PhoneCallButton
                          phoneNumber={workOrder.sellerPhone || workOrder.sellerBusinessPhone}
                          displayName={workOrder.sellerName}
                          showSMS={true}
                          showMasked={false}
                          size="small"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      판매자 이메일
                    </label>
                    <p className="text-gray-900">{workOrder.sellerEmail || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업장명
                    </label>
                    <p className="text-gray-900">{workOrder.sellerBusinessName || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업자등록번호
                    </label>
                    <p className="text-gray-900 font-mono">{workOrder.sellerBusinessNumber || "미입력"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업장 연락처
                    </label>
                    <p className="text-gray-900">{workOrder.sellerBusinessPhone || "미입력"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사업장 주소
                    </label>
                    <p className="text-gray-900">{workOrder.sellerBusinessAddress || workOrder.sellerAddress || "미입력"}</p>
                  </div>
                </div>
              </div>

              {/* 제품 정보 */}
              {workOrder.products && workOrder.products.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">제품 정보</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left font-semibold">제품명</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">수량</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">단위</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold">설명</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workOrder.products.map((product, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-3">{product.name}</td>
                            <td className="border border-gray-300 p-3">{product.quantity}</td>
                            <td className="border border-gray-300 p-3">{product.unit}</td>
                            <td className="border border-gray-300 p-3">{product.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 첨부된 발주서 이미지 */}
              {workOrder.attachedImages && workOrder.attachedImages.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    첨부된 발주서 ({workOrder.attachedImages.length}개)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workOrder.attachedImages.map((image, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <img 
                          src={image.url} 
                          alt={`발주서 ${index + 1}`}
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(image.url, '_blank')}
                        />
                        <div className="p-3 bg-gray-50">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 추가 요청사항 */}
              {workOrder.additionalNotes && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">추가 요청사항</h2>
                  <p className="text-gray-900">{workOrder.additionalNotes}</p>
                </div>
              )}

              {/* 상태 변경 */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">상태 관리</h2>
                <WorkOrderStatusChanger 
                  workOrderId={workOrder.id}
                  currentStatus={workOrder.status}
                  onStatusChanged={handleStatusChanged}
                />
              </div>

              {/* 타임스탬프 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">타임스탬프</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      생성일
                    </label>
                    <p className="text-gray-900">{formatDate(workOrder.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수정일
                    </label>
                    <p className="text-gray-900">{formatDate(workOrder.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">소통 채널</h2>
              <p className="text-sm text-gray-600 mb-4">
                시공자와 고객이 안전하게 소통할 수 있는 채팅방입니다.
              </p>
              <WorkOrderChat 
                workOrderId={workOrder.id}
                userType="worker"
              />
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="p-6">
              <WorkOrderPhotoUpload workOrderId={workOrder.id} />
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="p-6">
              <WorkOrderScheduleManager workOrderId={workOrder.id} workOrder={workOrder} />
            </div>
          )}
        </div>
      </div>

      {/* 평가 링크 생성 모달 */}
      {showReviewLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">고객 평가 링크</h3>
              <button
                onClick={() => setShowReviewLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">평가 링크</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generateReviewLink(workOrder.id)}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(generateReviewLink(workOrder.id))}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    복사
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">링크 전송 방법</h4>
                
                {workOrder.customerPhone && (
                  <button
                    onClick={handleSendSMS}
                    className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">📱</span>
                      <span>SMS로 전송</span>
                    </div>
                    <span className="text-sm text-gray-500">→</span>
                  </button>
                )}
                
                <button
                  onClick={handleSendEmail}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">📧</span>
                    <span>이메일로 전송</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-lg">💡</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">고객 안내사항:</p>
                    <ul className="space-y-1">
                      <li>• 앱 설치 없이 웹 브라우저에서 평가 가능</li>
                      <li>• 링크는 한 번만 사용 가능</li>
                      <li>• 30일 후 자동 만료</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 협업요청 모달 */}
      {showCollaborationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CollaborationRequestForm
              workOrder={workOrder}
              onSuccess={() => {
                setShowCollaborationModal(false);
                // 페이지 새로고침하여 협업요청 상태 반영
                window.location.reload();
              }}
              onCancel={() => setShowCollaborationModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}