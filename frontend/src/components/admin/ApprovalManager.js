import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function ApprovalManager() {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 승인 대기 중인 사용자들 실시간 감시
    const q = query(
      collection(db, 'users'),
      where('approvalStatus', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const approvals = [];
      
      for (const doc of snapshot.docs) {
        const userData = doc.data();
        let profileData = null;
        
        // 역할별 상세 프로필 가져오기
        try {
          if (userData.role === 'seller') {
            const sellerProfile = await getDocs(query(
              collection(db, 'sellerProfiles'),
              where('userId', '==', doc.id)
            ));
            if (!sellerProfile.empty) {
              profileData = sellerProfile.docs[0].data();
            }
          } else if (userData.role === 'contractor') {
            const contractorProfile = await getDocs(query(
              collection(db, 'contractorProfiles'),
              where('userId', '==', doc.id)
            ));
            if (!contractorProfile.empty) {
              profileData = contractorProfile.docs[0].data();
            }
          }
        } catch (error) {
          console.error('프로필 데이터 가져오기 실패:', error);
        }
        
        approvals.push({
          id: doc.id,
          ...userData,
          profileData
        });
      }
      
      setPendingApprovals(approvals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleApprove = async (approvalId) => {
    if (!confirm('이 사용자를 승인하시겠습니까?')) return;
    
    setProcessing(true);
    try {
      const userRef = doc(db, 'users', approvalId);
      await updateDoc(userRef, {
        approved: true,
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: user.uid
      });

      // 승인 알림 생성
      const notificationRef = doc(db, 'userNotifications', `${approvalId}_approval_approved`);
      await updateDoc(notificationRef, {
        userId: approvalId,
        type: 'approval_approved',
        title: '승인 완료',
        message: '요청하신 역할 승인이 완료되었습니다. 이제 서비스를 이용하실 수 있습니다.',
        status: 'unread',
        createdAt: serverTimestamp()
      }, { merge: true });

      alert('승인이 완료되었습니다.');
    } catch (error) {
      console.error('승인 처리 실패:', error);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedApproval.id);
      await updateDoc(userRef, {
        approved: false,
        approvalStatus: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: user.uid,
        rejectReason: rejectReason
      });

      // 거부 알림 생성
      const notificationRef = doc(db, 'userNotifications', `${selectedApproval.id}_approval_rejected`);
      await updateDoc(notificationRef, {
        userId: selectedApproval.id,
        type: 'approval_rejected',
        title: '승인 거부',
        message: `요청하신 역할 승인이 거부되었습니다. 사유: ${rejectReason}`,
        status: 'unread',
        createdAt: serverTimestamp()
      }, { merge: true });

      alert('승인이 거부되었습니다.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedApproval(null);
    } catch (error) {
      console.error('거부 처리 실패:', error);
      alert('거부 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
      case 'customer': return '고객';
      default: return role;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">승인 관리</h2>
        <div className="text-sm text-gray-600">
          총 {pendingApprovals.length}건의 승인 요청
        </div>
      </div>

      {pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">승인 대기 중인 요청이 없습니다</h3>
          <p className="text-gray-600">새로운 승인 요청이 들어오면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청 역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {approval.displayName?.charAt(0) || approval.email?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {approval.displayName || '이름 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {approval.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getRoleDisplayName(approval.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(approval.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        승인 대기
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowRejectModal(true);
                          }}
                          disabled={processing}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          거부
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {showDetailModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">승인 요청 상세</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
                  <div><span className="font-medium">이름:</span> {selectedApproval.displayName || '이름 없음'}</div>
                  <div><span className="font-medium">이메일:</span> {selectedApproval.email}</div>
                  <div><span className="font-medium">신청 역할:</span> {getRoleDisplayName(selectedApproval.role)}</div>
                  <div><span className="font-medium">신청일:</span> {formatDate(selectedApproval.createdAt)}</div>
                </div>
              </div>

              {selectedApproval.profileData && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">상세 정보</h4>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm">
                    {selectedApproval.role === 'seller' && (
                      <>
                        <div><span className="font-medium">회사명:</span> {selectedApproval.profileData.companyName}</div>
                        <div><span className="font-medium">대표자명:</span> {selectedApproval.profileData.representativeName}</div>
                        <div><span className="font-medium">사업자등록번호:</span> {selectedApproval.profileData.businessNumber}</div>
                        <div><span className="font-medium">연락처:</span> {selectedApproval.profileData.phoneNumber}</div>
                        <div><span className="font-medium">주소:</span> {selectedApproval.profileData.address}</div>
                        <div><span className="font-medium">업종:</span> {selectedApproval.profileData.businessType}</div>
                      </>
                    )}
                    {selectedApproval.role === 'contractor' && (
                      <>
                        <div><span className="font-medium">이름:</span> {selectedApproval.profileData.name}</div>
                        <div><span className="font-medium">연락처:</span> {selectedApproval.profileData.phoneNumber}</div>
                        <div><span className="font-medium">주소:</span> {selectedApproval.profileData.address}</div>
                        <div><span className="font-medium">전문 분야:</span> {selectedApproval.profileData.specialties?.join(', ')}</div>
                        <div><span className="font-medium">자격증:</span> {selectedApproval.profileData.certifications?.join(', ')}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거부 모달 */}
      {showRejectModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">승인 거부</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {selectedApproval.displayName || '사용자'}님의 {getRoleDisplayName(selectedApproval.role)} 승인을 거부하시겠습니까?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거부 사유 *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="거부 사유를 입력해주세요"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedApproval(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  processing || !rejectReason.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? '처리 중...' : '거부'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 