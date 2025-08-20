import React from 'react';
import { TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface AddressSearchProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ 
  value, 
  onChange, 
  placeholder = "주소를 입력하세요" 
}) => {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
        ),
      }}
    />
  );
};

export default AddressSearch;
