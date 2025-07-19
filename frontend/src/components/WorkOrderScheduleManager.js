import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';

const WorkOrderScheduleManager = ({ workOrderId, workOrder }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [scheduleChangeReason, setScheduleChangeReason] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  useEffect(() => {
    if (workOrder?.scheduledDate) {
      const date = workOrder.scheduledDate?.toDate?.() || new Date(workOrder.scheduledDate);
      setNewScheduledDate(date.toISOString().split('T')[0]);
      setNewScheduledTime(date.toTimeString().slice(0, 5));
    }
  }, [workOrder]);

  const handleScheduleChange = async () => {
    if (!newScheduledDate || !newScheduledTime || !scheduleChangeReason.trim()) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const newDateTime = new Date(`${newScheduledDate}T${newScheduledTime}`);
      
      // 과거 날짜 체크
      if (newDateTime < new Date()) {
        alert('과거 날짜로는 일정을 변경할 수 없습니다.');
        return;
      }
      
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      await updateDoc(workOrderRef, {
        scheduledDate: newDateTime,
        scheduleChangeHistory: [
          ...(workOrder.scheduleChangeHistory || []),
          {
            previousDate: workOrder.scheduledDate,
            newDate: newDateTime,
            changedBy: user.uid,
            changedByName: userData?.displayName || user?.displayName || '시공자',
            reason: scheduleChangeReason,
            changedAt: new Date()
          }
        ],
        updatedAt: serverTimestamp()
      });

      // 채팅에 일정 변경 메시지 추가
      await addScheduleChangeMessage(newDateTime, scheduleChangeReason);

      alert('일정이 성공적으로 변경되었습니다.');
      setShowScheduleModal(false);
      setScheduleChangeReason('');
      
      // 부모 컴포넌트에 변경 알림
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workOrderUpdated', { 
          detail: { workOrderId, type: 'scheduleChanged' } 
        }));
      }
      
    } catch (error) {
      console.error('일정 변경 실패:', error);
      alert('일정 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addScheduleChangeMessage = async (newDateTime, reason) => {
    try {
      // 채팅 메시지 추가 로직
      const messageData = {
        workOrderId: workOrderId,
        senderId: user.uid,
        senderName: userData?.displayName || user?.displayName || '시공자',
        senderType: 'worker',
        message: `📅 일정이 변경되었습니다.\n새 일정: ${newDateTime.toLocaleDateString('ko-KR')} ${newDateTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}\n변경 사유: ${reason}`,
        messageType: 'schedule_change',
        timestamp: serverTimestamp()
      };

      // 채팅 컬렉션에 메시지 추가
      const chatRef = collection(db, 'workOrderChats');
      await addDoc(chatRef, messageData);
    } catch (error) {
      console.error('채팅 메시지 추가 실패:', error);
    }
  };

  const handleCompletion = async () => {
    if (!completionNotes.trim()) {
      alert('완료 메모를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const workOrderRef = doc(db, 'workOrders', workOrderId);
      await updateDoc(workOrderRef, {
        status: '완료',
        completedAt: new Date(),
        completedBy: user.uid,
        completedByName: userData?.displayName || user?.displayName || '시공자',
        completionNotes: completionNotes,
        updatedAt: serverTimestamp()
      });

      // 채팅에 완료 메시지 추가
      await addCompletionMessage(completionNotes);

      // 판매자에게 알림 (FCM 또는 이메일)
      await notifySellerOfCompletion();

      alert('작업이 완료 처리되었습니다.');
      setShowCompletionModal(false);
      setCompletionNotes('');
      
      // 부모 컴포넌트에 변경 알림
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workOrderUpdated', { 
          detail: { workOrderId, type: 'completed' } 
        }));
      }
      
    } catch (error) {
      console.error('완료 처리 실패:', error);
      alert('완료 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addCompletionMessage = async (notes) => {
    try {
      const messageData = {
        workOrderId: workOrderId,
        senderId: user.uid,
        senderName: userData?.displayName || user?.displayName || '시공자',
        senderType: 'worker',
        message: `✅ 시공이 완료되었습니다.\n완료 메모: ${notes}`,
        messageType: 'completion',
        timestamp: serverTimestamp()
      };

      const chatRef = collection(db, 'workOrderChats');
      await addDoc(chatRef, messageData);
    } catch (error) {
      console.error('완료 메시지 추가 실패:', error);
    }
  };

  const notifySellerOfCompletion = async () => {
    try {
      // 판매자에게 FCM 알림 전송
      if (workOrder.sellerId) {
        const notificationData = {
          recipientId: workOrder.sellerId,
          title: '시공 완료 알림',
          body: `${workOrder.customerName}님의 시공이 완료되었습니다.`,
          data: {
            workOrderId: workOrderId,
            type: 'completion'
          },
          timestamp: serverTimestamp()
        };

        const notificationRef = collection(db, 'notifications');
        await addDoc(notificationRef, notificationData);
      }
    } catch (error) {
      console.error('판매자 알림 전송 실패:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '미정';
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canChangeSchedule = () => {
    // 시공자만 일정 변경 가능
    const isContractor = userData?.role === 'contractor';
    const isAssignedContractor = workOrder?.contractorId === user?.uid;
    const canChangeStatus = workOrder?.status === '진행중' || workOrder?.status === '등록';
    
    return isContractor && isAssignedContractor && canChangeStatus;
  };

  const canComplete = () => {
    // 시공자만 완료 처리 가능
    const isContractor = userData?.role === 'contractor';
    const isAssignedContractor = workOrder?.contractorId === user?.uid;
    const isInProgress = workOrder?.status === '진행중';
    
    return isContractor && isAssignedContractor && isInProgress;
  };

  return (
    <div className="space-y-6">
      {/* 현재 일정 정보 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 현재 일정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              예정일
            </label>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(workOrder?.scheduledDate)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 상태
            </label>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              workOrder?.status === '완료' ? 'bg-green-100 text-green-800' :
              workOrder?.status === '진행중' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {workOrder?.status || '미정'}
            </span>
          </div>
        </div>
      </div>

      {/* 일정 변경 이력 */}
      {workOrder?.scheduleChangeHistory && workOrder.scheduleChangeHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 일정 변경 이력</h3>
          <div className="space-y-3">
            {workOrder.scheduleChangeHistory.map((change, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(change.previousDate)} → {formatDate(change.newDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      변경자: {change.changedByName}
                    </p>
                    <p className="text-sm text-gray-600">
                      사유: {change.reason}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {change.changedAt?.toDate?.().toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 작업 완료 정보 */}
      {workOrder?.status === '완료' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 완료 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                완료일
              </label>
              <p className="text-gray-900">
                {formatDate(workOrder?.completedAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                완료자
              </label>
              <p className="text-gray-900">
                {workOrder?.completedByName || '미입력'}
              </p>
            </div>
            {workOrder?.completionNotes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  완료 메모
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                  {workOrder.completionNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 작업 관리</h3>
        <div className="flex flex-wrap gap-4">
          {canChangeSchedule() && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              📅 일정 변경
            </button>
          )}
          
          {canComplete() && (
            <button
              onClick={() => setShowCompletionModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              ✅ 완료 처리
            </button>
          )}
          
          {!canChangeSchedule() && !canComplete() && (
            <div className="text-gray-500 text-sm">
              현재 상태에서는 추가 작업을 수행할 수 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 일정 변경 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">일정 변경</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새로운 날짜
                </label>
                <input
                  type="date"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새로운 시간
                </label>
                <input
                  type="time"
                  value={newScheduledTime}
                  onChange={(e) => setNewScheduledTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  변경 사유
                </label>
                <textarea
                  value={scheduleChangeReason}
                  onChange={(e) => setScheduleChangeReason(e.target.value)}
                  placeholder="일정 변경 사유를 입력해주세요..."
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleScheduleChange}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '변경 중...' : '변경하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 완료 처리 모달 */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">작업 완료 처리</h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">완료 처리 시 주의사항:</p>
                    <ul className="space-y-1">
                      <li>• 시공이 실제로 완료되었는지 확인</li>
                      <li>• 고객과 최종 확인 완료</li>
                      <li>• 완료 후에는 상태 변경이 제한됨</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  완료 메모
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="완료 메모를 입력해주세요..."
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCompletion}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '처리 중...' : '완료 처리'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderScheduleManager; 