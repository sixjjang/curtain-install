import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import Navigation from '../components/Navigation';
import { getRoleColors } from '../utils/roleColors';

const ProfileSetup = () => {
  const router = useRouter();
  const { user, userProfile, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // 공통 정보
  const [commonInfo, setCommonInfo] = useState({
    displayName: '',
    phone: '',
    address: '',
    profileImage: null
  });

  // 판매자 정보
  const [sellerInfo, setSellerInfo] = useState({
    businessName: '',
    businessNumber: '',
    businessLicense: null,
    businessAddress: '',
    businessPhone: '',
    businessDescription: ''
  });

  // 시공자 정보
  const [contractorInfo, setContractorInfo] = useState({
    driverLicense: null,
    vehicleRegistration: null,
    insuranceCertificate: null,
    experience: '',
    skills: [],
    hourlyRate: '',
    availability: {
      weekdays: true,
      weekends: false,
      hours: '09:00-18:00'
    },
    serviceAreas: []
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // 이미 승인된 사용자는 대시보드로 이동
    if (userProfile?.isApproved) {
      router.push('/dashboard');
      return;
    }

    // 기존 정보가 있으면 로드
    if (userProfile) {
      setCommonInfo({
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        profileImage: null
      });

      if (hasRole('seller')) {
        setSellerInfo({
          businessName: userProfile.businessName || '',
          businessNumber: userProfile.businessNumber || '',
          businessLicense: null,
          businessAddress: userProfile.businessAddress || '',
          businessPhone: userProfile.businessPhone || '',
          businessDescription: userProfile.businessDescription || ''
        });
      }

      if (hasRole('contractor')) {
        setContractorInfo({
          driverLicense: null,
          vehicleRegistration: null,
          insuranceCertificate: null,
          experience: userProfile.experience || '',
          skills: userProfile.skills || [],
          hourlyRate: userProfile.hourlyRate || '',
          availability: userProfile.availability || {
            weekdays: true,
            weekends: false,
            hours: '09:00-18:00'
          },
          serviceAreas: userProfile.serviceAreas || []
        });
      }
    }
  }, [user, userProfile, hasRole, router]);

  const handleFileUpload = async (file, type) => {
    if (!file) return null;
    
    try {
      const storageRef = ref(storage, `documents/${user.uid}/${type}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('파일 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        ...commonInfo,
        profileSetupCompleted: true,
        approvalStatus: 'pending',
        submittedAt: new Date(),
        updatedAt: new Date()
      };

      // 판매자 정보 추가
      if (hasRole('seller')) {
        if (sellerInfo.businessLicense) {
          const licenseUrl = await handleFileUpload(sellerInfo.businessLicense, 'business-license');
          updates.businessLicenseUrl = licenseUrl;
        }
        Object.assign(updates, sellerInfo);
      }

      // 시공자 정보 추가
      if (hasRole('contractor')) {
        const documentUrls = {};
        
        if (contractorInfo.driverLicense) {
          documentUrls.driverLicenseUrl = await handleFileUpload(contractorInfo.driverLicense, 'driver-license');
        }
        if (contractorInfo.vehicleRegistration) {
          documentUrls.vehicleRegistrationUrl = await handleFileUpload(contractorInfo.vehicleRegistration, 'vehicle-registration');
        }
        if (contractorInfo.insuranceCertificate) {
          documentUrls.insuranceCertificateUrl = await handleFileUpload(contractorInfo.insuranceCertificate, 'insurance-certificate');
        }
        
        Object.assign(updates, contractorInfo, documentUrls);
      }

      await updateDoc(userRef, updates);

      setIsSuccess(true);
      setMessage('회원정보가 성공적으로 제출되었습니다. 관리자 승인 후 서비스를 이용하실 수 있습니다.');
      
      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Profile setup error:', error);
      setMessage('회원정보 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, setter, field) => {
    const file = e.target.files[0];
    if (file) {
      setter(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSkillChange = (skill) => {
    setContractorInfo(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleServiceAreaChange = (area) => {
    setContractorInfo(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area]
    }));
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="회원정보 입력" />
      
      <div className="max-w-4xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 ${getRoleColors(hasRole('seller') ? 'seller' : 'contractor').accentLight} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className={`w-8 h-8 ${getRoleColors(hasRole('seller') ? 'seller' : 'contractor').icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">회원정보 입력</h1>
            <p className="text-gray-600 mt-2">
              {hasRole('seller') ? '판매자' : '시공기사'} 역할에 맞는 정보를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 공통 정보 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commonInfo.displayName}
                    onChange={(e) => setCommonInfo(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="실명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={commonInfo.phone}
                    onChange={(e) => setCommonInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="010-1234-5678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commonInfo.address}
                    onChange={(e) => setCommonInfo(prev => ({ ...prev, address: e.target.value }))}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 판매자 정보 */}
            {hasRole('seller') && (
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">사업자 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      상호명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sellerInfo.businessName}
                      onChange={(e) => setSellerInfo(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="상호명을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업자등록번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sellerInfo.businessNumber}
                      onChange={(e) => setSellerInfo(prev => ({ ...prev, businessNumber: e.target.value }))}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123-45-67890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업자등록증 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setSellerInfo, 'businessLicense')}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">이미지 또는 PDF 파일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업장 전화번호
                    </label>
                    <input
                      type="tel"
                      value={sellerInfo.businessPhone}
                      onChange={(e) => setSellerInfo(prev => ({ ...prev, businessPhone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="02-1234-5678"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업장 주소 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sellerInfo.businessAddress}
                      onChange={(e) => setSellerInfo(prev => ({ ...prev, businessAddress: e.target.value }))}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="사업장 주소를 입력하세요"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사업 설명
                    </label>
                    <textarea
                      value={sellerInfo.businessDescription}
                      onChange={(e) => setSellerInfo(prev => ({ ...prev, businessDescription: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="사업에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 시공자 정보 */}
            {hasRole('contractor') && (
              <div className="border-b border-gray-200 pb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">시공자 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      운전면허증 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setContractorInfo, 'driverLicense')}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">이미지 또는 PDF 파일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      차량등록증
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setContractorInfo, 'vehicleRegistration')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">이미지 또는 PDF 파일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      보험증서
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, setContractorInfo, 'insuranceCertificate')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">이미지 또는 PDF 파일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시공 경력 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={contractorInfo.experience}
                      onChange={(e) => setContractorInfo(prev => ({ ...prev, experience: e.target.value }))}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">경력을 선택하세요</option>
                      <option value="1년 미만">1년 미만</option>
                      <option value="1-3년">1-3년</option>
                      <option value="3-5년">3-5년</option>
                      <option value="5-10년">5-10년</option>
                      <option value="10년 이상">10년 이상</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시급 (원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={contractorInfo.hourlyRate}
                      onChange={(e) => setContractorInfo(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      required
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      보유 기술
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['커튼 설치', '블라인드 설치', '롤스크린 설치', '베네시안 설치', '로만쉐이드 설치', '버티컬 설치', '가리개 설치', '기타'].map(skill => (
                        <label key={skill} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contractorInfo.skills.includes(skill)}
                            onChange={() => handleSkillChange(skill)}
                            className="mr-2"
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      서비스 가능 지역
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map(area => (
                        <label key={area} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contractorInfo.serviceAreas.includes(area)}
                            onChange={() => handleServiceAreaChange(area)}
                            className="mr-2"
                          />
                          <span className="text-sm">{area}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근무 가능 시간
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contractorInfo.availability.weekdays}
                            onChange={(e) => setContractorInfo(prev => ({
                              ...prev,
                              availability: { ...prev.availability, weekdays: e.target.checked }
                            }))}
                            className="mr-2"
                          />
                          <span>평일</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contractorInfo.availability.weekends}
                            onChange={(e) => setContractorInfo(prev => ({
                              ...prev,
                              availability: { ...prev.availability, weekends: e.target.checked }
                            }))}
                            className="mr-2"
                          />
                          <span>주말</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={contractorInfo.availability.hours}
                        onChange={(e) => setContractorInfo(prev => ({
                          ...prev,
                          availability: { ...prev.availability, hours: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="09:00-18:00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                나중에 입력
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                  getRoleColors(hasRole('seller') ? 'seller' : 'contractor').button
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    제출 중...
                  </div>
                ) : (
                  '승인 요청'
                )}
              </button>
            </div>
          </form>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              isSuccess 
                ? "bg-green-50 border border-green-200 text-green-700" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isSuccess ? (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup; 