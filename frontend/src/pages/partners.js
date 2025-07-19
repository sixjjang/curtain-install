import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function PartnersPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const partners = [
    {
      id: 1,
      category: '커튼 제조사',
      name: '한국커튼',
      logo: '🏭',
      description: '고품질 커튼 전문 제조업체',
      fullDescription: '30년 전통의 커튼 제조 전문업체로, 고품질 원단과 정교한 제작 기술로 최고의 커튼을 제공합니다. 다양한 스타일과 사이즈의 커튼을 대량 생산하여 도매업체와 소매업체에 최적의 가격으로 공급합니다.',
      discount: '도매가 20% 할인',
      minOrder: '최소 주문량: 10개',
      delivery: '배송: 3-5일',
      contact: '02-1234-5678',
      email: 'sales@koreacurtain.co.kr',
      website: 'www.koreacurtain.co.kr',
      products: ['일반 커튼', '블라인드', '롤스크린', '버티컬'],
      features: ['고품질 원단', '맞춤 제작', '대량 할인', 'A/S 지원']
    },
    {
      id: 2,
      category: '커튼 제조사',
      name: '프리미엄커튼',
      logo: '🏢',
      description: '럭셔리 커튼 브랜드',
      fullDescription: '럭셔리 커튼 전문 브랜드로, 고급 원단과 디자인으로 프리미엄 커튼을 제작합니다. 호텔, 레스토랑, 고급 주거공간에 특화된 커튼을 제공하며, 브랜드 가치를 높여주는 고품질 제품을 생산합니다.',
      discount: '도매가 25% 할인',
      minOrder: '최소 주문량: 5개',
      delivery: '배송: 5-7일',
      contact: '02-2345-6789',
      email: 'info@premiumcurtain.co.kr',
      website: 'www.premiumcurtain.co.kr',
      products: ['럭셔리 커튼', '블랙아웃', '실크 커튼', '자카드'],
      features: ['고급 원단', '디자인 컨설팅', '맞춤 제작', '설치 지원']
    },
    {
      id: 3,
      category: '커튼 제조사',
      name: '스마트커튼',
      logo: '🏗️',
      description: '스마트홈 커튼 전문',
      fullDescription: 'IoT 기술을 접목한 스마트 커튼 전문 제조업체입니다. 자동화 시스템과 연동되는 전동 커튼을 주력으로 하며, 스마트폰 앱으로 제어 가능한 현대적인 커튼을 제공합니다.',
      discount: '도매가 15% 할인',
      minOrder: '최소 주문량: 3개',
      delivery: '배송: 7-10일',
      contact: '02-3456-7890',
      email: 'smart@smartcurtain.co.kr',
      website: 'www.smartcurtain.co.kr',
      products: ['전동 커튼', '스마트 블라인드', 'IoT 커튼', '센서 커튼'],
      features: ['IoT 연동', '자동화 시스템', '앱 제어', '기술 지원']
    },
    {
      id: 4,
      category: '전동모터 회사',
      name: '모터텍',
      logo: '⚡',
      description: '전동커튼 모터 전문',
      fullDescription: '전동 커튼용 모터 전문 제조업체로, 조용하고 안정적인 모터를 생산합니다. 다양한 무게와 크기에 맞는 모터를 제공하며, 긴 수명과 낮은 소음으로 고객 만족도를 높입니다.',
      discount: '도매가 30% 할인',
      minOrder: '최소 주문량: 20개',
      delivery: '배송: 2-3일',
      contact: '02-4567-8901',
      email: 'sales@motortech.co.kr',
      website: 'www.motortech.co.kr',
      products: ['전동 모터', '리모컨', '센서', '배터리'],
      features: ['저소음', '고효율', '긴 수명', 'A/S 보장']
    },
    {
      id: 5,
      category: '전동모터 회사',
      name: '스마트모터',
      logo: '🔌',
      description: 'IoT 전동모터 시스템',
      fullDescription: 'IoT 기술을 적용한 스마트 전동모터 시스템을 개발하고 제조합니다. WiFi, 블루투스 연결을 지원하며, 스마트폰 앱으로 제어 가능한 현대적인 모터 시스템을 제공합니다.',
      discount: '도매가 25% 할인',
      minOrder: '최소 주문량: 10개',
      delivery: '배송: 3-5일',
      contact: '02-5678-9012',
      email: 'info@smartmotor.co.kr',
      website: 'www.smartmotor.co.kr',
      products: ['IoT 모터', '스마트 컨트롤러', '센서 시스템', '앱 솔루션'],
      features: ['IoT 연동', '앱 제어', '자동화', '기술 지원']
    },
    {
      id: 6,
      category: '전동모터 회사',
      name: '전동솔루션',
      logo: '⚙️',
      description: '커스텀 전동모터',
      fullDescription: '고객의 요구사항에 맞는 커스텀 전동모터를 제작하는 전문업체입니다. 특수한 용도나 규격에 맞는 모터를 설계하고 제작하여 고객의 니즈를 충족시킵니다.',
      discount: '도매가 20% 할인',
      minOrder: '최소 주문량: 5개',
      delivery: '배송: 10-15일',
      contact: '02-6789-0123',
      email: 'custom@motorsolution.co.kr',
      website: 'www.motorsolution.co.kr',
      products: ['커스텀 모터', '특수 모터', '산업용 모터', '설계 서비스'],
      features: ['맞춤 설계', '특수 제작', '기술 컨설팅', '품질 보장']
    },
    {
      id: 7,
      category: '원단 회사',
      name: '텍스타일코리아',
      logo: '🧵',
      description: '고급 원단 전문',
      fullDescription: '고급 원단 전문 업체로, 다양한 질감과 색상의 고품질 원단을 제공합니다. 국내외 유명 브랜드와 협력하여 최고 품질의 원단을 생산하며, 커튼 제작에 최적화된 원단을 공급합니다.',
      discount: '도매가 35% 할인',
      minOrder: '최소 주문량: 100m',
      delivery: '배송: 3-5일',
      contact: '02-7890-1234',
      email: 'sales@textilekorea.co.kr',
      website: 'www.textilekorea.co.kr',
      products: ['고급 원단', '블랙아웃', '실크 원단', '린넨 원단'],
      features: ['고품질', '다양한 색상', '대량 할인', '샘플 제공']
    },
    {
      id: 8,
      category: '원단 회사',
      name: '패브릭월드',
      logo: '🎨',
      description: '다양한 원단 컬렉션',
      fullDescription: '전 세계의 다양한 원단을 수입하고 유통하는 전문업체입니다. 트렌디한 디자인과 고품질 원단을 선별하여 제공하며, 계절별 새로운 컬렉션을 발표합니다.',
      discount: '도매가 30% 할인',
      minOrder: '최소 주문량: 50m',
      delivery: '배송: 5-7일',
      contact: '02-8901-2345',
      email: 'info@fabricworld.co.kr',
      website: 'www.fabricworld.co.kr',
      products: ['수입 원단', '트렌디 원단', '계절 컬렉션', '디자인 원단'],
      features: ['수입 원단', '트렌디 디자인', '계절 컬렉션', '디자인 컨설팅']
    },
    {
      id: 9,
      category: '원단 회사',
      name: '프리미엄원단',
      logo: '🌟',
      description: '럭셔리 원단 전문',
      fullDescription: '럭셔리 원단 전문업체로, 고급 호텔과 레스토랑에 공급되는 최고급 원단을 생산합니다. 독특한 질감과 색상으로 프리미엄 브랜드 가치를 높여주는 원단을 제공합니다.',
      discount: '도매가 25% 할인',
      minOrder: '최소 주문량: 30m',
      delivery: '배송: 7-10일',
      contact: '02-9012-3456',
      email: 'luxury@premiumfabric.co.kr',
      website: 'www.premiumfabric.co.kr',
      products: ['럭셔리 원단', '실크 원단', '벨벳 원단', '자카드 원단'],
      features: ['최고급 원단', '독특한 디자인', '브랜드 가치', '맞춤 제작']
    },
    {
      id: 10,
      category: '부자재 회사',
      name: '레일마스터',
      logo: '🔧',
      description: '커튼레일 전문 제조',
      fullDescription: '커튼레일 전문 제조업체로, 다양한 형태와 크기의 고품질 레일을 생산합니다. 조용하고 부드러운 작동을 보장하며, 내구성이 뛰어나 오랜 사용에도 안정적인 성능을 유지합니다.',
      discount: '도매가 40% 할인',
      minOrder: '최소 주문량: 50개',
      delivery: '배송: 2-3일',
      contact: '02-0123-4567',
      email: 'sales@railmaster.co.kr',
      website: 'www.railmaster.co.kr',
      products: ['커튼레일', '전동레일', '특수레일', '액세서리'],
      features: ['고품질', '조용한 작동', '내구성', '맞춤 제작']
    },
    {
      id: 11,
      category: '부자재 회사',
      name: '자석커튼',
      logo: '🧲',
      description: '자석커튼끈 전문',
      fullDescription: '자석 커튼끈 전문 제조업체로, 강력한 자력과 내구성을 갖춘 고품질 자석 커튼끈을 생산합니다. 다양한 크기와 색상으로 고객의 니즈에 맞는 제품을 제공합니다.',
      discount: '도매가 35% 할인',
      minOrder: '최소 주문량: 100개',
      delivery: '배송: 1-2일',
      contact: '02-1234-5678',
      email: 'info@magnetcurtain.co.kr',
      website: 'www.magnetcurtain.co.kr',
      products: ['자석 커튼끈', '자석 액세서리', '특수 자석', '맞춤 제작'],
      features: ['강력한 자력', '내구성', '다양한 색상', '맞춤 제작']
    },
    {
      id: 12,
      category: '부자재 회사',
      name: '부자재월드',
      logo: '📦',
      description: '커튼 부자재 종합',
      fullDescription: '커튼 제작에 필요한 모든 부자재를 종합적으로 제공하는 업체입니다. 레일, 고리, 액세서리 등 모든 부자재를 원스톱으로 구매할 수 있어 편리하고 경제적입니다.',
      discount: '도매가 30% 할인',
      minOrder: '최소 주문량: 10종류',
      delivery: '배송: 3-5일',
      contact: '02-2345-6789',
      email: 'sales@accessoryworld.co.kr',
      website: 'www.accessoryworld.co.kr',
      products: ['종합 부자재', '액세서리', '고리', '클립'],
      features: ['원스톱 구매', '종합 케어', '대량 할인', '품질 보장']
    }
  ];

  const categories = [
    { id: 'all', name: '전체', count: partners.length },
    { id: '커튼 제조사', name: '커튼 제조사', count: partners.filter(p => p.category === '커튼 제조사').length },
    { id: '전동모터 회사', name: '전동모터 회사', count: partners.filter(p => p.category === '전동모터 회사').length },
    { id: '원단 회사', name: '원단 회사', count: partners.filter(p => p.category === '원단 회사').length },
    { id: '부자재 회사', name: '부자재 회사', count: partners.filter(p => p.category === '부자재 회사').length }
  ];

  const filteredPartners = selectedCategory === 'all' 
    ? partners 
    : partners.filter(partner => partner.category === selectedCategory);

  return (
    <>
      <Head>
        <title>파트너사 - 커튼 설치 플랫폼</title>
        <meta name="description" content="커튼 제조사, 전동모터, 원단, 부자재 전문업체들과의 파트너십을 통해 최고의 가격과 품질을 제공합니다." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">🏠 커튼플랫폼</Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  로그인
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              🏭 파트너사 소개
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              커튼 업계 최고의 제조사들과 파트너십을 맺고 있습니다.<br />
              도매가 할인과 최고 품질의 제품을 제공받으세요!
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-4">{partner.logo}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{partner.name}</h3>
                    <p className="text-gray-600 mb-3">{partner.description}</p>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {partner.discount}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📋 상세 정보</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{partner.fullDescription}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📦 주문 정보</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• {partner.minOrder}</div>
                        <div>• {partner.delivery}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📞 연락처</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• 전화: {partner.contact}</div>
                        <div>• 이메일: {partner.email}</div>
                        <div>• 웹사이트: {partner.website}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">🛍️ 주요 제품</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.products.map((product, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">✨ 특징</h4>
                      <div className="flex flex-wrap gap-2">
                        {partner.features.map((feature, index) => (
                          <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <Link
                        href="/signup"
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block font-semibold"
                      >
                        파트너사와 거래 시작하기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPartners.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏭</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">파트너사가 없습니다</h3>
                <p className="text-gray-500">선택한 카테고리에 해당하는 파트너사를 찾을 수 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              지금 바로 파트너사와 연결하세요!
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              회원가입 후 최고의 도매가와 품질을 경험해보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold">
                무료 회원가입
              </Link>
              <Link href="/" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-2xl font-bold mb-4">🏠 커튼플랫폼</div>
                <p className="text-gray-400">
                  판매자를 위한 최고의 커튼 플랫폼
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">서비스</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>도매 구매</li>
                  <li>전문 시공</li>
                  <li>원스톱 관리</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">파트너</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>커튼 제조사</li>
                  <li>전동모터 회사</li>
                  <li>원단 회사</li>
                  <li>부자재 회사</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">고객지원</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>고객센터</li>
                  <li>자주묻는질문</li>
                  <li>문의하기</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 커튼플랫폼. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 