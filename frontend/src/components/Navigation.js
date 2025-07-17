import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function Navigation({ showBack = true, showMenu = true, title = "커튼 설치 매칭" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const navigationItems = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/workorder/new', label: '견적 요청', icon: '📋' },
    { href: '/workorder/list', label: '작업 목록', icon: '🔍' },
    { href: '/estimate/list', label: '견적서', icon: '📄' },
    { href: '/payment/list', label: '결제', icon: '💳' },
    { href: '/review/list', label: '리뷰', icon: '⭐' },
    { href: '/notification/list', label: '알림', icon: '🔔' },
    { href: '/dashboard', label: '대시보드', icon: '📊' },
    { href: '/profile', label: '프로필', icon: '👤' },
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left Section */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                  aria-label="뒤로 가기"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm lg:text-base">C</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900">{title}</h1>
                </div>
              </div>
            </div>

            {/* Center Section - Mobile Title */}
            {isMobile && (
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Search Button - Mobile */}
              {isMobile && (
                <button
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
                  aria-label="검색"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Menu Button */}
              {showMenu && (
                <button
                  onClick={toggleMenu}
                  className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
                  aria-label="메뉴"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

              {/* Login/Signup Buttons - Desktop */}
              {!isMobile && (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Link
                    href="/login"
                    className="px-4 lg:px-6 py-2 lg:py-3 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 text-sm lg:text-base"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 lg:px-6 py-2 lg:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium text-sm lg:text-base"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-16 lg:top-20 right-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl transform transition-transform duration-300 z-50 lg:hidden ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
              <button
                onClick={closeMenu}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                aria-label="메뉴 닫기"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* User Info Placeholder */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">👤</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">게스트</p>
                <p className="text-sm text-gray-500">로그인해주세요</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-1">
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center space-x-3 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors duration-200">
                      <span className="text-lg">{item.icon}</span>
                    </div>
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                회원가입
              </Link>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <Link href="/help" onClick={closeMenu} className="hover:text-gray-700 transition-colors">
                  도움말
                </Link>
                <Link href="/contact" onClick={closeMenu} className="hover:text-gray-700 transition-colors">
                  문의
                </Link>
                <Link href="/terms" onClick={closeMenu} className="hover:text-gray-700 transition-colors">
                  약관
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Horizontal */}
      {!isMobile && (
        <div className="hidden lg:block bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-8 h-12">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed navigation */}
      <div className="h-16 lg:h-32"></div>
    </>
  );
} 