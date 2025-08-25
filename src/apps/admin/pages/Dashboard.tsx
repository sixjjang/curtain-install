import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People,
  Work,
  TrendingUp,
  Star,
  AccessTime,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning,
  Search,
  Edit,
  Delete,
  Visibility,
  Save,
  Cancel,
  Refresh
} from '@mui/icons-material';
import { SystemSettingsService } from '../../../shared/services/systemSettingsService';
import { AnalyticsService } from '../../../shared/services/analyticsService';
import { AuthService } from '../../../shared/services/authService';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  averageRating: number;
  activeContractors: number;
  totalRevenue: number;
  pendingApprovals: number;
  completedJobs: number;
  inProgressJobs: number;
}

const Dashboard: React.FC = () => {
  const [escrowHours, setEscrowHours] = useState(48);
  const [feeSettings, setFeeSettings] = useState({ sellerCommissionRate: 3, contractorCommissionRate: 2 });
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalJobs: 0,
    averageRating: 0,
    activeContractors: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    completedJobs: 0,
    inProgressJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 작업 검색 및 관리 상태
  const [jobSearchId, setJobSearchId] = useState('');
  const [searchedJob, setSearchedJob] = useState<ConstructionJob | null>(null);
  const [jobSearchLoading, setJobSearchLoading] = useState(false);
  const [jobSearchError, setJobSearchError] = useState('');
  
  // 작업 상세 다이얼로그 상태
  const [jobDetailDialogOpen, setJobDetailDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ConstructionJob | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  
  // 사용자 정보 상태
  const [sellerInfo, setSellerInfo] = useState<{ email: string; name: string; phone: string } | null>(null);
  const [contractorInfo, setContractorInfo] = useState<{ email: string; name: string; phone: string } | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 시스템 설정 로드
      const hours = await SystemSettingsService.getEscrowAutoReleaseHours();
      setEscrowHours(hours);
      
      // 수수료 설정 로드
      const systemSettings = await SystemSettingsService.getSystemSettings();
      setFeeSettings({
        sellerCommissionRate: systemSettings.feeSettings.sellerCommissionRate,
        contractorCommissionRate: systemSettings.feeSettings.contractorCommissionRate
      });

      // 분석 데이터 로드
      const analyticsData = await AnalyticsService.getAnalyticsData('all');
      console.log('📊 AnalyticsData:', analyticsData);
      
      // 안전한 데이터 접근
      const userStats = analyticsData?.userStats || {};
      const jobStats = analyticsData?.jobStats || {};
      const revenueAnalysis = analyticsData?.revenueAnalysis || {};
      const ratingAnalysis = analyticsData?.ratingAnalysis || {};
      
      console.log('👥 UserStats:', userStats);
      console.log('📋 JobStats:', jobStats);
      console.log('💰 RevenueAnalysis:', revenueAnalysis);
      console.log('⭐ RatingAnalysis:', ratingAnalysis);
      
      // 사용자 통계 계산
      const totalUsers = userStats.totalUsers || 0;
      const pendingApprovals = userStats.pendingApprovals || 0;
      const activeContractors = userStats.activeContractors || 0;

      // 작업 통계 계산
      const totalJobs = jobStats.totalJobs || 0;
      const completedJobs = jobStats.completedJobs || 0;
      const inProgressJobs = jobStats.inProgressJobs || 0;

      // 수익 통계
      const totalRevenue = revenueAnalysis.totalRevenue || 0;

      // 평균 평점 계산
      const averageRating = ratingAnalysis.averageRating || 0;

      setStats({
        totalUsers,
        totalJobs,
        averageRating,
        activeContractors,
        totalRevenue,
        pendingApprovals,
        completedJobs,
        inProgressJobs
      });

    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatTimeDisplay = (hours: number) => {
    if (hours < 24) {
      return `${hours}시간`;
    } else if (hours < 168) {
      return `${(hours / 24).toFixed(1)}일`;
    } else {
      return `${(hours / 168).toFixed(1)}주`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(Math.floor(amount));
  };



  // 사용자 정보 로드
  const loadUserInfo = async (userId: string, type: 'seller' | 'contractor') => {
    try {
      const user = await AuthService.getUserById(userId);
      if (user) {
        const userInfo = {
          email: user.email,
          name: user.name,
          phone: user.phone
        };
        
        if (type === 'seller') {
          setSellerInfo(userInfo);
        } else {
          setContractorInfo(userInfo);
        }
      }
    } catch (error) {
      console.error(`${type} 정보 로드 실패:`, error);
    }
  };

  // 작업 검색 함수
  const handleJobSearch = async () => {
    if (!jobSearchId.trim()) {
      setJobSearchError('작업 ID를 입력해주세요.');
      return;
    }

    try {
      setJobSearchLoading(true);
      setJobSearchError('');
      setError('');
      
      const job = await JobService.getJobById(jobSearchId.trim());
      if (job) {
        setSearchedJob(job);
        
        // 사용자 정보 로드
        if (job.sellerId) {
          await loadUserInfo(job.sellerId, 'seller');
        }
        if (job.contractorId) {
          await loadUserInfo(job.contractorId, 'contractor');
        }
        
        setJobSearchError('');
        setSuccess('작업을 성공적으로 찾았습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setJobSearchError('해당 작업을 찾을 수 없습니다.');
        setSearchedJob(null);
      }
    } catch (error) {
      console.error('작업 검색 실패:', error);
      setJobSearchError('작업 검색 중 오류가 발생했습니다.');
      setSearchedJob(null);
    } finally {
      setJobSearchLoading(false);
    }
  };

  // 작업 상세 보기
  const handleViewJobDetail = async (job: ConstructionJob) => {
    setEditingJob({ ...job });
    setEditMode(false);
    setJobDetailDialogOpen(true);
    
    // 사용자 정보 로드
    if (job.sellerId) {
      await loadUserInfo(job.sellerId, 'seller');
    }
    if (job.contractorId) {
      await loadUserInfo(job.contractorId, 'contractor');
    }
  };

  // 작업 수정 모드 시작
  const handleStartEdit = () => {
    setEditMode(true);
  };

  // 작업 수정 취소
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingJob(searchedJob ? { ...searchedJob } : null);
  };

  // 작업 수정 저장
  const handleSaveJob = async () => {
    if (!editingJob) return;

    try {
      setSavingJob(true);
      setError('');
      
      // 작업 업데이트
      await JobService.updateJob(editingJob.id, editingJob);
      
      // 검색된 작업도 업데이트
      setSearchedJob({ ...editingJob });
      setEditMode(false);
      
      // 성공 메시지
      setSuccess('작업이 성공적으로 수정되었습니다.');
      setTimeout(() => setSuccess(''), 3000); // 3초 후 메시지 제거
    } catch (error) {
      console.error('작업 수정 실패:', error);
      setError('작업 수정 중 오류가 발생했습니다.');
    } finally {
      setSavingJob(false);
    }
  };

  // 작업 삭제 확인
  const handleDeleteJob = () => {
    setDeleteConfirmOpen(true);
  };

  // 작업 삭제 실행
  const handleConfirmDelete = async () => {
    if (!editingJob) return;

    try {
      setDeletingJob(true);
      setError('');
      
      await JobService.deleteJob(editingJob.id);
      
      setJobDetailDialogOpen(false);
      setDeleteConfirmOpen(false);
      setSearchedJob(null);
      setJobSearchId('');
      
      // 성공 메시지
      setSuccess('작업이 성공적으로 삭제되었습니다.');
      setTimeout(() => setSuccess(''), 3000); // 3초 후 메시지 제거
    } catch (error) {
      console.error('작업 삭제 실패:', error);
      setError('작업 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingJob(false);
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status: ConstructionJob['status'] | string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '제품준비중';
      case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      case 'product_not_ready': return '제품 미준비';
      case 'customer_absent': return '소비자 부재';
      case 'schedule_changed': return '일정 변경';
      case 'compensation_completed': return '보상 완료';
      case 'reschedule_requested': return '일정 재조정 요청';
      default: return typeof status === 'string' ? status : '알 수 없음';
    }
  };

  // 상태 색상 변환
  const getStatusColor = (status: ConstructionJob['status'] | string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'product_preparing': return 'secondary';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'primary';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'product_not_ready': return 'error';
      case 'customer_absent': return 'error';
      case 'schedule_changed': return 'warning';
      case 'compensation_completed': return 'success';
      case 'reschedule_requested': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* 새로고침 버튼 */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadDashboardData}
          disabled={loading}
        >
          새로고침
        </Button>
      </Box>

      {/* 성공/에러 메시지 */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 작업 검색 및 관리 섹션 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search />
            작업 검색 및 관리
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              label="작업 ID 입력"
              value={jobSearchId}
              onChange={(e) => setJobSearchId(e.target.value)}
              placeholder="예: ABC123"
              size="small"
              sx={{ minWidth: 200 }}
              onKeyPress={(e) => e.key === 'Enter' && handleJobSearch()}
            />
            <Button
              variant="contained"
              onClick={handleJobSearch}
              disabled={jobSearchLoading}
              startIcon={jobSearchLoading ? <CircularProgress size={16} /> : <Search />}
            >
              {jobSearchLoading ? '검색 중...' : '검색'}
            </Button>
          </Box>

          {jobSearchError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {jobSearchError}
            </Alert>
          )}

          {searchedJob && (
            <Card variant="outlined" sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {searchedJob.title || '제목 없음'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={getStatusText(searchedJob.status)} 
                      color={getStatusColor(searchedJob.status) as any}
                      size="small"
                    />
                    <Tooltip title="상세 보기">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewJobDetail(searchedJob)}
                        color="primary"
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>작업 ID:</strong> {searchedJob.id}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>주소:</strong> {searchedJob.address}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>시공일시:</strong> {searchedJob.scheduledDate ? new Date(searchedJob.scheduledDate).toLocaleString() : '미정'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>판매자:</strong> {sellerInfo ? `${sellerInfo.name} (${sellerInfo.email})` : searchedJob.sellerId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>시공자:</strong> {contractorInfo ? `${contractorInfo.name} (${contractorInfo.email})` : (searchedJob.contractorId || '미배정')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>최종금액:</strong> {formatCurrency(searchedJob.finalAmount || 0)}원
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 사용자 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 사용자
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 작업 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 시공 건수
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 평균 평점 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.averageRating.toFixed(1)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    평균 평점
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 활성 시공자 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.activeContractors}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    활성 시공자
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 수익 통계 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4">{formatCurrency(stats.totalRevenue)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    플랫폼 수익
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    (수수료 수익)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 승인 대기 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.pendingApprovals}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    승인 대기
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 완료된 작업 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.completedJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    완료된 작업
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 진행 중인 작업 */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.inProgressJobs}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    진행 중인 작업
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 시스템 설정 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime />
                현재 시스템 설정
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                  label={`에스크로 자동 지급: ${formatTimeDisplay(escrowHours)}`}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
                <Typography variant="body2" color="textSecondary">
                  시공 완료 후 {formatTimeDisplay(escrowHours)} 후 자동으로 시공자에게 포인트가 지급됩니다.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 수익 계산 방식 안내 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                수익 계산 방식
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                  label={`판매자 수수료: ${feeSettings.sellerCommissionRate}%`}
                  color="primary"
                  variant="outlined"
                  size="medium"
                />
                <Chip 
                  label={`시공자 수수료: ${feeSettings.contractorCommissionRate}%`}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                />
                <Typography variant="body2" color="textSecondary">
                  플랫폼 수익 = 판매자 수수료 + 시공자 수수료 (완료된 작업 기준)
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>수익 계산 예시:</strong><br />
                  • 100,000원 작업 완료 시<br />
                  • 판매자 수수료: {Math.round(100000 * feeSettings.sellerCommissionRate / 100).toLocaleString()}원 ({feeSettings.sellerCommissionRate}%)<br />
                  • 시공자 수수료: {Math.round(100000 * feeSettings.contractorCommissionRate / 100).toLocaleString()}원 (100,000원의 {feeSettings.contractorCommissionRate}%)<br />
                  • 플랫폼 총 수익: {(Math.round(100000 * feeSettings.sellerCommissionRate / 100) + Math.round(100000 * feeSettings.contractorCommissionRate / 100)).toLocaleString()}원
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 액션 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                빠른 액션
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {stats.pendingApprovals > 0 && (
                  <Chip 
                    icon={<Warning />}
                    label={`승인 대기 ${stats.pendingApprovals}건`}
                    color="warning"
                    variant="outlined"
                    clickable
                    onClick={() => window.location.href = '/admin/users'}
                  />
                )}
                <Chip 
                  icon={<People />}
                  label="사용자 관리"
                  color="primary"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/users'}
                />
                <Chip 
                  icon={<Work />}
                  label="작업 관리"
                  color="success"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/jobs'}
                />
                <Chip 
                  icon={<TrendingUp />}
                  label="분석 보기"
                  color="info"
                  variant="outlined"
                  clickable
                  onClick={() => window.location.href = '/admin/analytics'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 작업 상세 다이얼로그 */}
      <Dialog 
        open={jobDetailDialogOpen} 
        onClose={() => setJobDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editMode ? '작업 수정' : '작업 상세 정보'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!editMode && (
                <Tooltip title="수정">
                  <IconButton onClick={handleStartEdit} color="primary">
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="삭제">
                <IconButton onClick={handleDeleteJob} color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingJob && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* 기본 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>기본 정보</Typography>
                  
                  <TextField
                    fullWidth
                    label="작업 제목"
                    value={editingJob.title || ''}
                    onChange={(e) => setEditingJob(prev => prev ? { ...prev, title: e.target.value } : null)}
                    disabled={!editMode}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="작업 ID"
                    value={editingJob.id}
                    disabled
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="주소"
                    value={editingJob.address || ''}
                    onChange={(e) => setEditingJob(prev => prev ? { ...prev, address: e.target.value } : null)}
                    disabled={!editMode}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="설명"
                    value={editingJob.description || ''}
                    onChange={(e) => setEditingJob(prev => prev ? { ...prev, description: e.target.value } : null)}
                    disabled={!editMode}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                {/* 상태 및 일정 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>상태 및 일정</Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>상태</InputLabel>
                                         <Select
                       value={editingJob.status}
                       onChange={(e) => setEditingJob(prev => prev ? { ...prev, status: e.target.value as ConstructionJob['status'] } : null)}
                       disabled={!editMode}
                       label="상태"
                     >
                      <MenuItem value="pending">대기중</MenuItem>
                      <MenuItem value="assigned">배정됨</MenuItem>
                      <MenuItem value="product_preparing">제품준비중</MenuItem>
                      <MenuItem value="product_ready">제품준비완료</MenuItem>
                      <MenuItem value="pickup_completed">픽업완료</MenuItem>
                      <MenuItem value="in_progress">시공중</MenuItem>
                      <MenuItem value="completed">완료</MenuItem>
                      <MenuItem value="cancelled">취소됨</MenuItem>
                      <MenuItem value="product_not_ready">제품 미준비</MenuItem>
                      <MenuItem value="customer_absent">소비자 부재</MenuItem>
                      <MenuItem value="schedule_changed">일정 변경</MenuItem>
                      <MenuItem value="compensation_completed">보상 완료</MenuItem>
                      <MenuItem value="reschedule_requested">일정 재조정 요청</MenuItem>
                    </Select>
                  </FormControl>
                  
                                       <TextField
                       fullWidth
                       label="시공일시"
                       type="datetime-local"
                       value={editingJob.scheduledDate ? new Date(editingJob.scheduledDate).toISOString().slice(0, 16) : ''}
                       onChange={(e) => setEditingJob(prev => prev ? { ...prev, scheduledDate: new Date(e.target.value) } : null)}
                       disabled={!editMode}
                       InputLabelProps={{ shrink: true }}
                       sx={{ mb: 2 }}
                     />
                  
                                     <TextField
                     fullWidth
                     label="준비일시"
                     type="datetime-local"
                     value={editingJob.preparationDate ? new Date(editingJob.preparationDate).toISOString().slice(0, 16) : ''}
                     onChange={(e) => setEditingJob(prev => prev ? { ...prev, preparationDate: new Date(e.target.value) } : null)}
                     disabled={!editMode}
                     InputLabelProps={{ shrink: true }}
                     sx={{ mb: 2 }}
                   />
                </Grid>

                {/* 사용자 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>사용자 정보</Typography>
                  
                  {/* 판매자 정보 */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>판매자 정보</Typography>
                    <TextField
                      fullWidth
                      label="판매자 ID"
                      value={editingJob.sellerId || ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, sellerId: e.target.value } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="판매자 이름"
                      value={sellerInfo?.name || ''}
                      disabled
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="판매자 이메일"
                      value={sellerInfo?.email || ''}
                      disabled
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="판매자 연락처"
                      value={sellerInfo?.phone || ''}
                      disabled
                      size="small"
                    />
                  </Box>
                  
                  {/* 시공자 정보 */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>시공자 정보</Typography>
                    <TextField
                      fullWidth
                      label="시공자 ID"
                      value={editingJob.contractorId || ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, contractorId: e.target.value } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="시공자 이름"
                      value={contractorInfo?.name || ''}
                      disabled
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="시공자 이메일"
                      value={contractorInfo?.email || ''}
                      disabled
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="시공자 연락처"
                      value={contractorInfo?.phone || ''}
                      disabled
                      size="small"
                    />
                  </Box>
                  
                  {/* 고객 정보 */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>고객 정보</Typography>
                    <TextField
                      fullWidth
                      label="고객명"
                      value={editingJob.customerName || ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="고객 연락처"
                      value={editingJob.customerPhone || ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, customerPhone: e.target.value } : null)}
                      disabled={!editMode}
                      size="small"
                    />
                  </Box>
                </Grid>

                {/* 금액 정보 */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>금액 정보</Typography>
                  
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <TextField
                      fullWidth
                      label="기본 출장비 (원)"
                      type="number"
                      value={editingJob.travelFee || 0}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, travelFee: parseInt(e.target.value) || 0 } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: <Typography variant="caption">원</Typography>
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="최종 금액 (원)"
                      type="number"
                      value={editingJob.finalAmount || 0}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, finalAmount: parseInt(e.target.value) || 0 } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: <Typography variant="caption">원</Typography>
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="에스크로 금액 (원)"
                      type="number"
                      value={editingJob.escrowAmount || 0}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, escrowAmount: parseInt(e.target.value) || 0 } : null)}
                      disabled={!editMode}
                      size="small"
                      InputProps={{
                        endAdornment: <Typography variant="caption">원</Typography>
                      }}
                    />
                  </Box>
                </Grid>

                {/* 추가 정보 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>픽업 정보</Typography>
                  
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="픽업 회사명"
                          value={editingJob.pickupCompanyName || ''}
                          onChange={(e) => setEditingJob(prev => prev ? { ...prev, pickupCompanyName: e.target.value } : null)}
                          disabled={!editMode}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="픽업 연락처"
                          value={editingJob.pickupPhone || ''}
                          onChange={(e) => setEditingJob(prev => prev ? { ...prev, pickupPhone: e.target.value } : null)}
                          disabled={!editMode}
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    </Grid>
                    
                    <TextField
                      fullWidth
                      label="픽업 주소"
                      value={editingJob.pickupAddress || ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, pickupAddress: e.target.value } : null)}
                      disabled={!editMode}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="픽업 일시"
                      type="datetime-local"
                      value={editingJob.pickupScheduledDate ? new Date(editingJob.pickupScheduledDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingJob(prev => prev ? { ...prev, pickupScheduledDate: new Date(e.target.value) } : null)}
                      disabled={!editMode}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={handleCancelEdit} disabled={savingJob}>
                취소
              </Button>
              <Button 
                onClick={handleSaveJob} 
                variant="contained" 
                disabled={savingJob}
                startIcon={savingJob ? <CircularProgress size={16} /> : <Save />}
              >
                {savingJob ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setJobDetailDialogOpen(false)}>
              닫기
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 작업 삭제 확인 다이얼로그 */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>작업 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 작업을 삭제하시겠습니까? 이 작업은 복구할 수 없습니다.
          </Typography>
          {editingJob && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">삭제할 작업 정보:</Typography>
              <Typography variant="body2">ID: {editingJob.id}</Typography>
              <Typography variant="body2">제목: {editingJob.title || '제목 없음'}</Typography>
              <Typography variant="body2">주소: {editingJob.address}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deletingJob}>
            취소
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            disabled={deletingJob}
            startIcon={deletingJob ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingJob ? '삭제 중...' : '삭제'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
