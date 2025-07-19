import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { db, storage } from "../../../firebase/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navigation from "../../../components/Navigation";
import { useAuth } from "../../../hooks/useAuth";
import { convertTo070, isValidPhone, formatPhone } from "../../../utils/phoneConverter";
import { generateWorkOrderId } from "../../../utils/firebaseIdGenerator";
import AddressSearch from "../../../components/AddressSearch";
import { geocodeAddress } from "../../../utils/distanceCalculator";

function ContractorWorkOrderNew({ onSuccess, onCancel }) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    location: "",
    scheduledDate: "",
    scheduledTime: "",
    urgentFeeRate: 0,
    additionalNotes: "",
    products: [],
    workType: "direct", // direct: 직접 등록, transfer: 업무 양도, personal: 개인 요청
    transferReason: "", // 업무 양도 사유
    personalRequestDetails: "", // 개인 요청 상세
    estimatedDuration: "", // 예상 소요 시간
    requiredSkills: [], // 필요한 기술/자격
    teamSize: 1, // 필요 인원
    budget: "", // 예산
    priority: "normal", // 우선순위: low, normal, high, urgent
    // 픽업 정보 추가
    pickupRequired: false,
    pickupLocation: "",
    pickupDate: "",
    pickupTime: "",
    pickupNotes: "",
    pickupContact: "",
    pickupContactPhone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attachedImages, setAttachedImages] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationCoordinates, setLocationCoordinates] = useState(null);

  // 시공자 권한 확인
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (userData?.role !== 'contractor') {
      alert('시공자만 접근할 수 있습니다.');
      router.push('/dashboard');
      return;
    }
  }, [user, userData, router]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 주소 선택 핸들러
  const handleAddressSelect = async (addressData) => {
    setSelectedAddress(addressData);
    setFormData(prev => ({
      ...prev,
      location: addressData.address
    }));

    // 주소를 좌표로 변환
    try {
      const coordinates = await geocodeAddress(addressData.address);
      if (coordinates) {
        setLocationCoordinates(coordinates);
        console.log('주소 좌표 변환 성공:', coordinates);
      } else {
        console.warn('주소 좌표 변환 실패');
        setLocationCoordinates(null);
      }
    } catch (error) {
      console.error('주소 좌표 변환 오류:', error);
      setLocationCoordinates(null);
    }
  };

  // 사진 첨부 처리
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // 파일 크기 및 형식 검증
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    for (let file of files) {
      if (file.size > maxSize) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError('JPG, PNG 형식의 이미지만 업로드 가능합니다.');
        return;
      }
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `contractor-workorder-images/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, fileName);
        
        // 업로드 진행률 업데이트
        setImageUploadProgress(((i + 1) / files.length) * 100);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadedImages.push({
          name: file.name,
          url: downloadURL,
          size: file.size,
          uploadedAt: new Date()
        });
      }
      
      setAttachedImages(prev => [...prev, ...uploadedImages]);
      setImageUploadProgress(0);
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사진 삭제
  const removeImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: "", quantity: 1, unit: "개", description: "" }]
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const addRequiredSkill = () => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, ""]
    }));
  };

  const removeRequiredSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const updateRequiredSkill = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map((skill, i) => 
        i === index ? value : skill
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 기본 검증
    if (!formData.customerName.trim()) {
      setError('고객명을 입력해주세요.');
      return;
    }

    if (formData.customerPhone.trim() && !isValidPhone(formData.customerPhone)) {
      setError('올바른 전화번호 형식을 입력해주세요.');
      return;
    }

    if (!formData.location.trim()) {
      setError('시공 장소를 입력해주세요.');
      return;
    }

    if (!formData.scheduledDate) {
      setError('시공 예정일을 선택해주세요.');
      return;
    }

    if (formData.products.length === 0) {
      setError('최소 하나의 제품을 추가해주세요.');
      return;
    }

    // 제품 정보 검증
    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      if (!product.name.trim()) {
        setError(`${i + 1}번째 제품의 이름을 입력해주세요.`);
        return;
      }
      if (product.quantity <= 0) {
        setError(`${i + 1}번째 제품의 수량을 올바르게 입력해주세요.`);
        return;
      }
    }

    // 업무 양도 사유 검증
    if (formData.workType === 'transfer' && !formData.transferReason.trim()) {
      setError('업무 양도 사유를 입력해주세요.');
      return;
    }

    // 개인 요청 상세 검증
    if (formData.workType === 'personal' && !formData.personalRequestDetails.trim()) {
      setError('개인 요청 상세 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('시공자 시공요청등록 시작:', { user: user?.uid, userData, formData });

      // 예정일과 시간 결합
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '09:00'}`);

      const workOrderData = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || null,
        workerPhone: formData.customerPhone.trim() ? convertTo070(formData.customerPhone) : null,
        location: formData.location.trim(),
        addressData: selectedAddress,
        locationCoordinates: locationCoordinates,
        scheduledDate: scheduledDateTime,
        urgentFeeRate: Number(formData.urgentFeeRate) || 0,
        status: "등록",
        products: formData.products,
        additionalNotes: formData.additionalNotes.trim(),
        attachedImages: attachedImages,
        
        // 픽업 정보 추가
        pickupRequired: formData.pickupRequired,
        pickupLocation: formData.pickupLocation.trim(),
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : null,
        pickupTime: formData.pickupTime,
        pickupNotes: formData.pickupNotes.trim(),
        pickupContact: formData.pickupContact.trim(),
        pickupContactPhone: formData.pickupContactPhone.trim(),
        
        // 시공자 정보 (등록자)
        contractorId: user?.uid || null,
        contractorName: userData?.displayName || user?.displayName || '시공자',
        contractorPhone: userData?.phone || null,
        contractorEmail: userData?.email || user?.email || null,
        contractorAddress: userData?.address || null,
        contractorBusinessName: userData?.businessName || null,
        contractorBusinessNumber: userData?.businessNumber || null,
        
        // 시공자 직접 등록 관련 정보
        workType: formData.workType,
        transferReason: formData.transferReason.trim(),
        personalRequestDetails: formData.personalRequestDetails.trim(),
        estimatedDuration: formData.estimatedDuration.trim(),
        requiredSkills: formData.requiredSkills.filter(skill => skill.trim()),
        teamSize: Number(formData.teamSize) || 1,
        budget: formData.budget.trim(),
        priority: formData.priority,
        
        // 등록 구분
        registeredBy: 'contractor', // contractor, seller
        originalContractorId: user?.uid || null, // 원래 시공자 ID
        
        customerId: null, // 시공자가 등록한 경우 고객 ID는 null
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('저장할 데이터:', workOrderData);

      // 새로운 작업주문 ID 생성
      const workOrderId = await generateWorkOrderId();
      console.log('생성된 작업주문 ID:', workOrderId);

      // 사용자 친화적인 ID를 문서 ID로 사용하여 저장
      const docRef = doc(db, "workOrders", workOrderId);
      await setDoc(docRef, workOrderData);
      
      console.log('저장 성공:', workOrderId);
      
      alert(`시공 요청이 성공적으로 등록되었습니다.\n작업주문 ID: ${workOrderId}`);
      
      // 등록 성공 시 목록 페이지로 자동 이동
      router.push('/contractor/workorder/list');
      
      if (onSuccess) {
        onSuccess(workOrderId, workOrderData);
      }
    } catch (error) {
      setError('등록 중 오류가 발생했습니다.');
      console.error('시공 요청 등록 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/contractor/workorder/list');
    }
  };

  const handleReset = () => {
    if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
      setFormData({
        customerName: "",
        customerPhone: "",
        location: "",
        scheduledDate: "",
        scheduledTime: "",
        urgentFeeRate: 0,
        additionalNotes: "",
        products: [],
        workType: "direct",
        transferReason: "",
        personalRequestDetails: "",
        estimatedDuration: "",
        requiredSkills: [],
        teamSize: 1,
        budget: "",
        priority: "normal",
        pickupRequired: false,
        pickupLocation: "",
        pickupDate: "",
        pickupTime: "",
        pickupNotes: "",
        pickupContact: "",
        pickupContactPhone: ""
      });
      setAttachedImages([]);
      setError(null);
    }
  };

  // 최소 날짜를 오늘로 설정
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공자 시공요청 등록" />
      
      <div className="max-w-4xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">시공자 시공요청 등록</h2>
            <div className="space-x-3">
              <button
                onClick={handleReset}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                초기화
              </button>
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 등록 유형 선택 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4">📋 등록 유형 선택</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="radio"
                    name="workType"
                    value="direct"
                    checked={formData.workType === 'direct'}
                    onChange={(e) => handleInputChange('workType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-blue-800">직접 등록</div>
                    <div className="text-sm text-blue-600">개인적으로 받은 시공 요청</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="radio"
                    name="workType"
                    value="transfer"
                    checked={formData.workType === 'transfer'}
                    onChange={(e) => handleInputChange('workType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-blue-800">업무 양도</div>
                    <div className="text-sm text-blue-600">기존 업무를 다른 시공자에게 양도</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                  <input
                    type="radio"
                    name="workType"
                    value="personal"
                    checked={formData.workType === 'personal'}
                    onChange={(e) => handleInputChange('workType', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-blue-800">개인 요청</div>
                    <div className="text-sm text-blue-600">개인적으로 받은 요청을 팀 업무로</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 등록 유형별 추가 정보 */}
            {formData.workType === 'transfer' && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">🔄 업무 양도 사유</h3>
                <textarea
                  value={formData.transferReason}
                  onChange={(e) => handleInputChange('transferReason', e.target.value)}
                  placeholder="업무를 양도하는 사유를 상세히 입력해주세요. (예: 일정 변경, 기술적 어려움, 인력 부족 등)"
                  className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {formData.workType === 'personal' && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-800 mb-4">👥 개인 요청 상세</h3>
                <textarea
                  value={formData.personalRequestDetails}
                  onChange={(e) => handleInputChange('personalRequestDetails', e.target.value)}
                  placeholder="개인적으로 받은 요청의 상세 내용을 입력해주세요. (예: 지인 소개, 개인 네트워크를 통한 요청 등)"
                  className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객명 *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="고객 이름을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객 연락처
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            {/* 시공 장소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시공 장소 *
              </label>
              <AddressSearch onAddressSelect={handleAddressSelect} />
              {selectedAddress && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>선택된 주소:</strong> {selectedAddress.address}
                  </div>
                </div>
              )}
            </div>

            {/* 일정 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시공 예정일 *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={today}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시공 예정 시간
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  긴급 수당 (%)
                </label>
                <input
                  type="number"
                  value={formData.urgentFeeRate}
                  onChange={(e) => handleInputChange('urgentFeeRate', e.target.value)}
                  min="0"
                  max="50"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 업무 상세 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예상 소요 시간
                </label>
                <input
                  type="text"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 2시간, 반나절, 1일"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  필요 인원
                </label>
                <input
                  type="number"
                  value={formData.teamSize}
                  onChange={(e) => handleInputChange('teamSize', e.target.value)}
                  min="1"
                  max="10"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예산 (선택사항)
                </label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 50만원, 협의"
                />
              </div>
            </div>

            {/* 우선순위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-600">낮음</span>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={formData.priority === 'normal'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-600">보통</span>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-600">높음</span>
                </label>
                
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={formData.priority === 'urgent'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-600">긴급</span>
                </label>
              </div>
            </div>

            {/* 필요한 기술/자격 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                필요한 기술/자격
              </label>
              <div className="space-y-2">
                {formData.requiredSkills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => updateRequiredSkill(index, e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 전기공사업자, 용접기술, 고소작업자격"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequiredSkill(index)}
                      className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequiredSkill}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  + 기술/자격 추가
                </button>
              </div>
            </div>

            {/* 제품 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품 정보 *
              </label>
              <div className="space-y-4">
                {formData.products.map((product, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="제품명"
                      required
                    />
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="수량"
                      min="1"
                      required
                    />
                    <input
                      type="text"
                      value={product.unit}
                      onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="단위"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="설명"
                      />
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProduct}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  + 제품 추가
                </button>
              </div>
            </div>

            {/* 픽업 정보 */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4m8 0h4" />
                </svg>
                <h3 className="text-xl font-bold text-yellow-800">📦 제품 픽업 정보</h3>
              </div>
              
              <div className="space-y-4">
                {/* 픽업 필요 여부 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pickupRequired"
                    checked={formData.pickupRequired}
                    onChange={(e) => handleInputChange('pickupRequired', e.target.checked)}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="pickupRequired" className="ml-2 text-sm font-medium text-yellow-800">
                    제품 픽업이 필요합니다
                  </label>
                </div>

                {/* 픽업 정보 입력 (픽업 필요 시에만 표시) */}
                {formData.pickupRequired && (
                  <div className="space-y-4 pl-6 border-l-2 border-yellow-300">
                    {/* 픽업 장소 */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 mb-2">
                        픽업 장소 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="제품을 픽업할 장소의 주소를 입력하세요"
                        value={formData.pickupLocation}
                        onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                        className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={loading}
                        required={formData.pickupRequired}
                      />
                    </div>

                    {/* 픽업 일정 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          픽업 날짜 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.pickupDate}
                          onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                          min={today}
                          className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={loading}
                          required={formData.pickupRequired}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          픽업 시간
                        </label>
                        <input
                          type="time"
                          value={formData.pickupTime}
                          onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                          className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* 픽업 담당자 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          픽업 담당자
                        </label>
                        <input
                          type="text"
                          placeholder="픽업 담당자 이름"
                          value={formData.pickupContact}
                          onChange={(e) => handleInputChange('pickupContact', e.target.value)}
                          className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={loading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          픽업 담당자 연락처
                        </label>
                        <input
                          type="tel"
                          placeholder="010-1234-5678"
                          value={formData.pickupContactPhone}
                          onChange={(e) => handleInputChange('pickupContactPhone', e.target.value)}
                          className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* 픽업 특이사항 */}
                    <div>
                      <label className="block text-sm font-medium text-yellow-800 mb-2">
                        픽업 특이사항
                      </label>
                      <textarea
                        placeholder="픽업 시 주의사항이나 특별한 요구사항을 입력하세요 (예: 입구 위치, 주차 정보, 특정 시간대 제한 등)"
                        value={formData.pickupNotes}
                        onChange={(e) => handleInputChange('pickupNotes', e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 사진 첨부 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.14a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-xl font-bold text-blue-800">📸 관련 사진 첨부</h3>
              </div>
              
              <p className="text-blue-700 mb-4 text-lg">
                시공 현장 사진이나 관련 자료를 첨부하세요!
              </p>
              
              <div className="space-y-4">
                {/* 사진 업로드 버튼 */}
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center mx-auto"
                  >
                    <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    사진 선택하기
                  </button>
                  <p className="mt-2 text-sm text-blue-600">
                    JPG, PNG 파일 (최대 10MB)
                  </p>
                </div>

                {/* 업로드 진행률 */}
                {imageUploadProgress > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-600">업로드 중...</span>
                      <span className="text-sm text-blue-600">{Math.round(imageUploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${imageUploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 첨부된 이미지 목록 */}
                {attachedImages.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">첨부된 사진 ({attachedImages.length}개)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachedImages.map((image, index) => (
                        <div key={index} className="relative border rounded-lg p-3">
                          <img 
                            src={image.url} 
                            alt={`첨부사진 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <div className="mt-2 text-sm text-gray-600">
                            {image.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 특이사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                특이사항
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="시공 시 주의사항이나 특별한 요구사항이 있다면 입력해주세요."
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? '등록 중...' : '시공요청 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContractorWorkOrderNew; 