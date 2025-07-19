import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import InsteamLogo from '../components/InsteamLogo';
import KakaoLogin from '../components/KakaoLogin';
import RoleSelectionModal from '../components/RoleSelectionModal';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithEmail, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
        setError('Firebase 설정이 필요합니다. 관리자에게 문의해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // 소셜 로그인 후 항상 역할 선택 모달 표시
        setPendingUser(result.user);
        setShowRoleModal(true);
      } else {
        setError(result.error || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
        setError('Firebase 설정이 필요합니다. 관리자에게 문의해주세요.');
      } else {
        setError('Google 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async (userInfo) => {
    setError('');
    setIsLoading(true);

    try {
      // Kakao 로그인 후 역할 선택 모달 표시
      setPendingUser(userInfo);
      setShowRoleModal(true);
    } catch (error) {
      console.error('Kakao login error:', error);
      setError('Kakao 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role, additionalData = {}) => {
    try {
      let result;
      
      if (pendingUser.provider === 'google') {
        result = await signInWithGoogle(role, additionalData);
      } else if (pendingUser.provider === 'kakao') {
        // Kakao 로그인 처리
        result = { success: true, user: pendingUser };
      }

      if (result.success) {
        setShowRoleModal(false);
        setPendingUser(null);
        if (role === 'seller') router.push('/profile-setup/seller');
        else if (role === 'contractor') router.push('/profile-setup/contractor');
        else router.push('/dashboard');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      if (error.message.includes('Firebase가 초기화되지 않았습니다')) {
        setError('Firebase 설정이 필요합니다. 관리자에게 문의해주세요.');
      } else {
        setError('역할 선택 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      <Head>
        <title>로그인 - Insteam</title>
        <meta name="description" content="Insteam에 로그인하여 설치 전문가 플랫폼을 이용하세요" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <Navigation showBack={true} showMenu={false} />
        
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo and Title */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <InsteamLogo size="xl" showText={true} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                로그인
              </h2>
              <p className="text-gray-600">
                Insteam에 로그인하여 설치 전문가 플랫폼을 이용하세요
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {/* Email/Password Form */}
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 주소
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="비밀번호를 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="ml-3 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      로그인 중...
                    </div>
                  ) : (
                    '로그인'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">또는</span>
                  </div>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-4">
                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 로그인
                </button>

                {/* Kakao Login */}
                <KakaoLogin onLogin={handleKakaoLogin} disabled={isLoading} />
              </div>

              {/* Links */}
              <div className="mt-6 text-center space-y-3">
                <Link 
                  href="/password-reset"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                >
                  비밀번호를 잊으셨나요?
                </Link>
                <div className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <Link 
                    href="/signup"
                    className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                  >
                    회원가입
                  </Link>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="text-center">
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 text-lg">🔒</span>
                  </div>
                  <span>안전한 로그인</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-green-600 text-lg">⚡</span>
                  </div>
                  <span>빠른 접속</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 text-lg">🤝</span>
                  </div>
                  <span>소셜 로그인</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection Modal */}
        {showRoleModal && pendingUser && (
          <RoleSelectionModal
            isOpen={showRoleModal}
            onClose={() => {
              setShowRoleModal(false);
              setPendingUser(null);
            }}
            onRoleSelect={handleRoleSelection}
            user={pendingUser}
          />
        )}
      </div>
    </>
  );
} 