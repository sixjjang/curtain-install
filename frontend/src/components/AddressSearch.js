import React, { useState, useEffect } from 'react';

const AddressSearch = ({ onAddressSelect, placeholder = "주소를 검색하세요", className = "" }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    // 카카오 주소 검색 API 스크립트 로드
    const loadKakaoAddressScript = () => {
      if (typeof window !== 'undefined' && !window.daum) {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        script.onload = () => {
          console.log('카카오 주소 검색 API 로드 완료');
        };
        document.head.appendChild(script);
      }
    };

    loadKakaoAddressScript();
  }, []);

  const openAddressSearch = () => {
    if (typeof window !== 'undefined' && window.daum) {
      new window.daum.Postcode({
        oncomplete: (data) => {
          // 주소 정보를 변수에 담기
          let addr = ''; // 주소 변수
          let extraAddr = ''; // 참고항목 변수

          // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
          if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
            addr = data.roadAddress;
          } else { // 사용자가 지번 주소를 선택했을 경우(J)
            addr = data.jibunAddress;
          }

          // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
          if (data.userSelectedType === 'R') {
            // 법정동명이 있을 경우 추가한다. (법정리는 제외)
            // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
              extraAddr += data.bname;
            }
            // 건물명이 있고, 공동주택일 경우 추가한다.
            if (data.buildingName !== '' && data.apartment === 'Y') {
              extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
            if (extraAddr !== '') {
              extraAddr = ' (' + extraAddr + ')';
            }
            // 조합된 참고항목을 해당 필드에 넣는다.
            addr += extraAddr;
          }

          // 상세주소 입력 필드가 있다면 포커스를 이동한다.
          const fullAddress = addr;
          
          // 주소 선택 콜백 호출
          if (onAddressSelect) {
            onAddressSelect({
              address: fullAddress,
              zipCode: data.zonecode,
              roadAddress: data.roadAddress,
              jibunAddress: data.jibunAddress,
              bname: data.bname,
              buildingName: data.buildingName
            });
          }

          setIsSearchOpen(false);
        },
        onclose: () => {
          setIsSearchOpen(false);
        }
      }).open();
    } else {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <input
          type="text"
          placeholder={placeholder}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          readOnly
        />
        <button
          type="button"
          onClick={openAddressSearch}
          className="px-4 py-2 bg-blue-600 text-white border border-blue-600 rounded-r-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
        >
          주소 검색
        </button>
      </div>
      
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center text-sm text-gray-600 mt-2">주소 검색창을 여는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressSearch; 