import React, { useState } from 'react';
import { useAuth, USER_ROLES } from '../hooks/useAuth';

const AuthComponent = () => {
  const {
    user,
    userProfile,
    loading,
    error,
    sendEmailLink,
    completeEmailSignIn,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateUserProfile,
    sendPasswordResetEmail,
    clearError,
    USER_ROLES
  } = useAuth();

  const [authMode, setAuthMode] = useState('signin'); // 'signin', 'signup', 'email-link', 'reset-password'
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CUSTOMER);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    businessName: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle email link authentication
  const handleEmailLinkAuth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      const result = await sendEmailLink(formData.email, selectedRole);
      alert(result.message);
      setFormData(prev => ({ ...prev, email: '' }));
    } catch (err) {
      console.error('Email link auth error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearError();

    try {
      await signInWithGoogle(selectedRole);
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email/password sign up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address
      };

      // Add role-specific data
      if (selectedRole === USER_ROLES.SELLER) {
        userData.businessName = formData.businessName;
      }

      await signUpWithEmail(formData.email, formData.password, userData, selectedRole);
      alert('회원가입이 완료되었습니다!');
    } catch (err) {
      console.error('Email sign up error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email/password sign in
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      await signInWithEmail(formData.email, formData.password);
    } catch (err) {
      console.error('Email sign in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      const result = await sendPasswordResetEmail(formData.email);
      alert(result.message);
      setAuthMode('signin');
    } catch (err) {
      console.error('Password reset error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      alert('로그아웃되었습니다.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Complete email sign in (for email link verification)
  React.useEffect(() => {
    const completeSignIn = async () => {
      if (window.location.href.includes('apiKey=')) {
        try {
          await completeEmailSignIn();
          alert('이메일 인증이 완료되었습니다!');
        } catch (err) {
          console.error('Complete email sign in error:', err);
        }
      }
    };

    completeSignIn();
  }, [completeEmailSignIn]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">로그인됨</h2>
        
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">{user.displayName || user.email}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              {userProfile && (
                <p className="text-xs text-blue-600 capitalize">{userProfile.role}</p>
              )}
            </div>
          </div>
        </div>

        {userProfile && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">프로필 정보</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">역할:</span> {userProfile.role}</p>
              <p><span className="font-medium">가입일:</span> {userProfile.createdAt?.toDate?.()?.toLocaleDateString()}</p>
              <p><span className="font-medium">마지막 로그인:</span> {userProfile.lastLoginAt?.toDate?.()?.toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {authMode === 'signin' && '로그인'}
        {authMode === 'signup' && '회원가입'}
        {authMode === 'email-link' && '이메일 링크 로그인'}
        {authMode === 'reset-password' && '비밀번호 재설정'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error.message}
        </div>
      )}

      {/* Role Selection */}
      {(authMode === 'signup' || authMode === 'email-link') && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            계정 유형 선택
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(USER_ROLES).map(([key, value]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={`p-2 text-sm rounded border transition-colors ${
                  selectedRole === value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {value === USER_ROLES.CUSTOMER && '고객'}
                {value === USER_ROLES.SELLER && '판매자'}
                {value === USER_ROLES.CONTRACTOR && '시공기사'}
                {value === USER_ROLES.ADMIN && '관리자'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email Link Authentication */}
      {authMode === 'email-link' && (
        <form onSubmit={handleEmailLinkAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : '이메일 링크로 로그인'}
          </button>
        </form>
      )}

      {/* Email/Password Sign Up */}
      {authMode === 'signup' && (
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="최소 6자"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호 재입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
            />
          </div>

          {selectedRole === USER_ROLES.SELLER && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자명
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="커튼 전문점"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="서울시 강남구..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : '회원가입'}
          </button>
        </form>
      )}

      {/* Email/Password Sign In */}
      {authMode === 'signin' && (
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      )}

      {/* Password Reset */}
      {authMode === 'reset-password' && (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : '비밀번호 재설정 메일 발송'}
          </button>
        </form>
      )}

      {/* Google Sign In Button */}
      {authMode === 'signin' && (
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 로그인</span>
          </button>
        </div>
      )}

      {/* Mode Switching */}
      <div className="mt-6 text-center space-y-2">
        {authMode === 'signin' && (
          <>
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="text-blue-600 hover:underline"
              >
                회원가입
              </button>
            </p>
            <p className="text-sm text-gray-600">
              <button
                onClick={() => setAuthMode('email-link')}
                className="text-blue-600 hover:underline"
              >
                이메일 링크로 로그인
              </button>
            </p>
            <p className="text-sm text-gray-600">
              <button
                onClick={() => setAuthMode('reset-password')}
                className="text-blue-600 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </p>
          </>
        )}

        {authMode === 'signup' && (
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => setAuthMode('signin')}
              className="text-blue-600 hover:underline"
            >
              로그인
            </button>
          </p>
        )}

        {authMode === 'email-link' && (
          <p className="text-sm text-gray-600">
            <button
              onClick={() => setAuthMode('signin')}
              className="text-blue-600 hover:underline"
            >
              다른 방법으로 로그인
            </button>
          </p>
        )}

        {authMode === 'reset-password' && (
          <p className="text-sm text-gray-600">
            <button
              onClick={() => setAuthMode('signin')}
              className="text-blue-600 hover:underline"
            >
              로그인으로 돌아가기
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthComponent; 