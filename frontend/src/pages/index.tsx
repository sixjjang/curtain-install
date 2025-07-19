import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';

export default function HomePage() {
  const router = useRouter();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🏢',
      title: '판매자',
      subtitle: '커튼/블라인드 전문 판매업체',
      description: '전문 시공기사와 연결하여 고객에게 완벽한 설치 서비스를 제공하세요',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      features: ['전문 시공기사 매칭', '실시간 작업 현황', '고객 만족도 관리', '매출 증대']
    },
    {
      icon: '👷',
      title: '시공자',
      subtitle: '설치 전문가',
      description: '안정적인 수익과 전문성을 인정받는 설치 전문가가 되세요',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      features: ['안정적인 수익', '전문성 인정', '스케줄 관리', '고객 리뷰']
    },
    {
      icon: '⚡',
      title: '협업 시스템',
      subtitle: '혁신적인 협업 플랫폼',
      description: '여러 시공자가 함께 작업하여 대형 프로젝트도 완벽하게 처리',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      features: ['다중 시공자 협업', '작업 분담 시스템', '진도 관리', '품질 보장']
    }
  ];

  const stats = [
    { number: '1,200+', label: '등록된 시공자' },
    { number: '500+', label: '협력 판매업체' },
    { number: '15,000+', label: '완료된 프로젝트' },
    { number: '98%', label: '고객 만족도' }
  ];

  return (
    <>
      <Head>
        <title>Insteam - 설치 전문가 플랫폼</title>
        <meta name="description" content="설치 전문가와 고객을 연결하는 혁신적인 협업 플랫폼" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Navigation title="Insteam" />
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent mb-6">
                  Insteam
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                  설치 전문가와 고객을 연결하는 <span className="font-semibold text-blue-600">혁신적인 협업 플랫폼</span>
                </p>
                <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                  전문 시공기사들이 협업하여 대형 프로젝트도 완벽하게 처리하는 
                  <br className="hidden md:block" />
                  <span className="font-medium">차세대 설치 서비스 플랫폼</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                  <Link href="/signup">
                    <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      무료로 시작하기
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                      로그인
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl md:text-4xl font-bold mb-2 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.number}
                    </span>
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                핵심 서비스
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                판매자와 시공자가 협업하여 완벽한 설치 서비스를 제공합니다
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`relative p-8 rounded-2xl transition-all duration-500 transform hover:scale-105 ${
                    currentFeature === index ? 'ring-4 ring-blue-200' : ''
                  } ${feature.bgColor} hover:shadow-xl`}
                >
                  <div className="text-center">
                    <div className={`text-6xl mb-6 transition-transform duration-300 ${currentFeature === index ? 'scale-110' : ''}`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-lg font-medium text-gray-700 mb-3">{feature.subtitle}</p>
                    <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                    
                    <div className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <span className="text-green-500 mr-2">✓</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                어떻게 작동하나요?
              </h2>
              <p className="text-xl text-gray-600">
                간단한 3단계로 완벽한 설치 서비스를 경험하세요
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">요청 등록</h3>
                <p className="text-gray-600">판매자가 고객의 설치 요청을 등록합니다</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">전문가 배정</h3>
                <p className="text-gray-600">적합한 시공자가 선택되어 작업을 시작합니다</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">완료 및 평가</h3>
                <p className="text-gray-600">설치 완료 후 고객이 서비스를 평가합니다</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              전문 시공기사들과 함께 성장하는 설치 서비스의 새로운 기준을 만들어보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                  무료 회원가입
                </button>
              </Link>
              <Link href="/login">
                <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300">
                  로그인
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Insteam</h3>
                <p className="text-gray-400">
                  설치 전문가와 고객을 연결하는 혁신적인 협업 플랫폼
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">서비스</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>커튼 설치</li>
                  <li>블라인드 설치</li>
                  <li>롤스크린 설치</li>
                  <li>전문 시공</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">회사</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>소개</li>
                  <li>채용</li>
                  <li>뉴스</li>
                  <li>연락처</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">지원</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>고객센터</li>
                  <li>도움말</li>
                  <li>문의하기</li>
                  <li>이용약관</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Insteam. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 