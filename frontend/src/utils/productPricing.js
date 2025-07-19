import { db } from '../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * 제품별 단가 정보를 가져오는 함수
 * @returns {Promise<Object>} 제품별 단가 정보
 */
export const getProductPricing = async () => {
  try {
    const pricingDoc = await getDocs(collection(db, 'productPricing'));
    const pricingData = {};
    
    if (!pricingDoc.empty) {
      pricingDoc.forEach(doc => {
        pricingData[doc.id] = doc.data();
      });
    } else {
      // 기본 단가 설정
      const defaultPricing = {
        curtain: { name: '커튼', price: 50000, unit: '개' },
        blind: { name: '블라인드', price: 30000, unit: '개' },
        rollscreen: { name: '롤스크린', price: 40000, unit: '개' },
        verticalblind: { name: '버티컬블라인드', price: 35000, unit: '개' },
        romanshade: { name: '로만쉐이드', price: 60000, unit: '개' },
        other: { name: '기타', price: 25000, unit: '개' }
      };
      return defaultPricing;
    }
    
    return pricingData;
  } catch (error) {
    console.error('제품 단가 정보 로드 실패:', error);
    // 오류 시 기본 단가 반환
    return {
      curtain: { name: '커튼', price: 50000, unit: '개' },
      blind: { name: '블라인드', price: 30000, unit: '개' },
      rollscreen: { name: '롤스크린', price: 40000, unit: '개' },
      verticalblind: { name: '버티컬블라인드', price: 35000, unit: '개' },
      romanshade: { name: '로만쉐이드', price: 60000, unit: '개' },
      other: { name: '기타', price: 25000, unit: '개' }
    };
  }
};

/**
 * 제품명으로 단가를 찾는 함수
 * @param {string} productName - 제품명
 * @param {Object} pricingData - 단가 데이터
 * @returns {Object|null} 제품 단가 정보
 */
export const findProductPrice = (productName, pricingData) => {
  const productMap = {
    '커튼': 'curtain',
    '블라인드': 'blind',
    '롤스크린': 'rollscreen',
    '버티컬블라인드': 'verticalblind',
    '로만쉐이드': 'romanshade',
    '기타': 'other'
  };
  
  const productId = productMap[productName];
  return productId ? pricingData[productId] : null;
};

/**
 * 제품 목록과 단가를 계산하는 함수
 * @param {Array} products - 제품 목록
 * @param {Object} pricingData - 단가 데이터
 * @returns {Object} 계산 결과
 */
export const calculateProductsTotal = (products, pricingData) => {
  let total = 0;
  const calculatedProducts = [];
  
  products.forEach(product => {
    const priceInfo = findProductPrice(product.name, pricingData);
    const unitPrice = priceInfo ? priceInfo.price : 0;
    const productTotal = unitPrice * product.quantity;
    
    calculatedProducts.push({
      ...product,
      unitPrice,
      total: productTotal
    });
    
    total += productTotal;
  });
  
  return {
    products: calculatedProducts,
    total
  };
}; 