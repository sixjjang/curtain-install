import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentAd, setCurrentAd] = useState(0);

  // 광고 자동 전환
  React.useEffect(() => {
    const adInterval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(adInterval);
  }, []);

  const ads = [
    {
      id: 1,
      title: "신규 고객 특별 할인",
      subtitle: "첫 주문 시 20% 할인",
      image: "🎉",
      color: "from-pink-500 to-rose-500"
    },
    {
      id: 2,
      title: "전문 시공기사 모집",
      subtitle: "높은 수익과 안정적인 일자리",
      image: "👷",
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: 3,
      title: "24시간 고객 지원",
      subtitle: "언제든지 문의하세요",
      image: "📞",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 입력 시 에러 메시지 제거
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(formData.email, formData.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation showBack={true} title="로그인" showMenu={false} />
      
      <div className="container-custom py-8">
        <div className="flex-responsive items-center min-h-[80vh]">
          {/* Login Form */}
          <div className="flex-1 max-w-md mx-auto lg:mx-0">
            <div className="card p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">C</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">로그인</h1>
                <p className="text-slate-600">계정에 로그인하여 서비스를 이용하세요.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-600">로그인 상태 유지</span>
                  </label>
                  <Link
                    href="/password-reset"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    비밀번호 찾기
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary py-3 text-lg font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-5 h-5 mr-2"></div>
                      로그인 중...
                    </div>
                  ) : (
                    '로그인'
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-600 mb-4">또는</p>
                
                <button className="w-full btn btn-outline py-3 mb-4 flex items-center justify-center">
                  <span className="mr-2">💬</span>
                  카카오로 로그인
                </button>
                
                <button className="w-full btn btn-outline py-3 flex items-center justify-center">
                  <span className="mr-2">📱</span>
                  네이버로 로그인
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <p className="text-slate-600">
                  계정이 없으신가요?{' '}
                  <Link
                    href="/signup"
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    회원가입하기
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Ad Banner */}
          <div className="flex-1 lg:ml-12">
            <div className="relative">
              <div className="card card-hover p-8 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border-0 shadow-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">{ads[currentAd].image}</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {ads[currentAd].title}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {ads[currentAd].subtitle}
                  </p>
                  <div className="flex justify-center space-x-2 mb-6">
                    {ads.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAd(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentAd ? 'bg-blue-600 w-6' : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button className="btn btn-primary w-full">
                    자세히 보기
                  </button>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              왜 커튼 설치 매칭을 선택해야 할까요?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              전문성과 신뢰성을 바탕으로 고객님의 만족을 최우선으로 생각합니다.
            </p>
          </div>
          
          <div className="grid-responsive">
            <div className="card card-hover p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                🏠
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                간편한 견적 요청
              </h3>
              <p className="text-slate-600 leading-relaxed">
                온라인으로 간편하게 견적을 요청하고 전문가들의 제안을 받아보세요.
              </p>
            </div>
            
            <div className="card card-hover p-8 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                👷
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                전문 시공기사
              </h3>
              <p className="text-slate-600 leading-relaxed">
                검증된 전문 시공기사들이 정확하고 깔끔한 시공을 보장합니다.
              </p>
            </div>
            
            <div className="card card-hover p-8 text-center">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                💳
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                안전한 결제
              </h3>
              <p className="text-slate-600 leading-relaxed">
                시공 완료 후 결제하는 안전한 시스템으로 고객님의 만족을 보장합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 