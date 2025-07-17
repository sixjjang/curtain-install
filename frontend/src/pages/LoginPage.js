import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // Handle login logic here
    }, 2000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showBack={true} title="로그인" showMenu={false} />
      
      <div className="max-w-md mx-auto px-4 py-16">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-600">계정에 로그인하여 서비스를 이용하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 주소
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">로그인 상태 유지</span>
              </label>
              <Link 
                href="/password-reset" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                비밀번호 찾기
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-xl font-semibold hover:bg-yellow-500 transition-colors duration-200 flex items-center justify-center">
              <span className="mr-2">💬</span>
              카카오로 로그인
            </button>
            <button className="w-full bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-colors duration-200 flex items-center justify-center">
              <span className="mr-2">N</span>
              네이버로 로그인
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                회원가입하기
              </Link>
            </p>
          </div>
        </div>

        {/* Promotional Card */}
        <div className="mt-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white text-center">
          <div className="text-3xl mb-3">🎉</div>
          <h3 className="text-lg font-bold mb-2">신규 고객 특별 할인</h3>
          <p className="text-sm opacity-90 mb-4">첫 주문 시 20% 할인</p>
          <button className="bg-white text-pink-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
            자세히 보기
          </button>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600">🏠</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">전문성과 신뢰성</h4>
                <p className="text-sm text-gray-600">고객님의 만족을 최우선으로 생각합니다</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-600">👷</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">간편한 견적 요청</h4>
                <p className="text-sm text-gray-600">온라인으로 간편하게 견적을 요청하고 전문가들의 제안을 받아보세요</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-600">💳</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">전문 시공기사</h4>
                <p className="text-sm text-gray-600">검증된 전문 시공기사들이 정확하고 깔끔한 시공을 보장합니다</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-yellow-600">⭐</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">안전한 결제</h4>
                <p className="text-sm text-gray-600">시공 완료 후 결제하는 안전한 시스템으로 고객님의 만족을 보장합니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 