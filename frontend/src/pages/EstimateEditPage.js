import React, { useEffect, useState } from "react";
import { fetchEstimateById } from "../utils/fetchEstimateById";
import { updateEstimate } from "../utils/updateEstimate";

export default function EstimateEditPage({ estimateId, onSave, onCancel }) {
  const [id, setId] = useState(estimateId);
  const [estimate, setEstimate] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadEstimate(id);
    }
  }, [id]);

  const loadEstimate = async (estimateId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEstimateById(estimateId);
      setEstimate(data);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '견적을 불러오는 중 오류가 발생했습니다.');
      console.error('견적 로딩 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === "quantity" || field === "amount") {
      const numValue = Number(value) || 0;
      item[field] = numValue;
      
      // 자동으로 itemTotal 계산
      if (field === "quantity" || field === "amount") {
        const quantity = field === "quantity" ? numValue : item.quantity || 1;
        const amount = field === "amount" ? numValue : item.amount || 0;
        item.itemTotal = quantity * amount;
      }
    } else {
      item[field] = value;
    }
    
    newItems[index] = item;
    setItems(newItems);

    // 총액 재계산
    const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    setTotal(newTotal);
  };

  const addItem = () => {
    const newItem = {
      name: '',
      description: '',
      amount: 0,
      quantity: 1,
      itemTotal: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    const newTotal = newItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
    setTotal(newTotal);
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await updateEstimate(id, {
        items,
        total,
        itemCount: items.length
      });
      
      alert("견적이 성공적으로 수정되었습니다!");
      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '견적 저장 중 오류가 발생했습니다.');
      console.error('견적 저장 오류:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('변경사항이 저장되지 않습니다. 정말 나가시겠습니까?')) {
      if (onCancel) {
        onCancel();
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">견적을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-600">견적을 찾을 수 없습니다.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">견적 편집</h2>
        <div className="space-x-3">
          <button
            onClick={handleCancel}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            disabled={saving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 견적 기본 정보 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              고객명
            </label>
            <input
              type="text"
              value={estimate.customerName || ''}
              onChange={(e) => setEstimate({...estimate, customerName: e.target.value})}
              className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="고객명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <input
              type="tel"
              value={estimate.customerPhone || ''}
              onChange={(e) => setEstimate({...estimate, customerPhone: e.target.value})}
              className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="연락처를 입력하세요"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프로젝트 설명
          </label>
          <textarea
            value={estimate.projectDescription || ''}
            onChange={(e) => setEstimate({...estimate, projectDescription: e.target.value})}
            className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="프로젝트에 대한 설명을 입력하세요"
          />
        </div>
      </div>

      {/* 견적 항목 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">견적 항목</h3>
          <button
            onClick={addItem}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            항목 추가
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>견적 항목이 없습니다. 항목을 추가해주세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-800">항목 {index + 1}</h4>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      항목명
                    </label>
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="항목명"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수량
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="수량"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      단가
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.amount || 0}
                      onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="단가"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      소계
                    </label>
                    <input
                      type="number"
                      value={item.itemTotal || 0}
                      onChange={(e) => handleItemChange(index, "itemTotal", e.target.value)}
                      className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      placeholder="소계"
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="항목에 대한 설명을 입력하세요"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 총액 표시 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">총 견적 금액</h3>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              {total.toLocaleString()}원
            </p>
            <p className="text-sm text-gray-500">
              {items.length}개 항목
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          onClick={handleCancel}
          className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          disabled={saving}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          disabled={saving}
        >
          {saving ? '저장 중...' : '견적 저장'}
        </button>
      </div>
    </div>
  );
} 