import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function CustomerProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    preferredContactTime: '',
    preferredContactMethod: '',
    projectType: '',
    budget: '',
    timeline: '',
    additionalNotes: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // 이미 승인된 사용자인지 확인
    if (user.role === 'customer' && user.approved) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return '이름을 입력해주세요.';
    if (!formData.phoneNumber.trim()) return '연락처를 입력해주세요.';
    if (!formData.address.trim()) return '주소를 입력해주세요.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const customerProfileRef = doc(db, 'customerProfiles', user.uid);
      
      // 사용자 기본 정보 업데이트
      await setDoc(userRef, {
        ...user,
        role: 'customer',
        primaryRole: 'customer',
        roles: ['customer'],
        profileCompleted: true,
        approvalStatus: 'approved', // 고객은 자동 승인
        approved: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 고객 상세 프로필 저장
      await setDoc(customerProfileRef, {
        userId: user.uid,
        ...formData,
        approvalStatus: 'approved',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <>
      <Head>
        <title>고객 프로필 설정 - Insteam</title>
        <meta name="description" content="고객 프로필을 설정하세요." />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <Navigation title="고객 프로필 설정" />
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">고객 프로필 설정</h1>
              <p className="text-gray-600 mt-2">서비스 이용을 위한 기본 정보를 입력해주세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">기본 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처 *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소 *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="서비스가 필요한 주소를 입력하세요"
                  />
                </div>
              </div>

              {/* 선호사항 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">선호사항</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      선호 연락 시간
                    </label>
                    <select
                      name="preferredContactTime"
                      value={formData.preferredContactTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="오전 (09:00-12:00)">오전 (09:00-12:00)</option>
                      <option value="오후 (12:00-18:00)">오후 (12:00-18:00)</option>
                      <option value="저녁 (18:00-21:00)">저녁 (18:00-21:00)</option>
                      <option value="상관없음">상관없음</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      선호 연락 방법
                    </label>
                    <select
                      name="preferredContactMethod"
                      value={formData.preferredContactMethod}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="전화">전화</option>
                      <option value="문자">문자</option>
                      <option value="카카오톡">카카오톡</option>
                      <option value="이메일">이메일</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 프로젝트 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">프로젝트 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      프로젝트 유형
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="커튼 설치">커튼 설치</option>
                      <option value="블라인드 설치">블라인드 설치</option>
                      <option value="롤스크린 설치">롤스크린 설치</option>
                      <option value="버티컬 설치">버티컬 설치</option>
                      <option value="로만쉐이드 설치">로만쉐이드 설치</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      예산 범위
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      <option value="50만원 미만">50만원 미만</option>
                      <option value="50-100만원">50-100만원</option>
                      <option value="100-200만원">100-200만원</option>
                      <option value="200-500만원">200-500만원</option>
                      <option value="500만원 이상">500만원 이상</option>
                      <option value="상담 후 결정">상담 후 결정</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    희망 완료 시기
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    <option value="1주일 이내">1주일 이내</option>
                    <option value="2주일 이내">2주일 이내</option>
                    <option value="1개월 이내">1개월 이내</option>
                    <option value="2개월 이내">2개월 이내</option>
                    <option value="3개월 이내">3개월 이내</option>
                    <option value="상담 후 결정">상담 후 결정</option>
                  </select>
                </div>
              </div>

              {/* 추가 요청사항 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">추가 요청사항</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    특별 요청사항
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="특별한 요청사항이나 참고사항이 있다면 작성해주세요"
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  나중에 하기
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? '처리 중...' : '프로필 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 