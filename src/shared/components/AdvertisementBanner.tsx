import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { AdvertisementService } from '../services/advertisementService';
import { Advertisement } from '../../types';

interface AdvertisementBannerProps {
  position: 'sidebar' | 'dashboard' | 'chat';
  maxCount?: number;
  height?: string | number;
  showTitle?: boolean;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({
  position,
  maxCount = 1,
  height = 'auto',
  showTitle = false
}) => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const loadAdvertisements = async () => {
      try {
        setLoading(true);
        setError(false);
        const ads = await AdvertisementService.getActiveAdvertisementsByPosition(position);
        setAdvertisements(ads.slice(0, maxCount));
      } catch (error) {
        console.error('광고 로드 실패:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadAdvertisements();
  }, [position, maxCount]);

  const handleAdClick = async (ad: Advertisement) => {
    try {
      // 클릭 추적
      await AdvertisementService.trackAdvertisementClick(ad.id);
    } catch (error) {
      console.error('광고 클릭 추적 실패:', error);
    }
    
    // 새 탭에서 링크 열기
    window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
  };

  // 로딩 중일 때 스켈레톤 표시
  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        {Array.from({ length: maxCount }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={height}
            sx={{ 
              mb: index < maxCount - 1 ? 2 : 0,
              borderRadius: 1
            }}
          />
        ))}
      </Box>
    );
  }

  // 에러가 있거나 광고가 없을 때
  if (error || advertisements.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {advertisements.map((ad, index) => (
        <Card
          key={ad.id}
          sx={{
            mb: index < advertisements.length - 1 ? 2 : 0,
            cursor: 'pointer',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8]
            },
            height: height,
            overflow: 'hidden'
          }}
          onClick={() => handleAdClick(ad)}
        >
          <Box sx={{ position: 'relative', height: '100%' }}>
            <img
              src={ad.imageUrl}
              alt={ad.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            {showTitle && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  color: 'white',
                  p: 1
                }}
              >
                <Typography
                  variant={isMobile ? 'caption' : 'body2'}
                  component="span"
                  sx={{
                    fontWeight: 'medium',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {ad.title}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default AdvertisementBanner;
