import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function Profile() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    company: '',
    role: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // 이미 프로필이 로드되었으면 다시 로드하지 않음
      if (profileLoaded) {
        return;
      }

      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        // Firestore에서 사용자 프로필 데이터 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let userData = null;
        
        if (userDoc.exists()) {
          userData = userDoc.data();
        }

        // 프로필 데이터 설정
        setProfile({
          name: userData?.displayName || user.displayName || user.email?.split('@')[0] || '사용자',
          phone: userData?.phone || '',
          address: userData?.address || '',
          company: userData?.businessName || userData?.company || '개인',
          role: userData?.role || userData?.primaryRole || 'customer'
        });
      } catch (error) {
        console.error('프로필 로드 실패:', error);
        // 기본값으로 설정
        setProfile({
          name: user.displayName || user.email?.split('@')[0] || '사용자',
          phone: '',
          address: '',
          company: '개인',
          role: 'customer'
        });
      } finally {
        setProfileLoading(false);
        setProfileLoaded(true);
      }
    };

    // useAuth의 loading이 완료되고 user가 있으면 프로필 로드
    if (!loading && user) {
      loadProfile();
    } else if (!loading && !user) {
      // 로그인되지 않은 경우
      setProfileLoading(false);
    }
  }, [user, loading, profileLoaded]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // 실제로는 Firebase에 업데이트
      setMessage('프로필이 업데이트되었습니다.');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('프로필 업데이트에 실패했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('새 비밀번호가 일치하지 않습니다.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      // 실제로는 Firebase Auth로 비밀번호 변경
      setMessage('비밀번호가 변경되었습니다.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('비밀번호 변경에 실패했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
      case 'admin': return '관리자';
      default: return '고객';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'seller': return '커튼 판매 및 시공요청 등록';
      case 'contractor': return '커튼 설치 작업 수행';
      case 'admin': return '시스템 관리';
      default: return '링크를 통한 접근만 가능';
    }
  };

  // 로딩 상태 체크 개선
  const isLoading = loading || (user && profileLoading && !profileLoaded);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="프로필" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {message && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 프로필 사진 업로드 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">프로필 사진</h2>
              <ProfilePhotoUpload 
                onPhotoUpdate={(photoURL) => {
                  setMessage('프로필 사진이 업데이트되었습니다.');
                  setTimeout(() => setMessage(''), 3000);
                }}
              />
            </div>
          </div>

          {/* 프로필 정보 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">프로필 정보</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {isEditing ? '취소' : '편집'}
                  </button>
                  <button
                    onClick={() => router.push('/profile-edit')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    상세 정보 변경
                  </button>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      회사/기관
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      역할
                    </label>
                    <div className="flex items-center">
                      <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
                        {getRoleDisplayName(profile.role)}
                      </span>
                      <span className="ml-3 text-sm text-gray-600">
                        {getRoleDescription(profile.role)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      역할은 가입 시 설정되며 변경할 수 없습니다.
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 계정 정보 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">가입일</p>
                  <p className="font-medium text-gray-900">
                    {user.metadata?.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : 
                      '정보 없음'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">마지막 로그인</p>
                  <p className="font-medium text-gray-900">
                    {user.metadata?.lastSignInTime ? 
                      new Date(user.metadata.lastSignInTime).toLocaleDateString('ko-KR') : 
                      '정보 없음'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">이메일 인증</p>
                  <p className="font-medium text-gray-900">
                    {user.emailVerified ? '완료' : '미완료'}
                  </p>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">보안</h3>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                비밀번호 변경
              </button>
            </div>

            {/* 계정 삭제 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">위험 영역</h3>
              <button
                className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                onClick={() => {
                  if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    // 계정 삭제 로직
                  }
                }}
              >
                계정 삭제
              </button>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 폼 */}
        {showPasswordForm && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  비밀번호 변경
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 