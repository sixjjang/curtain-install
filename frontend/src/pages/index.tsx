import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import InstallPWA from '../components/InstallPWA';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAd, setCurrentAd] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const adInterval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % 3);
    }, 5000);

    return () => {
      clearInterval(adInterval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const ads = [
    {
      id: 1,
      title: "신규 고객 특별 할인",
      subtitle: "첫 주문 시 20% 할인",
      image: "🎉",
      bgColor: "bg-gradient-to-br from-pink-500 to-rose-500"
    },
    {
      id: 2,
      title: "전문 시공기사 모집",
      subtitle: "높은 수익과 안정적인 일자리",
      image: "👷",
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600"
    },
    {
      id: 3,
      title: "24시간 고객 지원",
      subtitle: "언제든지 문의하세요",
      image: "📞",
      bgColor: "bg-gradient-to-br from-green-500 to-emerald-600"
    }
  ];

  const quickActions = [
    { icon: "📋", title: "견적 요청", desc: "간편한 견적 요청", href: "/workorder/new", color: "bg-blue-500" },
    { icon: "🔍", title: "작업 목록", desc: "진행 상황 확인", href: "/workorder/list", color: "bg-green-500" },
    { icon: "📄", title: "견적서", desc: "견적서 관리", href: "/estimate/list", color: "bg-purple-500" },
    { icon: "💳", title: "결제", desc: "결제 내역", href: "/payment/list", color: "bg-orange-500" },
    { icon: "⭐", title: "리뷰", desc: "고객 리뷰", href: "/review/list", color: "bg-yellow-500" },
    { icon: "🔔", title: "알림", desc: "알림 확인", href: "/notification/list", color: "bg-red-500" }
  ];

  const stats = [
    { number: "10,000+", label: "완료된 프로젝트", icon: "🏠" },
    { number: "500+", label: "전문 시공기사", icon: "👷" },
    { number: "98%", label: "고객 만족도", icon: "⭐" },
    { number: "24/7", label: "고객 지원", icon: "📞" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showBack={false} showMenu={false} />
      
      {/* Hero Section */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                커튼 설치 전문 매칭 플랫폼
              </div>
              
              <h1 className="text-3xl lg:text-6xl font-bold text-gray-900 mb-4 lg:mb-6 leading-tight">
                커튼 설치를 위한
                <span className="text-blue-600 block">최고의 선택</span>
              </h1>
              
              <p className="text-base lg:text-xl text-gray-600 mb-6 lg:mb-8 leading-relaxed">
                전문 시공기사들이 고객님의 커튼 설치를 책임집니다. 
                간편한 견적 요청부터 전문적인 시공까지, 모든 과정을 관리해드립니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <Link 
                  href="/workorder/new" 
                  className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-sm lg:text-base"
                >
                  <span className="mr-2">🚀</span>
                  견적 요청하기
                </Link>
                <Link 
                  href="/workorder/list" 
                  className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-300 text-sm lg:text-base"
                >
                  <span className="mr-2">📋</span>
                  작업 주문 보기
                </Link>
              </div>
            </div>

            {/* Right Content - Ad Banner */}
            <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                <div className={`${ads[currentAd].bgColor} rounded-2xl p-6 lg:p-8 text-white shadow-2xl`}>
                  <div className="text-center">
                    <div className="text-4xl lg:text-6xl mb-3 lg:mb-4">{ads[currentAd].image}</div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-2">
                      {ads[currentAd].title}
                    </h3>
                    <p className="text-base lg:text-lg opacity-90 mb-4 lg:mb-6">
                      {ads[currentAd].subtitle}
                    </p>
                    <div className="flex justify-center space-x-2">
                      {ads.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentAd(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentAd ? 'bg-white w-6' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions - Mobile Optimized */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 lg:mb-4">
              빠른 서비스 이용
            </h2>
            <p className="text-base lg:text-lg text-gray-600">
              원하는 서비스를 바로 이용해보세요
            </p>
          </div>
          
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-xl p-4 lg:p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className={`w-10 h-10 lg:w-12 lg:h-12 ${action.color} rounded-xl flex items-center justify-center text-white text-lg lg:text-xl mx-auto mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs lg:text-sm">{action.title}</h3>
                <p className="text-xs lg:text-sm text-gray-500 hidden lg:block">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-xl lg:text-2xl mx-auto mb-3 lg:mb-4">
                  {stat.icon}
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium text-sm lg:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 lg:mb-4">
              왜 커튼 설치 매칭을 선택해야 할까요?
            </h2>
            <p className="text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
              전문성과 신뢰성을 바탕으로 고객님의 만족을 최우선으로 생각합니다.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-xl lg:text-2xl mx-auto mb-4 lg:mb-6">
                🏠
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">
                간편한 견적 요청
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                온라인으로 간편하게 견적을 요청하고 전문가들의 제안을 받아보세요.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-2xl flex items-center justify-center text-xl lg:text-2xl mx-auto mb-4 lg:mb-6">
                👷
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">
                전문 시공기사
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                검증된 전문 시공기사들이 정확하고 깔끔한 시공을 보장합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-xl lg:text-2xl mx-auto mb-4 lg:mb-6">
                💳
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">
                안전한 결제
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                시공 완료 후 결제하는 안전한 시스템으로 고객님의 만족을 보장합니다.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-xl lg:text-2xl mx-auto mb-4 lg:mb-6">
                ⭐
              </div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">
                품질 보장
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                시공 완료 후 1년간 품질 보증을 제공하여 안심하고 이용하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 lg:py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-6">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg lg:text-xl mb-6 lg:mb-8 opacity-90">
                전문 시공기사와 연결되어 완벽한 커튼 설치를 경험해보세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors duration-300 text-sm lg:text-base"
                >
                  무료 회원가입
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-colors duration-300 text-sm lg:text-base"
                >
                  로그인
                </Link>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 lg:p-8 text-center text-white">
              <div className="text-4xl lg:text-5xl mb-3 lg:mb-4">🎁</div>
              <h3 className="text-xl lg:text-2xl font-bold mb-2">신규 가입 혜택</h3>
              <p className="mb-4 lg:mb-6 opacity-90 text-sm lg:text-base">
                첫 주문 시 20% 할인 + 무료 상담
              </p>
              <div className="bg-white/20 rounded-xl p-3 lg:p-4">
                <div className="text-xs lg:text-sm opacity-75">한정 시간</div>
                <div className="text-xl lg:text-2xl font-bold">2024.12.31까지</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4 lg:mb-6">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg lg:text-xl">C</span>
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-bold">커튼 설치 매칭</h3>
                  <p className="text-gray-400 text-sm lg:text-base">전문 시공기사 매칭 플랫폼</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 lg:mb-6 text-sm lg:text-base">
                고객님의 만족을 최우선으로 생각하는 커튼 설치 전문 매칭 서비스입니다.
                검증된 시공기사들과 함께 완벽한 커튼 설치를 경험해보세요.
              </p>
              <div className="flex space-x-3 lg:space-x-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm lg:text-base">📧</span>
                </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm lg:text-base">📱</span>
                </div>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm lg:text-base">💬</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">빠른 링크</h4>
              <ul className="space-y-2">
                <li><Link href="/workorder/new" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">견적 요청</Link></li>
                <li><Link href="/workorder/list" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">작업 목록</Link></li>
                <li><Link href="/estimate/list" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">견적서</Link></li>
                <li><Link href="/payment/list" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">결제</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">고객 지원</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">도움말</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">문의하기</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">자주 묻는 질문</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm lg:text-base">이용약관</Link></li>
              </ul>
            </div>

            {/* Ad Space */}
            <div>
              <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">광고 공간</h4>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 lg:p-4 text-center">
                <div className="text-xl lg:text-2xl mb-2">📢</div>
                <p className="text-xs lg:text-sm text-gray-400">광고 문의</p>
                <p className="text-xs text-gray-500">contact@curtain.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 lg:mt-12 pt-6 lg:pt-8 text-center">
            <p className="text-gray-400 text-sm lg:text-base">
              © 2024 커튼 설치 매칭. 모든 권리 보유.
            </p>
          </div>
        </div>
      </footer>

      {/* PWA Install Prompt */}
      <InstallPWA />
    </div>
  );
} 