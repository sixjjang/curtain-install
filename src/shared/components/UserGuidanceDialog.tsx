import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Info,
  CheckCircle,
  Warning,
  Schedule,
  Payment,
  Security,
  Business
} from '@mui/icons-material';
import { SystemSettingsService } from '../services/systemSettingsService';
import { AuthService } from '../services/authService';

interface UserGuidanceDialogProps {
  open: boolean;
  userRole: 'contractor' | 'seller';
  userId: string;
  onConfirm: () => void;
  onClose: () => void;
}

const UserGuidanceDialog: React.FC<UserGuidanceDialogProps> = ({
  open,
  userRole,
  userId,
  onConfirm,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [guidance, setGuidance] = useState<{
    title: string;
    content: string;
    version: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      loadGuidance();
    }
  }, [open, userRole]);

  const loadGuidance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const settings = await SystemSettingsService.getSystemSettings();
      const guidanceData = userRole === 'contractor' 
        ? settings.userGuidanceSettings.contractorGuidance
        : settings.userGuidanceSettings.sellerGuidance;
      
      setGuidance(guidanceData);
    } catch (error) {
      console.error('안내사항 로드 실패:', error);
      setError('안내사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmed) return;
    
    try {
      // 사용자의 안내사항 확인 상태 업데이트
      const updateData: any = {
        guidanceConfirmed: {
          confirmedAt: new Date()
        }
      };
      
      if (userRole === 'contractor') {
        updateData.guidanceConfirmed.contractorGuidanceVersion = guidance?.version;
      } else {
        updateData.guidanceConfirmed.sellerGuidanceVersion = guidance?.version;
      }
      
      await AuthService.updateUser(userId, updateData);
      onConfirm();
    } catch (error) {
      console.error('안내사항 확인 처리 실패:', error);
      setError('안내사항 확인 처리에 실패했습니다.');
    }
  };

  const renderDefaultContent = () => {
    if (userRole === 'contractor') {
      return (
        <Box>
          <Typography variant="h6" gutterBottom color="primary">
            🏠 시공자 서비스 이용 안내
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              커튼 설치 시공 서비스에 가입해주셔서 감사합니다. 
              안전하고 원활한 서비스 이용을 위해 다음 사항들을 반드시 확인해주세요.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" />
              서비스 목적
            </Typography>
            <Typography variant="body2" paragraph>
              본 플랫폼은 커튼 설치 시공 서비스의 중개 플랫폼으로, 
              시공자와 고객 간의 안전한 거래를 보장합니다.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payment color="primary" />
              수수료 정책
            </Typography>
            <Typography variant="body2" paragraph>
              • 시공 완료 시 수수료가 차감됩니다 (기본 3%)
              • 에스크로 시스템을 통해 안전한 결제가 이루어집니다
              • 포인트는 현금으로 인출 가능합니다
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              주의사항
            </Typography>
            <Typography variant="body2" paragraph>
              • 작업 수락 후 무단 취소 시 수수료가 발생할 수 있습니다
              • 하루 최대 3회까지 무료 취소가 가능합니다
              • 고객 부재 시 보상이 지급됩니다
              • 제품 미준비 시 보상이 지급됩니다
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              안전 수칙
            </Typography>
            <Typography variant="body2" paragraph>
              • 개인정보 보호를 위해 고객 정보를 외부에 유출하지 마세요
              • 안전한 시공을 위해 안전장비를 착용하세요
              • 고객과의 원활한 소통을 위해 정확한 시간을 지켜주세요
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              서비스 이용 방법
            </Typography>
            <Typography variant="body2" paragraph>
              • 대시보드에서 새로운 작업을 확인할 수 있습니다
              • 작업 수락 후 고객과 연락하여 시공 일정을 조율하세요
              • 시공 완료 후 앱에서 완료 처리를 해주세요
              • 포인트는 시공 완료 후 자동으로 지급됩니다
            </Typography>
          </Box>
        </Box>
      );
    } else {
      return (
        <Box>
          <Typography variant="h6" gutterBottom color="primary">
            🏢 판매자 서비스 이용 안내
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              커튼 설치 시공 서비스에 가입해주셔서 감사합니다. 
              안전하고 원활한 서비스 이용을 위해 다음 사항들을 반드시 확인해주세요.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business color="primary" />
              서비스 목적
            </Typography>
            <Typography variant="body2" paragraph>
              본 플랫폼은 커튼 설치 시공 서비스의 중개 플랫폼으로, 
              판매자와 시공자 간의 안전한 거래를 보장합니다.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payment color="primary" />
              수수료 정책
            </Typography>
            <Typography variant="body2" paragraph>
              • 작업 등록 시 수수료가 차감됩니다 (기본 3%)
              • 에스크로 시스템을 통해 안전한 결제가 이루어집니다
              • 시공 완료 후 시공자에게 포인트가 지급됩니다
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              주의사항
            </Typography>
            <Typography variant="body2" paragraph>
              • 정확한 고객 정보와 시공 일정을 입력해주세요
              • 제품이 준비된 상태에서 작업을 등록해주세요
              • 고객 부재 시 보상이 발생할 수 있습니다
              • 시공자와의 원활한 소통을 위해 연락처를 정확히 입력해주세요
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              안전 수칙
            </Typography>
            <Typography variant="body2" paragraph>
              • 개인정보 보호를 위해 고객 정보를 안전하게 관리하세요
              • 시공자와의 약속 시간을 정확히 지켜주세요
              • 시공 완료 후 만족도 평가를 남겨주세요
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              서비스 이용 방법
            </Typography>
            <Typography variant="body2" paragraph>
              • 작업 관리에서 새로운 시공 작업을 등록할 수 있습니다
              • 시공자가 작업을 수락하면 연락을 받을 수 있습니다
              • 시공 진행 상황을 실시간으로 확인할 수 있습니다
              • 시공 완료 후 만족도 평가를 남겨주세요
            </Typography>
          </Box>
        </Box>
      );
    }
  };

  if (loading) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogTitle>안내사항 로딩 중...</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogTitle>오류 발생</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>닫기</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
        <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // backdrop 클릭이나 ESC 키로 닫히는 것을 방지
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Info color="primary" />
          {guidance?.title || `${userRole === 'contractor' ? '시공자' : '판매자'} 서비스 이용 안내`}
          {guidance?.version && (
            <Chip 
              label={`v${guidance.version}`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            ⚠️ 필수 확인사항
          </Typography>
          <Typography variant="body2">
            아래 안내사항을 모두 읽고 이해한 후에 서비스를 이용할 수 있습니다.
          </Typography>
        </Alert>

        <Divider sx={{ mb: 2 }} />

        {guidance?.content ? (
          <Box 
            dangerouslySetInnerHTML={{ __html: guidance.content }}
            sx={{
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: 'primary.main',
                marginTop: 2,
                marginBottom: 1
              },
              '& p': {
                marginBottom: 1
              },
              '& ul, & ol': {
                paddingLeft: 2
              }
            }}
          />
        ) : (
          renderDefaultContent()
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            위 안내사항을 모두 읽고 이해했습니다.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => setConfirmed(!confirmed)}
          startIcon={confirmed ? <CheckCircle /> : undefined}
          variant={confirmed ? 'contained' : 'outlined'}
          color={confirmed ? 'success' : 'primary'}
        >
          {confirmed ? '안내사항을 확인했습니다' : '안내사항을 확인하겠습니다'}
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!confirmed}
          startIcon={<CheckCircle />}
        >
          서비스 이용 시작
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserGuidanceDialog;
