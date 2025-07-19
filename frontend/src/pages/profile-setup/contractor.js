import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Navigation from '../../components/Navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { regionData, provinces, getDistricts } from '../../utils/regionData';
import AddressSearch from '../../components/AddressSearch';

export default function ContractorProfileSetup() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    experience: '',
    specialties: [],
    certifications: [],
    vehicleInfo: '',
    availability: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Firestore에 시공자 프로필 정보 저장
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        addressData: selectedAddress, // 주소 상세 정보 추가
        profileCompleted: true,
        approvalStatus: 'pending',
        role: 'contractor',
        updatedAt: new Date()
      });

      setMessage('프로필이 성공적으로 저장되었습니다! 관리자 승인을 기다려주세요.');
      
      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setMessage('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
  };

  const handleDistrictSelect = (district) => {
    const fullRegion = `${selectedProvince} ${district}`;
    handleArrayChange('availability', fullRegion);
  };

  const handleProvinceSelect = (province) => {
    handleArrayChange('availability', province);
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 주소 선택 핸들러
  const handleAddressSelect = (addressData) => {
    setSelectedAddress(addressData);
    setFormData(prev => ({
      ...prev,
      address: addressData.address
    }));
  };

  const getFilteredRegions = () => {
    if (!searchKeyword) return [];
    
    const results = [];
    provinces.forEach(province => {
      if (province.includes(searchKeyword)) {
        results.push({ type: 'province', name: province });
      }
      const districts = getDistricts(province);
      districts.forEach(district => {
        if (district.includes(searchKeyword) || province.includes(searchKeyword)) {
          results.push({ type: 'district', name: `${province} ${district}`, province, district });
        }
      });
    });
    return results.slice(0, 10); // 최대 10개 결과만 표시
  };

  const filteredRegions = getFilteredRegions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공자 프로필 설정" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">시공자 프로필 설정</h1>
            <p className="text-gray-600 mt-2">시공자 승인을 위한 정보를 입력해주세요</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('성공') 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="실명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소 <span className="text-red-500">*</span>
              </label>
              <AddressSearch
                onAddressSelect={handleAddressSelect}
                placeholder="거주지 주소를 검색하세요"
                className="w-full"
              />
              {selectedAddress && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">선택된 주소:</span> {selectedAddress.address}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시공 경력
              </label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="예: 3년, 5년 등"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전문 분야
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['블라인드', '커튼', '롤스크린', '버티컬', '로만쉐이드', '셔터', '가리개', '스크린'].map((specialty) => (
                  <label key={specialty} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleArrayChange('specialties', specialty)}
                      className="mr-2"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보유 자격증
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['건축자재관리사', '인테리어코디네이터', '실내건축기사', '건축기사', '전기기사', '소방설비기사'].map((cert) => (
                  <label key={cert} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.certifications.includes(cert)}
                      onChange={() => handleArrayChange('certifications', cert)}
                      className="mr-2"
                    />
                    <span className="text-sm">{cert}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                차량 정보
              </label>
              <input
                type="text"
                value={formData.vehicleInfo}
                onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="예: 1톤 트럭, 승용차 등"
              />
            </div>

            {/* 작업 가능 지역 - 개선된 버전 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 가능 지역 <span className="text-red-500">*</span>
              </label>
              
              {/* 지역 검색 */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={handleSearchChange}
                  placeholder="지역을 검색하세요 (예: 수원, 영통구)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                
                {/* 검색 결과 */}
                {searchKeyword && filteredRegions.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                    {filteredRegions.map((region, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (region.type === 'province') {
                            handleProvinceSelect(region.name);
                          } else {
                            handleArrayChange('availability', region.name);
                          }
                          setSearchKeyword('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm font-medium">{region.name}</div>
                        <div className="text-xs text-gray-500">
                          {region.type === 'province' ? '시/도' : '시/군/구'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 시/도별 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시/도 선택
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">시/도를 선택하세요</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              {/* 선택된 시/도의 구/군 선택 */}
              {selectedProvince && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedProvince} 구/군 선택
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {getDistricts(selectedProvince).map((district) => (
                      <label key={district} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(`${selectedProvince} ${district}`)}
                          onChange={() => handleDistrictSelect(district)}
                          className="mr-2"
                        />
                        {district}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 선택된 지역 표시 */}
              {formData.availability.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    선택된 작업 가능 지역
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.availability.map((region, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                      >
                        {region}
                        <button
                          type="button"
                          onClick={() => handleArrayChange('availability', region)}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">승인 절차 안내</h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>• 입력하신 정보는 관리자 검토 후 승인됩니다</p>
                    <p>• 승인 완료 시 이메일로 알려드립니다</p>
                    <p>• 승인 전까지는 제한된 기능만 이용 가능합니다</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  저장 중...
                </div>
              ) : (
                '프로필 저장 및 승인 요청'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 