import React, { useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Navigation from "../../components/Navigation";

export default function WorkOrderNew({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    estimateId: "",
    customerName: "",
    location: "",
    scheduledDate: "",
    urgentFeeRate: 0,
    additionalNotes: "",
    products: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    try {
      setLoading(true);
      setError(null);

      const workOrderData = {
        estimateId: formData.estimateId.trim() || null,
        customerName: formData.customerName.trim(),
        location: formData.location.trim(),
        scheduledDate: new Date(formData.scheduledDate),
        urgentFeeRate: Number(formData.urgentFeeRate) || 0,
        status: "등록",
        products: formData.products,
        additionalNotes: formData.additionalNotes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "workOrders"), workOrderData);
      
      alert("시공 요청이 성공적으로 등록되었습니다.");
      
      if (onSuccess) {
        onSuccess(docRef.id, workOrderData);
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
    }
  };

  const handleReset = () => {
    if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
      setFormData({
        estimateId: "",
        customerName: "",
        location: "",
        scheduledDate: "",
        urgentFeeRate: 0,
        additionalNotes: "",
        products: []
      });
      setError(null);
    }
  };

  // 최소 날짜를 오늘로 설정
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="시공 요청 등록" />
      
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

          {/* 시공 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시공 장소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="시공할 장소를 입력하세요 (예: 서울시 강남구 테헤란로 123)"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          제품명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="예: 블라인드, 커튼, 롤스크린"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          disabled={loading}
                        />
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