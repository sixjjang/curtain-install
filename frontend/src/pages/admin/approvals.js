import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Navigation from '../../components/Navigation';
import { getRoleColors } from '../../utils/roleColors';
import { withRoleProtection } from '../../components/withRoleProtection';

function AdminApprovals() {
  const router = useRouter();
  const { user, userProfile, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // 관리자 권한 확인
    if (!hasRole('admin')) {
      router.push('/dashboard');
      return;
    }

    loadPendingUsers();
  }, [user, hasRole, router]);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      
      // 승인 대기 중인 사용자 조회
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('approvalStatus', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approved) => {
    try {
      setProcessing(true);
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isApproved: approved,
        approvalStatus: approved ? 'approved' : 'rejected',
        approvedAt: approved ? new Date() : null,
        approvedBy: user.uid,
        rejectionReason: approved ? null : selectedUser?.rejectionReason || '기준에 맞지 않음'
      });

      // 목록에서 제거
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setShowModal(false);
      setSelectedUser(null);
      
      alert(approved ? '사용자가 승인되었습니다.' : '사용자가 거부되었습니다.');
      
    } catch (error) {
      console.error('Error updating user approval:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date.toDate()).toLocaleString('ko-KR');
  };

  const getRoleLabel = (role) => {
    return role === 'seller' ? '판매자' : role === 'contractor' ? '시공기사' : role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="사용자 승인 관리" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">사용자 승인 관리</h1>
                <p className="text-gray-600 mt-1">승인 대기 중인 사용자들을 관리합니다.</p>
              </div>
              <div className="text-sm text-gray-500">
                총 {pendingUsers.length}명 대기 중
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      승인 대기 중인 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || '이름 없음'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.phone || '전화번호 없음'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColors(user.role).badge}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          승인 대기
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleApprove(user.id, true)}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => openModal(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          거부
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  사용자 상세 정보
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 기본 정보 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">이름:</span> {selectedUser.displayName || '이름 없음'}
                      </div>
                      <div>
                        <span className="font-medium">이메일:</span> {selectedUser.email}
                      </div>
                      <div>
                        <span className="font-medium">전화번호:</span> {selectedUser.phone || '전화번호 없음'}
                      </div>
                      <div>
                        <span className="font-medium">주소:</span> {selectedUser.address || '주소 없음'}
                      </div>
                      <div>
                        <span className="font-medium">역할:</span> {getRoleLabel(selectedUser.role)}
                      </div>
                      <div>
                        <span className="font-medium">가입일:</span> {formatDate(selectedUser.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 판매자 정보 */}
                {selectedUser.role === 'seller' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">사업자 정보</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">상호명:</span> {selectedUser.businessName || '상호명 없음'}
                        </div>
                        <div>
                          <span className="font-medium">사업자등록번호:</span> {selectedUser.businessNumber || '번호 없음'}
                        </div>
                        <div>
                          <span className="font-medium">사업장 주소:</span> {selectedUser.businessAddress || '주소 없음'}
                        </div>
                        <div>
                          <span className="font-medium">사업장 전화번호:</span> {selectedUser.businessPhone || '전화번호 없음'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">사업 설명:</span> {selectedUser.businessDescription || '설명 없음'}
                        </div>
                        {selectedUser.businessLicenseUrl && (
                          <div className="col-span-2">
                            <span className="font-medium">사업자등록증:</span>
                            <a 
                              href={selectedUser.businessLicenseUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-2"
                            >
                              보기
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 시공자 정보 */}
                {selectedUser.role === 'contractor' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">시공자 정보</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">경력:</span> {selectedUser.experience || '경력 없음'}
                        </div>
                        <div>
                          <span className="font-medium">시급:</span> {selectedUser.hourlyRate ? `${selectedUser.hourlyRate}원` : '시급 없음'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">보유 기술:</span> {selectedUser.skills?.join(', ') || '기술 없음'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">서비스 지역:</span> {selectedUser.serviceAreas?.join(', ') || '지역 없음'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">근무 가능 시간:</span> {selectedUser.availability?.hours || '시간 없음'}
                        </div>
                        {selectedUser.driverLicenseUrl && (
                          <div>
                            <span className="font-medium">운전면허증:</span>
                            <a 
                              href={selectedUser.driverLicenseUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-2"
                            >
                              보기
                            </a>
                          </div>
                        )}
                        {selectedUser.vehicleRegistrationUrl && (
                          <div>
                            <span className="font-medium">차량등록증:</span>
                            <a 
                              href={selectedUser.vehicleRegistrationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-2"
                            >
                              보기
                            </a>
                          </div>
                        )}
                        {selectedUser.insuranceCertificateUrl && (
                          <div>
                            <span className="font-medium">보험증서:</span>
                            <a 
                              href={selectedUser.insuranceCertificateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-2"
                            >
                              보기
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 거부 사유 입력 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">거부 사유 (선택사항)</h4>
                  <textarea
                    value={selectedUser.rejectionReason || ''}
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="거부 사유를 입력하세요..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleApprove(selectedUser.id, false)}
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? '처리 중...' : '거부'}
                </button>
                <button
                  onClick={() => handleApprove(selectedUser.id, true)}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? '처리 중...' : '승인'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 역할별 페이지 보호 적용 (관리자만 접근 가능)
export default withRoleProtection(AdminApprovals, ['admin']); 