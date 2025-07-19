import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const { signInWithEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setShowResend(false);

    try {
      // Check if Firebase auth is available
      if (!auth) {
        setError('Firebase가 초기화되지 않았습니다. 환경 변수를 확인해주세요.');
        setIsLoading(false);
        return;
      }

      const result = await signInWithEmail(email, password);
      if (result && result.success) {
        // 이메일 인증 체크
        if (result.user && result.user.emailVerified === false) {
          setError('이메일 인증이 필요합니다. 이메일을 확인하고 인증을 완료해주세요.');
          setShowResend(true);
          setIsLoading(false);
          return;
        }
        router.push('/dashboard');
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      if (!auth) {
        setError('Firebase가 초기화되지 않았습니다.');
        return;
      }
      
      if (auth.currentUser) {
        // Import sendEmailVerification dynamically to avoid SSR issues
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(auth.currentUser);
        alert('인증 메일이 재발송되었습니다. 이메일을 확인해주세요.');
      } else {
        setError('로그인 후 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('인증 메일 재발송 중 오류가 발생했습니다.');
    }
  };

  const handleKakaoLogin = () => {
    // Kakao login implementation
    console.log('Kakao login clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation showBack={true} showMenu={false} title="로그인" />
      
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">커튼 설치 매칭 서비스를 이용하세요</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-gray-400">📧</span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base pr-12"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {showResend && (
                <button onClick={handleResendVerification} className="mt-2 w-full bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-2xl hover:bg-yellow-500 transition-all duration-200">인증 메일 재발송</button>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="my-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">또는</span>
                </div>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-4">
              <button
                onClick={handleKakaoLogin}
                className="w-full bg-yellow-400 text-gray-900 font-bold py-4 px-6 rounded-2xl hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-200 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">💬</span>
                  카카오로 로그인
                </div>
              </button>
            </div>

            {/* Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <Link
                  href="/password-reset"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  비밀번호 찾기
                </Link>
                <Link
                  href="/signup"
                  className="text-gray-600 hover:text-gray-700 font-medium transition-colors"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-center mb-3">
                <span className="text-blue-600 text-2xl mr-2">🎁</span>
                <h3 className="text-lg font-bold text-blue-900">신규 가입 혜택</h3>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                첫 주문 시 20% 할인 + 무료 상담
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                지금 가입하기
              </Link>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-gray-700 transition-colors">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-gray-700 transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/help" className="hover:text-gray-700 transition-colors">
                도움말
              </Link>
            </div>
      </div>
        </div>
      </div>
    </div>
  );
} 