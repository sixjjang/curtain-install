import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { JobCancellationService } from '../../../shared/services/jobCancellationService';
import { AuthService } from '../../../shared/services/authService';
import { ConstructionJob, User } from '../../../types';
import CreateJobDialog from '../components/CreateJobDialog';
import JobDetailDialog from '../components/JobDetailDialog';

const JobManagement: React.FC = () => {
  const [jobCounts, setJobCounts] = useState<{ [key: string]: number }>({
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  });
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<{ [key: string]: User }>({});
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
  const [cancellationStats, setCancellationStats] = useState<{
    totalCancellations: number;
    todayCancellations: number;
    topCancellingContractors: Array<{
      contractorId: string;
      contractorName: string;
      cancellationCount: number;
    }>;
  } | null>(null);

  // 상태별 색상과 라벨
  const statusConfig = {
    pending: { label: '대기중', color: 'warning' as const, description: '시공자 배정 대기' },
    assigned: { label: '배정됨', color: 'info' as const, description: '시공자 배정 완료' },
    in_progress: { label: '진행중', color: 'default' as const, description: '시공 진행 중' },
    completed: { label: '완료', color: 'success' as const, description: '시공 완료' },
    cancelled: { label: '취소', color: 'error' as const, description: '작업 취소' }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadJobCountsByPeriod(selectedPeriod);
    loadCancellationStats();
  }, []);

  // 취소 통계 로드
  const loadCancellationStats = async () => {
    try {
      const stats = await JobCancellationService.getCancellationStats();
      setCancellationStats(stats);
    } catch (error) {
      console.error('취소 통계 로드 실패:', error);
    }
  };

  // 작업 개수 로드 (기간별 필터링 적용)
  const loadJobCounts = async () => {
    try {
      setLoading(true);
      const counts = await JobService.getJobCountsByStatus();
      setJobCounts(counts);
    } catch (error) {
      setError('작업 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기간별 작업 개수 로드
  const loadJobCountsByPeriod = async (period: 'daily' | 'weekly' | 'monthly' | 'all') => {
    try {
      const statuses: ConstructionJob['status'][] = ['pending', 'assigned', 'in_progress', 'completed'];
      const counts: { [key: string]: number } = {};
      
      for (const status of statuses) {
        const jobs = await JobService.getJobsByStatusWithPeriod(status, period);
        counts[status] = jobs.length;
      }
      
      setJobCounts(counts);
    } catch (error) {
      setError('작업 데이터를 불러올 수 없습니다.');
    }
  };

  // 카드 클릭 시 해당 상태의 작업 목록 표시
  const handleCardClick = async (status: string) => {
    try {
      setLoading(true);
      setSelectedStatus(status);
      const statusJobs = await JobService.getJobsByStatusWithPeriod(
        status as ConstructionJob['status'], 
        selectedPeriod
      );
      setJobs(statusJobs);
      
      // 사용자 정보 가져오기
      const userIds = new Set<string>();
      statusJobs.forEach(job => {
        userIds.add(job.sellerId);
        if (job.customerId) {
          userIds.add(job.customerId);
        }
        if (job.contractorId) {
          userIds.add(job.contractorId);
        }
      });
      
      const userInfoMap: { [key: string]: User } = {};
      for (const userId of Array.from(userIds)) {
        const user = await AuthService.getUserById(userId);
        if (user) {
          userInfoMap[userId] = user;
        }
      }
      setUserInfo(userInfoMap);
      
      setDialogOpen(true);
    } catch (error) {
      setError('작업 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기간 필터 변경 시 작업 목록 새로고침
  const handlePeriodChange = async (newPeriod: 'daily' | 'weekly' | 'monthly' | 'all') => {
    setSelectedPeriod(newPeriod);
    if (selectedStatus) {
      try {
        setLoading(true);
        const statusJobs = await JobService.getJobsByStatusWithPeriod(
          selectedStatus as ConstructionJob['status'], 
          newPeriod
        );
        setJobs(statusJobs);
        
        // 사용자 정보 가져오기
        const userIds = new Set<string>();
        statusJobs.forEach(job => {
          userIds.add(job.sellerId);
          if (job.customerId) {
            userIds.add(job.customerId);
          }
          if (job.contractorId) {
            userIds.add(job.contractorId);
          }
        });
        
        const userInfoMap: { [key: string]: User } = {};
        for (const userId of Array.from(userIds)) {
          const user = await AuthService.getUserById(userId);
          if (user) {
            userInfoMap[userId] = user;
          }
        }
        setUserInfo(userInfoMap);
      } catch (error) {
        setError('작업 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 작업 상태 변경
  const handleStatusChange = async (jobId: string, newStatus: ConstructionJob['status']) => {
    try {
      await JobService.updateJobStatus(jobId, newStatus);
      // 목록 새로고침
      if (selectedStatus) {
        const statusJobs = await JobService.getJobsByStatus(selectedStatus as ConstructionJob['status']);
        setJobs(statusJobs);
      }
      // 개수 새로고침
      await loadJobCounts();
    } catch (error) {
      setError('작업 상태 변경에 실패했습니다.');
    }
  };

  // 작업 삭제
  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('정말로 이 작업을 삭제하시겠습니까?')) {
      try {
        await JobService.deleteJob(jobId);
        // 목록 새로고침
        if (selectedStatus) {
          const statusJobs = await JobService.getJobsByStatus(selectedStatus as ConstructionJob['status']);
          setJobs(statusJobs);
        }
        // 개수 새로고침
        await loadJobCounts();
      } catch (error) {
        setError('작업 삭제에 실패했습니다.');
      }
    }
  };

  // 작업 상세보기
  const handleViewJobDetail = (job: ConstructionJob) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          작업 관리
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={async () => {
              try {
                setLoading(true);
                await JobService.createTestJobs();
                await loadJobCounts();
                setError('테스트 작업 데이터가 생성되었습니다.');
              } catch (error) {
                setError('테스트 데이터 생성에 실패했습니다.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            테스트 데이터 생성
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            새 작업 생성
          </Button>
        </Box>
      </Box>

      {/* 기간 필터링 UI */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            기간별 필터:
          </Typography>
          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={(_, newPeriod) => {
              if (newPeriod !== null) {
                setSelectedPeriod(newPeriod);
                loadJobCountsByPeriod(newPeriod);
              }
            }}
            size="medium"
          >
            <ToggleButton value="daily">일간</ToggleButton>
            <ToggleButton value="weekly">주간</ToggleButton>
            <ToggleButton value="monthly">월간</ToggleButton>
            <ToggleButton value="all">전체</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {Object.entries(statusConfig).map(([status, config]) => (
          <Grid item xs={12} md={3} key={status}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { 
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }
              }}
              onClick={() => handleCardClick(status)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" gutterBottom>
                    {config.label} ({jobCounts[status] || 0}건)
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedPeriod === 'daily' && '오늘'}
                    {selectedPeriod === 'weekly' && '최근 7일'}
                    {selectedPeriod === 'monthly' && '최근 30일'}
                    {selectedPeriod === 'all' && '전체 기간'}
                  </Typography>
                  {loading && <CircularProgress size={20} />}
                </Box>
                <Chip 
                  label={config.description} 
                  color={config.color} 
                  size="small"
                  sx={status === 'in_progress' ? {
                    backgroundColor: '#8B4513',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#A0522D'
                    }
                  } : {}}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 취소 통계 섹션 */}
      {cancellationStats && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#f44336', fontWeight: 'bold' }}>
            🚫 작업 취소 통계
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#ffebee' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    총 취소 건수
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    {cancellationStats.totalCancellations}건
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    오늘 취소 건수
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                    {cancellationStats.todayCancellations}건
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#e8f5e8' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    취소율
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {jobCounts.completed > 0 
                      ? ((cancellationStats.totalCancellations / (jobCounts.completed + cancellationStats.totalCancellations)) * 100).toFixed(1)
                      : '0'}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 상위 취소 시공자 */}
          {cancellationStats.topCancellingContractors.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏆 상위 취소 시공자 (Top 5)
                </Typography>
                <Grid container spacing={2}>
                  {cancellationStats.topCancellingContractors.slice(0, 5).map((contractor, index) => (
                    <Grid item xs={12} md={6} key={contractor.contractorId}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        backgroundColor: index === 0 ? '#fff3e0' : '#fafafa'
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {index + 1}. {contractor.contractorName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              총 {contractor.cancellationCount}회 취소
                            </Typography>
                          </Box>
                          <Chip 
                            label={`${contractor.cancellationCount}회`}
                            color={index === 0 ? 'warning' : 'default'}
                            variant={index === 0 ? 'filled' : 'outlined'}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* 작업 목록 다이얼로그 */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedStatus && statusConfig[selectedStatus as keyof typeof statusConfig]?.label} 작업 목록
            </Typography>
            {/* 기간 필터링 UI */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                기간:
              </Typography>
              <ToggleButtonGroup
                value={selectedPeriod}
                exclusive
                onChange={(_, newPeriod) => {
                  if (newPeriod !== null) {
                    handlePeriodChange(newPeriod);
                  }
                }}
                size="small"
              >
                <ToggleButton value="daily">일간</ToggleButton>
                <ToggleButton value="weekly">주간</ToggleButton>
                <ToggleButton value="monthly">월간</ToggleButton>
                <ToggleButton value="all">전체</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : jobs.length === 0 ? (
            <Typography variant="body1" color="textSecondary" align="center" p={3}>
              해당 상태의 작업이 없습니다.
            </Typography>
          ) : (
            <List>
              {jobs.map((job) => (
                <ListItem key={job.id} divider>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {job.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      주소: {job.address} | 예산: {job.budget?.min || 0}~{job.budget?.max || 0}만원
                    </Typography>
                    
                    {/* 판매자 정보 */}
                    <Typography variant="caption" color="textSecondary" display="block">
                      판매자: {userInfo[job.sellerId]?.name || '알 수 없음'} ({userInfo[job.sellerId]?.phone || '연락처 없음'})
                    </Typography>
                    
                    {/* 시공자 정보 (배정된 경우에만) */}
                    {job.contractorId && userInfo[job.contractorId] && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        시공자: {userInfo[job.contractorId]?.name || '알 수 없음'} ({userInfo[job.contractorId]?.phone || '연락처 없음'})
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="textSecondary" display="block">
                      생성일: {job.createdAt.toLocaleDateString()}
                      {job.completedDate && (
                        <span> | 완료일: {job.completedDate.toLocaleDateString()}</span>
                      )}
                    </Typography>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => handleViewJobDetail(job)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => setError('작업 수정 기능은 개발 중입니다.')}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteJob(job.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>닫기</Button>
                 </DialogActions>
       </Dialog>

               {/* 새 작업 생성 다이얼로그 */}
        <CreateJobDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            loadJobCounts();
            setError('새 작업이 성공적으로 생성되었습니다.');
          }}
        />

        {/* 작업 상세보기 다이얼로그 */}
        <JobDetailDialog
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      </Box>
    );
  };

export default JobManagement;
