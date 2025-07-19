import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import Navigation from '../../components/Navigation';
import { useRouter } from 'next/router';

export default function ProductPricing() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // 제품 추가/수정 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: '개' });

  // 기본 단위 옵션
  const unitOptions = ['개', '세트', 'm²', 'm', 'EA', '조'];

  // 시공높이 옵션
  const heightOptions = ['300cm', '400cm', '450cm', '500cm', '550cm', '600cm'];

  // 기본 옵션 설정
  const defaultOptions = {
    motor: { name: '전동', price: 0, enabled: false },
    batteryMotor: { name: '배터리전동', price: 0, enabled: false },
    height: { 
      name: '시공높이', 
      options: heightOptions.map(height => ({ height, price: 0 })),
      enabled: false 
    },
    gypsum: { name: '석고', price: 0, enabled: false },
    steelPlate: { name: '철판(일정두께이상)', price: 0, enabled: false },
    customMessage: { name: '기타 전달메시지', price: 0, enabled: false, message: '' }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    try {
      const adminAuth = sessionStorage.getItem('adminAuthenticated');
      const loginTime = sessionStorage.getItem('adminLoginTime');
      
      if (adminAuth === 'true' && loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const sessionDuration = 24 * 60 * 60 * 1000;
        
        if (now - loginTimestamp < sessionDuration) {
          setIsAdminAuthenticated(true);
          loadProducts();
        } else {
          sessionStorage.removeItem('adminAuthenticated');
          sessionStorage.removeItem('adminLoginTime');
          router.push('/admin-login');
        }
      } else {
        router.push('/admin-login');
      }
    } catch (error) {
      console.error('Admin auth check error:', error);
      router.push('/admin-login');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, 'productPricing'));
      if (!productsSnapshot.empty) {
        const productsData = [];
        productsSnapshot.forEach(doc => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name,
            price: data.price || 0,
            unit: data.unit || '개',
            options: data.options || defaultOptions,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          });
        });
        setProducts(productsData);
      } else {
        // 초기 데이터 설정
        const defaultProducts = [
          { name: '커튼', price: 50000, unit: '개' },
          { name: '블라인드', price: 30000, unit: '개' },
          { name: '롤스크린', price: 40000, unit: '개' },
          { name: '버티컬블라인드', price: 35000, unit: '개' },
          { name: '로만쉐이드', price: 60000, unit: '개' },
          { name: '기타', price: 25000, unit: '개' }
        ];
        
        const savedProducts = [];
        for (const product of defaultProducts) {
          const docRef = await addDoc(collection(db, 'productPricing'), {
            ...product,
            options: defaultOptions,
            createdAt: new Date(),
            updatedAt: new Date(),
            updatedBy: 'admin'
          });
          savedProducts.push({
            id: docRef.id,
            ...product,
            options: defaultOptions
          });
        }
        setProducts(savedProducts);
      }
    } catch (error) {
      console.error('제품 정보 로드 실패:', error);
      setMessage('제품 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 숫자를 천 단위 콤마가 포함된 문자열로 변환
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 천 단위 콤마가 포함된 문자열을 숫자로 변환
  const parseNumber = (str) => {
    if (!str) return 0;
    return parseInt(str.replace(/,/g, '')) || 0;
  };

  const handlePriceChange = (productId, value) => {
    const numericValue = parseNumber(value);
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, price: numericValue }
        : product
    ));
  };

  const handleUnitChange = (productId, value) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, unit: value }
        : product
    ));
  };

  // 옵션 가격 변경
  const handleOptionPriceChange = (optionKey, value) => {
    if (!selectedProduct) return;
    
    const numericValue = parseNumber(value);
    setProducts(prev => prev.map(product => 
      product.id === selectedProduct.id 
        ? {
            ...product,
            options: {
              ...product.options,
              [optionKey]: {
                ...product.options[optionKey],
                price: numericValue
              }
            }
          }
        : product
    ));
  };

  // 옵션 활성화/비활성화
  const handleOptionToggle = (optionKey) => {
    if (!selectedProduct) return;
    
    setProducts(prev => prev.map(product => 
      product.id === selectedProduct.id 
        ? {
            ...product,
            options: {
              ...product.options,
              [optionKey]: {
                ...product.options[optionKey],
                enabled: !product.options[optionKey].enabled
              }
            }
          }
        : product
    ));
  };

  // 시공높이 옵션 가격 변경
  const handleHeightPriceChange = (height, value) => {
    if (!selectedProduct) return;
    
    const numericValue = parseNumber(value);
    setProducts(prev => prev.map(product => 
      product.id === selectedProduct.id 
        ? {
            ...product,
            options: {
              ...product.options,
              height: {
                ...product.options.height,
                options: product.options.height.options.map(option => 
                  option.height === height 
                    ? { ...option, price: numericValue }
                    : option
                )
              }
            }
          }
        : product
    ));
  };

  // 기타 메시지 변경
  const handleCustomMessageChange = (value) => {
    if (!selectedProduct) return;
    
    setProducts(prev => prev.map(product => 
      product.id === selectedProduct.id 
        ? {
            ...product,
            options: {
              ...product.options,
              customMessage: {
                ...product.options.customMessage,
                message: value
              }
            }
          }
        : product
    ));
  };

  const savePricing = async () => {
    try {
      setSaving(true);
      setMessage('');

      // 각 제품별로 Firestore에 저장
      for (const product of products) {
        await setDoc(doc(db, 'productPricing', product.id), {
          name: product.name,
          price: product.price,
          unit: product.unit,
          options: product.options,
          updatedAt: new Date(),
          updatedBy: 'admin'
        });
      }

      setMessage('단가 설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('단가 저장 실패:', error);
      setMessage('단가 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 제품 추가
  const addProduct = async () => {
    if (!newProduct.name.trim()) {
      setMessage('제품명을 입력해주세요.');
      return;
    }
    if (!newProduct.price || parseNumber(newProduct.price) <= 0) {
      setMessage('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const docRef = await addDoc(collection(db, 'productPricing'), {
        name: newProduct.name.trim(),
        price: parseNumber(newProduct.price),
        unit: newProduct.unit,
        options: defaultOptions,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'admin'
      });

      const addedProduct = {
        id: docRef.id,
        name: newProduct.name.trim(),
        price: parseNumber(newProduct.price),
        unit: newProduct.unit,
        options: defaultOptions
      };

      setProducts(prev => [...prev, addedProduct]);
      setNewProduct({ name: '', price: '', unit: '개' });
      setShowAddModal(false);
      setMessage('제품이 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('제품 추가 실패:', error);
      setMessage('제품 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 제품 수정
  const editProduct = async () => {
    if (!editingProduct.name.trim()) {
      setMessage('제품명을 입력해주세요.');
      return;
    }
    if (!editingProduct.price || editingProduct.price <= 0) {
      setMessage('올바른 가격을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, 'productPricing', editingProduct.id), {
        name: editingProduct.name.trim(),
        price: editingProduct.price,
        unit: editingProduct.unit,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });

      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id ? editingProduct : product
      ));
      
      setEditingProduct(null);
      setShowEditModal(false);
      setMessage('제품이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('제품 수정 실패:', error);
      setMessage('제품 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 제품 삭제
  const deleteProduct = async (productId) => {
    if (!confirm('정말로 이 제품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setSaving(true);
      await deleteDoc(doc(db, 'productPricing', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      setMessage('제품이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('제품 삭제 실패:', error);
      setMessage('제품 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 옵션 모달 열기
  const openOptionsModal = (product) => {
    setSelectedProduct(product);
    setShowOptionsModal(true);
  };

  // 관리자 권한 체크
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="접근 제한" />
        <div className="max-w-4xl mx-auto pt-24 pb-8 px-4">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">접근 권한이 없습니다</h2>
            <p className="text-gray-600 mb-6">관리자 권한이 필요한 페이지입니다.</p>
            <a href="/admin-login" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors">
              관리자 로그인
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation title="제품 단가 설정" />
        <div className="max-w-4xl mx-auto pt-24 pb-8 px-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="제품 단가 설정" />
      
      <div className="max-w-7xl mx-auto pt-24 pb-8 px-4">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">제품별 단가 설정</h2>
            <div className="space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                disabled={saving}
              >
                제품 추가
              </button>
              <button
                onClick={savePricing}
                disabled={saving}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    저장
                  </>
                )}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('실패') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제품명
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기본 단가 (원)
                    </label>
                    <input
                      type="text"
                      value={formatNumber(product.price)}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      disabled={saving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      단위
                    </label>
                    <select
                      value={product.unit || '개'}
                      onChange={(e) => handleUnitChange(product.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={saving}
                    >
                      {unitOptions.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      옵션 설정
                    </label>
                    <button
                      onClick={() => openOptionsModal(product)}
                      className="w-full bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-700 transition-colors text-sm"
                      disabled={saving}
                    >
                      옵션 관리
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowEditModal(true);
                      }}
                      className="bg-yellow-500 text-white py-2 px-3 rounded hover:bg-yellow-600 transition-colors text-sm"
                      disabled={saving}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 transition-colors text-sm"
                      disabled={saving}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">설정 안내</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 각 제품별 기본 단가를 설정할 수 있습니다.</li>
              <li>• 옵션 관리 버튼으로 추가 옵션과 가격을 설정할 수 있습니다.</li>
              <li>• 설정된 단가는 견적 계산 시 자동으로 적용됩니다.</li>
              <li>• 단위는 개, 세트, m², m, EA, 조 중에서 선택할 수 있습니다.</li>
              <li>• 가격은 천 단위 콤마가 자동으로 표시됩니다.</li>
              <li>• 제품 추가, 수정, 삭제가 가능합니다.</li>
              <li>• 변경사항은 저장 버튼을 클릭해야 반영됩니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 제품 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">제품 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품명
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제품명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (원)
                </label>
                <input
                  type="text"
                  value={formatNumber(newProduct.price)}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단위
                </label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProduct({ name: '', price: '', unit: '개' });
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={addProduct}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                disabled={saving}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 제품 수정 모달 */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">제품 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제품명
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제품명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단가 (원)
                </label>
                <input
                  type="text"
                  value={formatNumber(editingProduct.price)}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, price: parseNumber(e.target.value) }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  단위
                </label>
                <select
                  value={editingProduct.unit}
                  onChange={(e) => setEditingProduct(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {unitOptions.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={editProduct}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                disabled={saving}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 옵션 설정 모달 */}
      {showOptionsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{selectedProduct.name} - 옵션 설정</h3>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 전동 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.motor.enabled}
                      onChange={() => handleOptionToggle('motor')}
                      className="mr-2"
                    />
                    <span className="font-medium">전동</span>
                  </label>
                </div>
                {selectedProduct.options.motor.enabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">추가 금액 (원)</label>
                    <input
                      type="text"
                      value={formatNumber(selectedProduct.options.motor.price)}
                      onChange={(e) => handleOptionPriceChange('motor', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* 배터리전동 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.batteryMotor.enabled}
                      onChange={() => handleOptionToggle('batteryMotor')}
                      className="mr-2"
                    />
                    <span className="font-medium">배터리전동</span>
                  </label>
                </div>
                {selectedProduct.options.batteryMotor.enabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">추가 금액 (원)</label>
                    <input
                      type="text"
                      value={formatNumber(selectedProduct.options.batteryMotor.price)}
                      onChange={(e) => handleOptionPriceChange('batteryMotor', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* 시공높이 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.height.enabled}
                      onChange={() => handleOptionToggle('height')}
                      className="mr-2"
                    />
                    <span className="font-medium">시공높이</span>
                  </label>
                </div>
                {selectedProduct.options.height.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProduct.options.height.options.map((option) => (
                      <div key={option.height}>
                        <label className="block text-sm text-gray-700 mb-1">{option.height}</label>
                        <input
                          type="text"
                          value={formatNumber(option.price)}
                          onChange={(e) => handleHeightPriceChange(option.height, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 석고 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.gypsum.enabled}
                      onChange={() => handleOptionToggle('gypsum')}
                      className="mr-2"
                    />
                    <span className="font-medium">석고</span>
                  </label>
                </div>
                {selectedProduct.options.gypsum.enabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">추가 금액 (원)</label>
                    <input
                      type="text"
                      value={formatNumber(selectedProduct.options.gypsum.price)}
                      onChange={(e) => handleOptionPriceChange('gypsum', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* 철판 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.steelPlate.enabled}
                      onChange={() => handleOptionToggle('steelPlate')}
                      className="mr-2"
                    />
                    <span className="font-medium">철판(일정두께이상)</span>
                  </label>
                </div>
                {selectedProduct.options.steelPlate.enabled && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">추가 금액 (원)</label>
                    <input
                      type="text"
                      value={formatNumber(selectedProduct.options.steelPlate.price)}
                      onChange={(e) => handleOptionPriceChange('steelPlate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* 기타 전달메시지 옵션 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProduct.options.customMessage.enabled}
                      onChange={() => handleOptionToggle('customMessage')}
                      className="mr-2"
                    />
                    <span className="font-medium">기타 전달메시지</span>
                  </label>
                </div>
                {selectedProduct.options.customMessage.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">추가 금액 (원)</label>
                      <input
                        type="text"
                        value={formatNumber(selectedProduct.options.customMessage.price)}
                        onChange={(e) => handleOptionPriceChange('customMessage', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">메시지 내용</label>
                      <textarea
                        value={selectedProduct.options.customMessage.message}
                        onChange={(e) => handleCustomMessageChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        rows="3"
                        placeholder="전달할 메시지를 입력하세요"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 