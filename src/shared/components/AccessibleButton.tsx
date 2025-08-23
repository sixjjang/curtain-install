import React from 'react';
import { Button, ButtonProps } from '@mui/material';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  children: React.ReactNode;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({ 
  children, 
  onClick, 
  ariaLabel, 
  disabled = false,
  variant = 'contained',
  size = 'medium',
  ...props 
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      sx={{
        minHeight: 44, // 터치 타겟 최소 크기
        minWidth: 44,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 600,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AccessibleButton;
