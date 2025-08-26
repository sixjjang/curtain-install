import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import {
  PhotoCamera,
  Save,
  Cancel,
  Refresh,
  Palette,
  Smartphone
} from '@mui/icons-material';
import { PWASettingsService, PWASettings } from '../../../shared/services/pwaSettingsService';

interface PWASettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const PWASettingsDialog: React.FC<PWASettingsDialogProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<PWASettings>({
    appIcon: '/logo192.png',
    appName: '커튼 설치 플랫폼',
    appDescription: '커튼 설치 전문 플랫폼',
    themeColor: '#1976d2',
    backgroundColor: '#ffffff'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 설정 로드
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pwaSettings = await PWASettingsService.getPWASettings();
      setSettings(pwaSettings);
      setPreviewUrl(pwaSettings.appIcon);
    } catch (error) {
      console.error('PWA 설정 로드 실패:', error);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      // 파일 타입 검증 (PNG, JPG, JPEG만 허용)
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setError('PNG, JPG, JPEG 파일만 업로드 가능합니다.');
        return;
      }

      setSelectedFile(file);
      setError(null);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let iconUrl = settings.appIcon;

      // 새 아이콘 파일이 선택된 경우 업로드
      if (selectedFile) {
        const uploadedUrl = await PWASettingsService.uploadAppIcon(selectedFile);
        if (uploadedUrl) {
          iconUrl = uploadedUrl;
        } else {
          setError('아이콘 업로드에 실패했습니다.');
          return;
        }
      }

      // 설정 업데이트
      const updatedSettings = {
        ...settings,
        appIcon: iconUrl
      };

      const success = await PWASettingsService.updatePWASettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        setSuccess('PWA 설정이 성공적으로 저장되었습니다.');
        setSelectedFile(null);
        
        // 3초 후 성공 메시지 제거
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('PWA 설정 저장 실패:', error);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 설정 초기화
  const handleReset = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await PWASettingsService.initializePWASettings();
      if (success) {
        await loadSettings();
        setSuccess('설정이 기본값으로 초기화되었습니다.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('설정 초기화에 실패했습니다.');
      }
    } catch (error) {
      console.error('PWA 설정 초기화 실패:', error);
      setError('설정 초기화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Smartphone />
        PWA 앱 설정
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 앱 아이콘 설정 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhotoCamera />
              앱 아이콘
            </Typography>
            
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar
                src={previewUrl || settings.appIcon}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mx: 'auto', 
                  mb: 2,
                  border: '2px solid #ddd'
                }}
              />
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="icon-file-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="icon-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mb: 1 }}
                >
                  아이콘 변경
                </Button>
              </label>
              
              <Typography variant="caption" display="block" color="textSecondary">
                권장 크기: 512x512px, 최대 5MB
              </Typography>
            </Box>
          </Grid>

          {/* 앱 정보 설정 */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              앱 정보
            </Typography>
            
            <TextField
              fullWidth
              label="앱 이름"
              value={settings.appName}
              onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
              sx={{ mb: 2 }}
              helperText="홈 화면에 표시될 앱 이름"
            />
            
            <TextField
              fullWidth
              label="앱 설명"
              value={settings.appDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, appDescription: e.target.value }))}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              helperText="앱 스토어에 표시될 설명"
            />
          </Grid>

          {/* 테마 색상 설정 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette />
              테마 색상
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="테마 색상"
                  value={settings.themeColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, themeColor: e.target.value }))}
                  type="color"
                  sx={{ mb: 1 }}
                  helperText="앱의 주요 색상"
                />
                <Chip 
                  label={settings.themeColor} 
                  sx={{ 
                    backgroundColor: settings.themeColor, 
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="배경 색상"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  type="color"
                  sx={{ mb: 1 }}
                  helperText="앱 로딩 시 배경 색상"
                />
                <Chip 
                  label={settings.backgroundColor} 
                  sx={{ 
                    backgroundColor: settings.backgroundColor, 
                    color: '#000',
                    fontWeight: 'bold',
                    border: '1px solid #ddd'
                  }} 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* 미리보기 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              미리보기
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              border: '1px solid #ddd', 
              borderRadius: 1,
              backgroundColor: settings.backgroundColor
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={previewUrl || settings.appIcon} sx={{ width: 48, height: 48 }} />
                <Box>
                  <Typography variant="h6" sx={{ color: settings.themeColor }}>
                    {settings.appName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {settings.appDescription}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleReset}
          startIcon={<Refresh />}
          disabled={saving}
        >
          초기화
        </Button>
        <Button onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWASettingsDialog;
