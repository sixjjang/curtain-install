import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Chip,
  Paper
} from '@mui/material';
import {
  Settings,
  Save,
  Refresh,
  AccessTime,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { SystemSettings as SystemSettingsType } from '../../../types';

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 폼 데이터
  const [escrowHours, setEscrowHours] = useState(48);
  const [maxCancellationHours, setMaxCancellationHours] = useState(24);
  const [maxDailyCancellations, setMaxDailyCancellations] = useState(3);
  const [cancellationFeeRate, setCancellationFeeRate] = useState(5);
  const [productNotReadyRate, setProductNotReadyRate] = useState(30);
  const [customerAbsentRate, setCustomerAbsentRate] = useState(100);
  const [scheduleChangeFeeRate, setScheduleChangeFeeRate] = useState(0);

  // 시스템 설정 로드
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const systemSettings = await SystemSettingsService.getSystemSettings();
      setSettings(systemSettings);
      setEscrowHours(systemSettings.escrowAutoReleaseHours);
      setMaxCancellationHours(systemSettings.jobCancellationPolicy.maxCancellationHours);
      setMaxDailyCancellations(systemSettings.jobCancellationPolicy.maxDailyCancellations);
      setCancellationFeeRate(systemSettings.jobCancellationPolicy.cancellationFeeRate);
      setProductNotReadyRate(systemSettings.compensationPolicy.productNotReadyRate);
      setCustomerAbsentRate(systemSettings.compensationPolicy.customerAbsentRate);
      setScheduleChangeFeeRate(systemSettings.compensationPolicy.scheduleChangeFeeRate);
    } catch (error) {
      console.error('시스템 설정 로드 실패:', error);
      setError('시스템 설정을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 설정 저장
  const handleSave = async () => {
    if (!user?.id) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // 에스크로 설정 저장
      await SystemSettingsService.updateEscrowAutoReleaseHours(escrowHours, user.id);
      
      // 취소 정책 설정 저장
      await SystemSettingsService.updateCancellationPolicy(
        maxCancellationHours, 
        maxDailyCancellations,
        cancellationFeeRate,
        user.id
      );
      
      // 보상 정책 설정 저장
      await SystemSettingsService.updateCompensationPolicy(
        productNotReadyRate,
        customerAbsentRate,
        scheduleChangeFeeRate,
        user.id
      );
      
      setSuccess('시스템 설정이 성공적으로 저장되었습니다.');
      
      // 설정 다시 로드
      await loadSettings();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setError('설정 저장에 실패했습니다: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 시간 단위 변환 함수들
  const hoursToDays = (hours: number) => {
    return (hours / 24).toFixed(1);
  };

  const hoursToWeeks = (hours: number) => {
    return (hours / 168).toFixed(1);
  };

  const formatTimeDisplay = (hours: number) => {
    if (hours < 24) {
      return `${hours}시간`;
    } else if (hours < 168) {
      return `${hoursToDays(hours)}일`;
    } else {
      return `${hoursToWeeks(hours)}주`;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          시스템 설정
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadSettings}
          disabled={saving}
        >
          새로고침
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 에스크로 자동 지급 설정 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime />
                에스크로 자동 지급 설정
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                시공 완료 후 자동으로 시공자에게 포인트를 지급하는 시간을 설정합니다.
                이 시간 동안 분쟁이 없으면 자동으로 시공자에게 지급됩니다.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="자동 지급 시간 (시간)"
                  type="number"
                  value={escrowHours}
                  onChange={(e) => setEscrowHours(Number(e.target.value))}
                  inputProps={{
                    min: 1,
                    max: 168,
                    step: 1
                  }}
                  helperText="1시간 ~ 168시간(7일) 사이로 설정하세요"
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`현재 설정: ${formatTimeDisplay(escrowHours)}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`1시간 = ${(1/24).toFixed(2)}일`}
                    color="info"
                    size="small"
                  />
                  <Chip 
                    label={`24시간 = 1일`}
                    color="info"
                    size="small"
                  />
                  <Chip 
                    label={`168시간 = 1주일`}
                    color="info"
                    size="small"
                  />
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving || escrowHours < 1 || escrowHours > 168}
                fullWidth
              >
                {saving ? '저장 중...' : '설정 저장'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 현재 설정 정보 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                현재 설정 정보
              </Typography>

              {settings && (
                <Box>
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      에스크로 자동 지급 시간
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatTimeDisplay(settings.escrowAutoReleaseHours)}
                    </Typography>
                  </Paper>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    마지막 업데이트
                  </Typography>
                  <Typography variant="body2">
                    {settings.updatedAt.toLocaleString('ko-KR')}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mt: 2 }}>
                    업데이트한 관리자
                  </Typography>
                  <Typography variant="body2">
                    {settings.updatedBy === 'system' ? '시스템' : settings.updatedBy}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 취소 정책 설정 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                시공건 취소 정책 설정
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                시공자가 작업을 수락한 후 취소할 수 있는 시간과 일일 최대 취소 횟수를 설정합니다.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="취소 가능 시간 (시간)"
                    type="number"
                    value={maxCancellationHours}
                    onChange={(e) => setMaxCancellationHours(Number(e.target.value))}
                    inputProps={{
                      min: 1,
                      max: 168,
                      step: 1
                    }}
                    helperText="수락 후 몇 시간까지 취소 가능한지 설정"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="일일 최대 취소 횟수"
                    type="number"
                    value={maxDailyCancellations}
                    onChange={(e) => setMaxDailyCancellations(Number(e.target.value))}
                    inputProps={{
                      min: 1,
                      max: 10,
                      step: 1
                    }}
                    helperText="하루에 최대 몇 번까지 취소 가능한지 설정"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="취소 수수료율 (%)"
                    type="number"
                    value={cancellationFeeRate}
                    onChange={(e) => setCancellationFeeRate(Number(e.target.value))}
                    inputProps={{
                      min: 0,
                      max: 50,
                      step: 0.1
                    }}
                    helperText="제한 초과 시 전체 시공비용의 몇%를 수수료로 적용"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`취소 가능 시간: ${maxCancellationHours}시간`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  label={`일일 최대 취소: ${maxDailyCancellations}회`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip 
                  label={`취소 수수료율: ${cancellationFeeRate}% (전체 시공비용 기준)`}
                  color="warning"
                  variant="outlined"
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving || maxCancellationHours < 1 || maxCancellationHours > 168 || maxDailyCancellations < 1 || maxDailyCancellations > 10}
                fullWidth
                sx={{ mt: 3 }}
              >
                {saving ? '저장 중...' : '취소 정책 저장'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 보상 정책 설정 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                보상 정책 설정
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                다양한 상황에서 시공자에게 지급되는 보상율을 설정합니다.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="제품 준비 미완료 보상율 (%)"
                    type="number"
                    value={productNotReadyRate}
                    onChange={(e) => setProductNotReadyRate(Number(e.target.value))}
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 1
                    }}
                    helperText="기본 출장비의 몇%를 보상으로 지급"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="소비자 부재 보상율 (%)"
                    type="number"
                    value={customerAbsentRate}
                    onChange={(e) => setCustomerAbsentRate(Number(e.target.value))}
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 1
                    }}
                    helperText="기본 출장비의 몇%를 보상으로 지급"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="일정 변경 수수료율 (%)"
                    type="number"
                    value={scheduleChangeFeeRate}
                    onChange={(e) => setScheduleChangeFeeRate(Number(e.target.value))}
                    inputProps={{
                      min: 0,
                      max: 50,
                      step: 0.1
                    }}
                    helperText="전체 시공비용의 몇%를 수수료로 적용"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`제품 미준비 보상: ${productNotReadyRate}%`}
                  color="error"
                  variant="outlined"
                />
                <Chip 
                  label={`소비자 부재 보상: ${customerAbsentRate}%`}
                  color="error"
                  variant="outlined"
                />
                <Chip 
                  label={`일정 변경 수수료: ${scheduleChangeFeeRate}%`}
                  color="warning"
                  variant="outlined"
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving || productNotReadyRate < 0 || productNotReadyRate > 100 || customerAbsentRate < 0 || customerAbsentRate > 100 || scheduleChangeFeeRate < 0 || scheduleChangeFeeRate > 50}
                fullWidth
                sx={{ mt: 3 }}
              >
                {saving ? '저장 중...' : '보상 정책 저장'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 설정 가이드 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 설정 가이드
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    ⏰ 에스크로 권장 설정
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    • <strong>24시간</strong>: 빠른 정산이 필요한 경우<br />
                    • <strong>48시간</strong>: 일반적인 시공 작업 (기본값)<br />
                    • <strong>72시간</strong>: 복잡한 시공 작업<br />
                    • <strong>168시간</strong>: 대형 프로젝트
                  </Typography>
                </Grid>
                
                                 <Grid item xs={12} md={4}>
                   <Typography variant="subtitle2" gutterBottom>
                     🚫 취소 정책 권장 설정
                   </Typography>
                   <Typography variant="body2" color="textSecondary" paragraph>
                     • <strong>12시간</strong>: 긴급 작업 (취소 제한)<br />
                     • <strong>24시간</strong>: 일반적인 작업 (기본값)<br />
                     • <strong>48시간</strong>: 복잡한 작업<br />
                     • <strong>일일 3회</strong>: 적절한 제한 (기본값)<br />
                     • <strong>수수료 5%</strong>: 제한 초과 시 적용
                   </Typography>
                 </Grid>
                 
                 <Grid item xs={12} md={4}>
                   <Typography variant="subtitle2" gutterBottom>
                     💰 보상 정책 권장 설정
                   </Typography>
                   <Typography variant="body2" color="textSecondary" paragraph>
                     • <strong>제품 미준비 30%</strong>: 기본 출장비의 30%<br />
                     • <strong>소비자 부재 100%</strong>: 기본 출장비의 100%<br />
                     • <strong>일정 변경 0%</strong>: 일반적으로 수수료 없음<br />
                     • <strong>취소 수수료 5%</strong>: 제한 초과 시 적용
                   </Typography>
                 </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    ⚠️ 주의사항
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    • 설정 변경은 새로운 시공의뢰부터 적용됩니다<br />
                    • 기존 진행 중인 작업은 이전 설정을 유지합니다<br />
                    • 너무 짧은 시간은 분쟁 해결 시간이 부족할 수 있습니다<br />
                    • 너무 긴 시간은 시공자의 자금 회전에 영향을 줄 수 있습니다
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettings;
