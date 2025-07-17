import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Navigation from '../components/Navigation';

export default function SignupPage() {
  const router = useRouter();
  const auth = getAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    userType: 'customer', // customer, worker, admin
    companyName: '',
    licenseNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 검증
    if (!formData.email || !formData.password || !formData.name || !formData.phone) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (formData.userType === 'worker' && !formData.licenseNumber) {
      setError('시공기사는 자격증 번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Firebase Auth로 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const user = userCredential.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        userType: formData.userType,
        companyName: formData.companyName || '',
        licenseNumber: formData.licenseNumber || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      // 성공 메시지
      alert('회원가입이 완료되었습니다!');
      
      // 사용자 타입에 따라 리다이렉트
      switch (formData.userType) {
        case 'customer':
          router.push('/workorder/new');
          break;
        case 'worker':
          router.push('/workorder/worker');
          break;
        case 'admin':
          router.push('/admin');
          break;
        default:
          router.push('/');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      // Firebase 설정 오류인 경우 임시 처리
      if (error.code === 'auth/configuration-not-found') {
        alert('Firebase 설정이 완료되지 않았습니다. 임시로 회원가입을 시뮬레이션합니다.');
        
        // 임시 사용자 ID 생성
        const tempUserId = 'temp_' + Date.now();
        
        // 로컬 스토리지에 임시 사용자 정보 저장
        const tempUser = {
          uid: tempUserId,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          userType: formData.userType,
          companyName: formData.companyName || '',
          licenseNumber: formData.licenseNumber || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
        
        localStorage.setItem('tempUser', JSON.stringify(tempUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        alert('임시 회원가입이 완료되었습니다! (Firebase 설정 후 실제 회원가입이 가능합니다)');
        
        // 사용자 타입에 따라 리다이렉트
        switch (formData.userType) {
          case 'customer':
            router.push('/workorder/new');
            break;
          case 'worker':
            router.push('/workorder/worker');
            break;
          case 'admin':
            router.push('/admin');
            break;
          default:
            router.push('/');
        }
        return;
      }
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/invalid-email':
          setError('올바르지 않은 이메일 형식입니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호가 너무 약합니다.');
          break;
        default:
          setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="회원가입" />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white border rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
            <p className="text-gray-600 mt-2">계정 유형을 선택하고 정보를 입력해주세요</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
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
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 계정 유형 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                계정 유형 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={formData.userType === 'customer'}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.userType === 'customer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏠</div>
                      <div className="font-medium text-gray-900">시공 의뢰인</div>
                      <div className="text-sm text-gray-600">커튼 설치를 요청하는 고객</div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="worker"
                    checked={formData.userType === 'worker'}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.userType === 'worker' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">👷</div>
                      <div className="font-medium text-gray-900">시공기사</div>
                      <div className="text-sm text-gray-600">커튼 설치를 수행하는 전문가</div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="userType"
                    value="admin"
                    checked={formData.userType === 'admin'}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.userType === 'admin' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚙️</div>
                      <div className="font-medium text-gray-900">관리자</div>
                      <div className="text-sm text-gray-600">시스템 관리 및 운영</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="실명을 입력하세요"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-1234-5678"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 시공기사 전용 필드 */}
            {formData.userType === 'worker' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회사명
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="소속 회사명"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    자격증 번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="시공 자격증 번호"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* 계정 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최소 6자 이상"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="비밀번호를 다시 입력하세요"
                disabled={loading}
              />
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                로그인으로
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    가입 중...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    회원가입
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 