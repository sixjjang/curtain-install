import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import InsteamLogo from './InsteamLogo';

export default function Navigation({ showBack = true, showMenu = true, title = "Insteam" }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const getRoleTheme = () => {
    if (!user) return 'theme-default';
    switch (user.role) {
      case 'seller': return 'theme-seller';
      case 'contractor': return 'theme-contractor';
      case 'admin': return 'theme-admin';
      default: return 'theme-default';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
      case 'admin': return '관리자';
      default: return '사용자';
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white/90 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {showBack && router.pathname !== '/' && (
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  aria-label="뒤로 가기"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
                <div className="flex items-center">
                  <InsteamLogo size="md" showText={false} />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
                  <p className="text-xs lg:text-sm text-gray-500">설치 전문가 플랫폼</p>
                </div>
              </Link>
            </div>

            {/* Center Section - Desktop Menu */}
            {showMenu && user && (
              <div className="hidden md:flex items-center space-x-1">
                <Link href="/dashboard">
                  <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    router.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                    대시보드
                  </button>
                </Link>
                
                {user.role === 'seller' && (
                  <>
                    <Link href="/workorder/list">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        router.pathname.includes('/workorder')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        작업 관리
                      </button>
                    </Link>
                    <Link href="/estimate/list">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        router.pathname.includes('/estimate')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        견적 관리
                      </button>
                    </Link>
                  </>
                )}
                
                {user.role === 'contractor' && (
                  <>
                    <Link href="/workorder/worker-list">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        router.pathname.includes('/workorder')
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        내 작업
                      </button>
                    </Link>
                    <Link href="/collaboration">
                      <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        router.pathname.includes('/collaboration')
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}>
                        협업 관리
                      </button>
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <button className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      router.pathname.includes('/admin')
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                      관리자
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Desktop Profile Menu */}
                  <div className="hidden md:relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || '사용자'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getRoleDisplayName(user.role)}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link href="/profile">
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            프로필 설정
                          </button>
                        </Link>
                        <Link href="/settings">
                          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                            설정
                          </button>
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          로그아웃
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    aria-label="메뉴 열기"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                      로그인
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105">
                      회원가입
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              <Link href="/dashboard">
                <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  router.pathname === '/dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  대시보드
                </button>
              </Link>
              
              {user.role === 'seller' && (
                <>
                  <Link href="/workorder/list">
                    <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      router.pathname.includes('/workorder')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                      작업 관리
                    </button>
                  </Link>
                  <Link href="/estimate/list">
                    <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      router.pathname.includes('/estimate')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                      견적 관리
                    </button>
                  </Link>
                </>
              )}
              
              {user.role === 'contractor' && (
                <>
                  <Link href="/workorder/worker-list">
                    <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      router.pathname.includes('/workorder')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                      내 작업
                    </button>
                  </Link>
                  <Link href="/collaboration">
                    <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                      router.pathname.includes('/collaboration')
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                      협업 관리
                    </button>
                  </Link>
                </>
              )}
              
              {user.role === 'admin' && (
                <Link href="/admin">
                  <button className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    router.pathname.includes('/admin')
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                    관리자
                  </button>
                </Link>
              )}
              
              <hr className="my-2" />
              <Link href="/profile">
                <button className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                  프로필 설정
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Backdrop for profile menu */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}

      {/* Spacer for fixed navigation */}
      <div className="h-16 lg:h-20" />
    </>
  );
} 