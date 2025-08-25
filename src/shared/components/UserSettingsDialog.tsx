import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Fingerprint,
  Security,
  AutoAwesome,
  Settings,
  Info,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BiometricService } from '../services/biometricService';
import { getLastLoginTime } from '../utils/storageUtils';

interface UserSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({ open, onClose }) => {
  const { 
    isBiometricEnabled, 
    isBiometricAvailable, 
    enableBiometric, 
    disableBiometric,
    getAutoLoginInfo,
    removeAutoLoginInfo
  } = useAuth();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 설정 상태 로드
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // 생체인증 상태 확인
      const available = await isBiometricAvailable();
      const enabled = isBiometricEnabled();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);

      // 자동 로그인 상태 확인
      const autoLoginInfo = getAutoLoginInfo();
      setAutoLoginEnabled(!!autoLoginInfo);

      // 마지막 로그인 시간 확인
      const lastLogin = getLastLoginTime();
      setLastLoginTime(lastLogin);

    } catch (error) {
      console.error('설정 로드 실패:', error);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 생체인증 토글
  const handleBiometricToggle = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (biometricEnabled) {
        // 생체인증 비활성화
        const success = await disableBiometric();
        if (success) {
          setBiometricEnabled(false);
          setSuccess('생체인증이 비활성화되었습니다.');
        } else {
          setError('생체인증 비활성화에 실패했습니다.');
        }
      } else {
        // 생체인증 활성화 (임시로 이메일/비밀번호 필요)
        setError('생체인증 활성화를 위해서는 로그인 페이지에서 이메일과 비밀번호를 입력한 후 활성화해주세요.');
      }
    } catch (error) {
      console.error('생체인증 토글 실패:', error);
      setError('생체인증 설정 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 자동 로그인 토글
  const handleAutoLoginToggle = () => {
    try {
      if (autoLoginEnabled) {
        // 자동 로그인 비활성화
        removeAutoLoginInfo();
        setAutoLoginEnabled(false);
        setSuccess('자동 로그인이 비활성화되었습니다.');
      } else {
        // 자동 로그인 활성화 (임시로 로그인 페이지에서 설정 필요)
        setError('자동 로그인 활성화를 위해서는 로그인 페이지에서 "로그인 정보 저장"을 체크해주세요.');
      }
    } catch (error) {
      console.error('자동 로그인 토글 실패:', error);
      setError('자동 로그인 설정 변경에 실패했습니다.');
    }
  };

  // 모든 설정 초기화
  const handleResetAllSettings = () => {
    try {
      removeAutoLoginInfo();
      disableBiometric();
      setAutoLoginEnabled(false);
      setBiometricEnabled(false);
      setSuccess('모든 설정이 초기화되었습니다.');
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      setError('설정 초기화에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Settings color="primary" />
          <Typography variant="h6">사용자 설정</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <List>
          {/* 생체인증 설정 */}
          <ListItem>
            <ListItemIcon>
              <Fingerprint color={biometricEnabled ? "primary" : "action"} />
            </ListItemIcon>
            <ListItemText
              primary="생체인증"
              secondary={
                biometricAvailable 
                  ? (biometricEnabled ? "활성화됨" : "비활성화됨")
                  : "지원하지 않는 기기"
              }
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={biometricEnabled}
                onChange={handleBiometricToggle}
                disabled={!biometricAvailable || loading}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          {/* 자동 로그인 설정 */}
          <ListItem>
            <ListItemIcon>
              <AutoAwesome color={autoLoginEnabled ? "primary" : "action"} />
            </ListItemIcon>
            <ListItemText
              primary="자동 로그인"
              secondary={
                autoLoginEnabled 
                  ? "로그인 정보가 저장됨" 
                  : "로그인 정보가 저장되지 않음"
              }
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={autoLoginEnabled}
                onChange={handleAutoLoginToggle}
                disabled={loading}
              />
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          {/* 마지막 로그인 시간 */}
          <ListItem>
            <ListItemIcon>
              <Info color="action" />
            </ListItemIcon>
            <ListItemText
              primary="마지막 로그인"
              secondary={
                lastLoginTime 
                  ? lastLoginTime.toLocaleString('ko-KR')
                  : "정보 없음"
              }
            />
          </ListItem>

          <Divider />

          {/* 보안 정보 */}
          <ListItem>
            <ListItemIcon>
              <Security color="action" />
            </ListItemIcon>
            <ListItemText
              primary="보안 상태"
              secondary={
                <Box>
                  <Chip 
                    label={biometricAvailable ? "생체인증 지원" : "생체인증 미지원"} 
                    color={biometricAvailable ? "success" : "default"}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={window.isSecureContext ? "보안 연결" : "일반 연결"} 
                    color={window.isSecureContext ? "success" : "warning"}
                    size="small"
                  />
                </Box>
              }
            />
          </ListItem>
        </List>

        {/* 주의사항 */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body2" color="warning.contrastText">
            <Warning sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            <strong>주의사항:</strong>
          </Typography>
          <Typography variant="body2" color="warning.contrastText" sx={{ mt: 1 }}>
            • 생체인증과 자동 로그인은 보안을 위해 HTTPS 환경에서만 작동합니다.
          </Typography>
          <Typography variant="body2" color="warning.contrastText">
            • 로그인 정보는 기기 내부에 암호화되어 저장됩니다.
          </Typography>
          <Typography variant="body2" color="warning.contrastText">
            • 설정 변경 시 즉시 적용됩니다.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleResetAllSettings} color="error">
          모든 설정 초기화
        </Button>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSettingsDialog;
