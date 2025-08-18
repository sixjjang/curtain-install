import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { KAKAO_CONFIG, isKakaoApiKeySet } from '../../config/kakao';

interface AddressSearchProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

interface AddressResult {
  address_name: string;
  road_address_name?: string;
  place_name?: string;
  x: string;
  y: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  value, 
  onChange, 
  placeholder = "도로명, 지번, 건물명으로 검색하세요" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 카카오 API 초기화
  useEffect(() => {
    if (!isKakaoApiKeySet()) {
      console.warn('카카오 API 키가 설정되지 않았습니다. 주소 검색 기능을 사용할 수 없습니다.');
      return;
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_CONFIG.API_KEY}&libraries=services`;
    script.async = true;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('카카오 지도 API 로드 완료');
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // 주소 검색 함수
  const searchAddress = async (query: string) => {
    if (!query.trim() || !window.kakao) return;

    try {
      setLoading(true);
      
      // 카카오 주소 검색 API 호출
      const places = new window.kakao.maps.services.Places();
      
      places.keywordSearch(query, (data: AddressResult[], status: string) => {
        setLoading(false);
        
        if (status === window.kakao.maps.services.Status.OK) {
          setResults(data.slice(0, 10));
          setShowResults(true);
        } else {
          setResults([]);
          setShowResults(false);
        }
      });
    } catch (error) {
      console.error('주소 검색 오류:', error);
      setLoading(false);
      setResults([]);
    }
  };

  // 검색어 변경 시 디바운스 적용
  const handleSearchChange = (newValue: string) => {
    setSearchTerm(newValue);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newValue.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(newValue);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // 주소 선택
  const handleAddressSelect = (address: AddressResult) => {
    const displayAddress = address.road_address_name || address.address_name;
    const fullAddress = address.place_name 
      ? `${displayAddress} (${address.place_name})`
      : displayAddress;

    setSelectedAddress(fullAddress);
    setSearchTerm(fullAddress);
    setShowResults(false);
    
    onChange(fullAddress, {
      lat: parseFloat(address.y),
      lng: parseFloat(address.x)
    });
  };

  return (
    <Box position="relative" width="100%">
      {!isKakaoApiKeySet() ? (
        <TextField
          fullWidth
          label="주소 *"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="주소를 직접 입력하세요 (카카오 API 키가 설정되지 않음)"
          required
          helperText="카카오 API 키를 설정하면 주소 검색 기능을 사용할 수 있습니다."
        />
      ) : (
        <TextField
          fullWidth
          label="주소 *"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placeholder}
          required
          InputProps={{
            endAdornment: loading ? <CircularProgress size={20} /> : <SearchIcon />
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {showResults && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 300,
            overflow: 'auto',
            mt: 1
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {results.length > 0 ? (
            <List>
              {results.map((result, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleAddressSelect(result)}
                  sx={{ borderBottom: '1px solid #eee' }}
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {result.road_address_name || result.address_name}
                        </Typography>
                        {result.place_name && (
                          <Chip 
                            label={result.place_name} 
                            size="small" 
                            color="primary" 
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="textSecondary">
                검색 결과가 없습니다.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {selectedAddress && (
        <Box mt={1}>
          <Typography variant="caption" color="primary" fontWeight="bold">
            선택된 주소: {selectedAddress}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AddressSearch;
