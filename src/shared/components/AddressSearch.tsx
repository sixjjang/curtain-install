import React, { useEffect, useRef } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { Search as SearchIcon, LocationOn } from '@mui/icons-material';

interface AddressSearchProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
}

declare global {
  interface Window {
    daum: any;
  }
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  value, 
  onChange, 
  placeholder = "주소를 입력하세요",
  label = "주소"
}) => {
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 다음 우편번호 서비스 스크립트 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleAddressSearch = () => {
    if (!window.daum) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 주소 정보를 해당 필드에 넣는다.
        let addr = '';
        
        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }

        // 상세주소 필드가 있다면 해당 필드에 값을 넣는다.
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
          addr += ' ' + data.bname;
        }
        if (data.buildingName !== '') {
          addr += ' ' + data.buildingName;
        }

        onChange(addr);
        
        // 주소 입력 필드에 포커스를 이동한다.
        if (addressInputRef.current) {
          addressInputRef.current.focus();
        }
      }
    }).open();
  };

  return (
    <Box>
      <TextField
        ref={addressInputRef}
        fullWidth
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <Button
              onClick={handleAddressSearch}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              검색
            </Button>
          ),
        }}
      />
      {value && (
        <Box display="flex" alignItems="center" mt={1}>
          <LocationOn color="primary" sx={{ mr: 1, fontSize: 16 }} />
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {value}
          </span>
        </Box>
      )}
    </Box>
  );
};

export default AddressSearch;
