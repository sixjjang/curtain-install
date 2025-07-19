import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { db, storage } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../hooks/useAuth";
import { getProductPricing, findProductPrice } from "../../utils/productPricing";
import { convertTo070, isValidPhone, formatPhone } from "../../utils/phoneConverter";
import { generateWorkOrderId } from "../../utils/firebaseIdGenerator";
import { withRoleProtection } from "../../components/withRoleProtection";
import AddressSearch from "../../components/AddressSearch";
import { geocodeAddress } from "../../utils/distanceCalculator";

function WorkOrderNew({ onSuccess, onCancel }) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    estimateId: "",
    customerName: "",
    customerPhone: "",
    location: "",
    scheduledDate: "",
    urgentFeeRate: 0,
    additionalNotes: "",
    products: [],
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
  const [pricingData, setPricingData] = useState({});
  const [attachedImages, setAttachedImages] = useState([]);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [locationCoordinates, setLocationCoordinates] = useState(null);

  // 제품 단가 데이터 로드
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricing = await getProductPricing();
        setPricingData(pricing);
      } catch (error) {
        console.error('제품 단가 로드 실패:', error);
      }
    };
    loadPricing();
  }, []);

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
        const fileName = `workorder-images/${Date.now()}-${file.name}`;
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
    for (let i = 0; i <formData.products.length; i++) {
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

    try {
      setLoading(true);
      setError(null);

      console.log('시공요청등록 시작:', { user: user?.uid, userData, formData });

      const workOrderData = {
        estimateId: formData.estimateId.trim() || null,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim() || null,
        workerPhone: formData.customerPhone.trim() ? convertTo070(formData.customerPhone) : null,
        location: formData.location.trim(),
        addressData: selectedAddress, // 주소 상세 정보 추가
        locationCoordinates: locationCoordinates, // GPS 좌표 추가
        scheduledDate: new Date(formData.scheduledDate),
        urgentFeeRate: Number(formData.urgentFeeRate) || 0,
        status: "등록",
        products: formData.products,
        additionalNotes: formData.additionalNotes.trim(),
        attachedImages: attachedImages, // 첨부된 이미지 정보 추가
        
        // 픽업 정보 추가
        pickupRequired: formData.pickupRequired,
        pickupLocation: formData.pickupLocation.trim(),
        pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : null,
        pickupTime: formData.pickupTime,
        pickupNotes: formData.pickupNotes.trim(),
        pickupContact: formData.pickupContact.trim(),
        pickupContactPhone: formData.pickupContactPhone.trim(),
        
        // 판매자 정보 (시공자가 확인할 수 있도록)
        sellerId: user?.uid || null,
        sellerName: userData?.displayName || user?.displayName || '판매자',
        sellerPhone: userData?.phone || userData?.businessPhone || null,
        sellerEmail: userData?.email || user?.email || null,
        sellerAddress: userData?.address || userData?.businessAddress || null,
        sellerBusinessName: userData?.businessName || null,
        sellerBusinessNumber: userData?.businessNumber || null,
        sellerBusinessAddress: userData?.businessAddress || null,
        sellerBusinessPhone: userData?.businessPhone || null,
        
        customerId: user?.uid || null,
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
      router.push('/workorder/list');
      
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
      // onCancel prop이 없으면 목록 페이지로 이동
      router.push('/workorder/list');
    }
  };

  const handleReset = () => {
    if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
      setFormData({
        estimateId: "",
        customerName: "",
        customerPhone: "",
        location: "",
        scheduledDate: "",
        urgentFeeRate: 0,
        additionalNotes: "",
        products: [],
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
      <Navigation title="시공 요청 등록" />
      
      <div className="max-w-2xl mx-auto pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">시공 요청 등록</h2>
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
          {/* 사진 첨부 섹션 - 연세가 있으신 분들을 위해 맨 위에 배치 */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xl font-bold text-blue-800">📸 발주서 사진 첨부</h3>
            </div>
            
            <p className="text-blue-700 mb-4 text-lg">
              수기 발주서나 엑셀 파일을 사진으로 찍어서 첨부하세요!
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
                  발주서 사진 선택하기
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
                  <h4 className="font-semibold text-blue-800 mb-3">첨부된 발주서 ({attachedImages.length}개)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachedImages.map((image, index) => (
                      <div key={index} className="relative border rounded-lg p-3">
                        <img 
                          src={image.url} 
                          alt={`발주서 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="mt-2 text-sm text-gray-600">
                          {image.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
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

          {/* 견적 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              견적 ID <span className="text-gray-500">(선택사항)</span>
            </label>
            <input
              type="text"
              placeholder="관련 견적 ID를 입력하세요"
              value={formData.estimateId}
              onChange={(e) => handleInputChange('estimateId', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              기존 견적과 연결하려면 견적 ID를 입력하세요
            </p>
          </div>

          {/* 고객명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="고객명을 입력하세요"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* 고객 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              고객 전화번호 <span className="text-gray-500">(선택사항)</span>
            </label>
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="예: 010-1234-5678"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              {formData.customerPhone && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">시공자용 번호:</span> {convertTo070(formData.customerPhone)}
                  <span className="ml-2 text-blue-600">(임시번호로 변환됨)</span>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              고객의 실제 전화번호를 입력하면 시공자에게는 임시번호가 제공되어 개인정보가 보호됩니다
            </p>
          </div>

          {/* 시공 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시공 장소 <span className="text-red-500">*</span>
            </label>
            <AddressSearch
              onAddressSelect={handleAddressSelect}
              placeholder="시공할 장소를 검색하세요 (예: 서울시 강남구 테헤란로 123)"
              className="w-full"
            />
            {selectedAddress && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">선택된 주소:</span> {selectedAddress.address}
              </div>
            )}
          </div>

          {/* 시공 예정일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시공 예정일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              min={today}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              오늘 이후의 날짜를 선택해주세요
            </p>
          </div>

          {/* 제품 정보 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                시공 제품 정보 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm flex items-center"
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                제품 추가
              </button>
            </div>
            
            {formData.products.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">시공할 제품을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.products.map((product, index) => (
                  <div key={index} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-medium text-gray-700">제품 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        disabled={loading}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          제품명 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          disabled={loading}
                        >
                          <option value="">제품을 선택하세요</option>
                          <option value="커튼">커튼</option>
                          <option value="블라인드">블라인드</option>
                          <option value="롤스크린">롤스크린</option>
                          <option value="버티컬블라인드">버티컬블라인드</option>
                          <option value="로만쉐이드">로만쉐이드</option>
                          <option value="기타">기타</option>
                        </select>
                        {product.name && (
                          <div className="mt-1 text-xs text-blue-600">
                            단가: {findProductPrice(product.name, pricingData)?.price?.toLocaleString() || 0}원
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            수량 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            placeholder="1"
                            value={product.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={loading}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            단위
                          </label>
                          <select
                            value={product.unit}
                            onChange={(e) => updateProduct(index, 'unit', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={loading}
                          >
                            <option value="개">개</option>
                            <option value="세트">세트</option>
                            <option value="m²">m²</option>
                            <option value="m">m</option>
                            <option value="EA">EA</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        제품 설명
                      </label>
                      <textarea
                        placeholder="제품의 상세 스펙이나 특별한 요구사항을 입력하세요"
                        value={product.description}
                        onChange={(e) => updateProduct(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                      className="w-full p-3 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 긴급 시공 수수료 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              긴급 시공 수수료 <span className="text-gray-500">(%)</span>
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.urgentFeeRate}
              onChange={(e) => handleInputChange('urgentFeeRate', e.target.value)}
              min={0}
              max={100}
              step={0.1}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              긴급 시공이 필요한 경우 추가 수수료를 설정할 수 있습니다 (0-100%)
            </p>
          </div>

          {/* 추가 요청사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 요청사항
            </label>
            <textarea
              placeholder="시공 시 특별히 고려해야 할 사항이나 추가 요청사항을 입력하세요"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  시공 요청 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

// 역할별 페이지 보호 적용 (판매자만 접근 가능)
export default withRoleProtection(WorkOrderNew, ['seller']); 