import React, { useState, useEffect } from "react";
import { useAuth, USER_ROLES } from "../hooks/useAuth";
import { getAuth, updateProfile } from "firebase/auth";

const ProfileEdit = ({ onSuccess, onCancel }) => {
  const { user, userProfile, updateUserProfile, clearError } = useAuth();
  const auth = getAuth();
  
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    address: "",
    businessName: "",
    businessNumber: "",
    specialties: [],
    skills: [],
    experience: "",
    availability: {
      weekdays: true,
      weekends: false,
      hours: "09:00-18:00"
    },
    location: "",
    hourlyRate: "",
    profilePhoto: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newSkill, setNewSkill] = useState("");

  // Load user data on component mount
  useEffect(() => {
    if (user && userProfile) {
      setFormData({
        displayName: user.displayName || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        businessName: userProfile.sellerProfile?.businessName || "",
        businessNumber: userProfile.sellerProfile?.businessNumber || "",
        specialties: userProfile.sellerProfile?.specialties || [],
        skills: userProfile.contractorProfile?.skills || [],
        experience: userProfile.contractorProfile?.experience || "",
        availability: userProfile.contractorProfile?.availability || {
          weekdays: true,
          weekends: false,
          hours: "09:00-18:00"
        },
        location: userProfile.contractorProfile?.location || "",
        hourlyRate: userProfile.contractorProfile?.hourlyRate || "",
        profilePhoto: null
      });
    }
  }, [user, userProfile]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle nested object changes (like availability)
  const handleNestedChange = (parentKey, childKey, value) => {
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("파일 크기는 5MB 이하여야 합니다.");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profilePhoto: file
      }));
    }
  };

  // Add specialty (for sellers)
  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty("");
    }
  };

  // Remove specialty
  const removeSpecialty = (index) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  // Add skill (for contractors)
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  // Remove skill
  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.displayName.trim()) {
      setError("이름을 입력해주세요.");
      return false;
    }

    if (formData.phone && !/^[0-9-+\s()]+$/.test(formData.phone)) {
      setError("유효한 전화번호를 입력해주세요.");
      return false;
    }

    if (userProfile?.role === USER_ROLES.SELLER && !formData.businessName.trim()) {
      setError("사업자명을 입력해주세요.");
      return false;
    }

    if (userProfile?.role === USER_ROLES.CONTRACTOR && !formData.location.trim()) {
      setError("활동 지역을 입력해주세요.");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      });

      // Prepare profile updates
      const profileUpdates = {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address
      };

      // Add role-specific updates
      if (userProfile?.role === USER_ROLES.SELLER) {
        profileUpdates.sellerProfile = {
          businessName: formData.businessName,
          businessNumber: formData.businessNumber,
          specialties: formData.specialties
        };
      } else if (userProfile?.role === USER_ROLES.CONTRACTOR) {
        profileUpdates.contractorProfile = {
          skills: formData.skills,
          experience: formData.experience,
          availability: formData.availability,
          location: formData.location,
          hourlyRate: parseFloat(formData.hourlyRate) || 0
        };
      }

      // Update user profile in Firestore
      await updateUserProfile(profileUpdates);

      setIsSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(formData);
      }
      
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "프로필 업데이트에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setIsSuccess(false);
    clearError();
    
    if (onCancel) {
      onCancel();
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            프로필이 성공적으로 업데이트되었습니다
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            변경사항이 저장되었습니다.
          </p>
          
          <button
            onClick={() => setIsSuccess(false)}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            계속 편집
          </button>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">프로필 편집</h2>
        <p className="text-sm text-gray-600">
          계정 정보를 업데이트하세요.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              id="displayName"
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              전화번호
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              주소
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="서울시 강남구..."
            />
          </div>
        </div>

        {/* Seller-specific fields */}
        {userProfile.role === USER_ROLES.SELLER && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">사업자 정보</h3>
            
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                사업자명 *
              </label>
              <input
                id="businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="커튼 전문점"
              />
            </div>

            <div>
              <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">
                사업자등록번호
              </label>
              <input
                id="businessNumber"
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123-45-67890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전문 분야
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="전문 분야 추가"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contractor-specific fields */}
        {userProfile.role === USER_ROLES.CONTRACTOR && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">시공기사 정보</h3>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                활동 지역 *
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="서울시 강남구, 서초구"
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                경력
              </label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="시공 경력과 전문 분야를 설명해주세요"
              />
            </div>

            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
                시급 (원)
              </label>
              <input
                id="hourlyRate"
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보유 기술
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="기술 추가"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 가능 시간
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availability.weekdays}
                    onChange={(e) => handleNestedChange('availability', 'weekdays', e.target.checked)}
                    className="mr-2"
                  />
                  평일
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availability.weekends}
                    onChange={(e) => handleNestedChange('availability', 'weekends', e.target.checked)}
                    className="mr-2"
                  />
                  주말
                </label>
                <input
                  type="text"
                  value={formData.availability.hours}
                  onChange={(e) => handleNestedChange('availability', 'hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="09:00-18:00"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                저장 중...
              </div>
            ) : (
              '프로필 저장'
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit; 