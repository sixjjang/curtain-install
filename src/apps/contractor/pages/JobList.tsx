import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  Collapse,
  Snackbar,
  Alert,
  Paper,
  TextField
} from '@mui/material';
import { Schedule, LocationOn, ExpandMore, ExpandLess, CalendarMonth, Cancel, AttachFile } from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { JobCancellationService } from '../../../shared/services/jobCancellationService';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';
import CalendarView from './CalendarView';

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 주소를 구/동까지만 표시하는 함수
  const formatAddressForCard = (address: string): string => {
    const parts = address.split(' ');
    
    if (parts.length >= 4) {
      return parts.slice(2, 4).join(' ');
    } else if (parts.length >= 3) {
      return parts.slice(1, 3).join(' ');
    } else if (parts.length >= 2) {
      return parts.slice(1).join(' ');
    }
    
    return address;
  };

  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [myJobs, setMyJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [regionFilterExpanded, setRegionFilterExpanded] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 취소 관련 상태
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedJobForCancel, setSelectedJobForCancel] = useState<ConstructionJob | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellationInfo, setCancellationInfo] = useState<{
    canCancel: boolean;
    reason?: string;
    cancellationNumber?: number;
    totalCancellationsToday?: number;
    maxCancellationHours?: number;
    maxDailyCancellations?: number;
    feeAmount?: number;
    feeRate?: number;
    requiresFee?: boolean;
  } | null>(null);

  // 지역 데이터 구조
  const regionData = {
    '서울특별시': ['강남구', '서초구', '마포구', '송파구', '영등포구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '강서구', '구로구', '금천구', '동작구', '관악구'],
    '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
    '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
    '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
    '세종특별자치시': ['세종특별자치시'],
    '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양군', '연천군', '가평군'],
    '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시']
  };

  // 데이터 로드
  const loadData = async () => {
    if (!user) return;
    
      try {
        setLoading(true);
      
      // 모든 작업 조회
      const allJobs = await JobService.getAllJobs();
          setJobs(allJobs);
      
      // 내 작업 필터링 (배정된 작업들)
      const myJobs = allJobs.filter(job => 
        job.contractorId === user.id && 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'cancelled', 'product_not_ready', 'customer_absent', 'schedule_changed'].includes(job.status)
      );
      setMyJobs(myJobs);
      
    } catch (error: unknown) {
      console.error('데이터 로드 실패:', error);
      setSnackbar({
        open: true,
        message: '데이터를 불러오는데 실패했습니다.',
        severity: 'error'
      });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [user]);

  // 작업 수락
  const handleAcceptJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'assigned', user?.id);
      setSnackbar({
        open: true,
        message: '🎉 작업이 성공적으로 수락되었습니다!',
        severity: 'success'
      });
      await loadData();
    } catch (error: unknown) {
      console.error('작업 수락 실패:', error);
      setSnackbar({
        open: true,
        message: '작업 수락에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 작업 취소 확인 다이얼로그 열기
  const handleCancelJobClick = async (job: ConstructionJob) => {
    if (!user?.id) return;
    
    try {
      const canCancelResult = await JobCancellationService.canCancelJob(job.id, user.id);
      setCancellationInfo(canCancelResult);
      setSelectedJobForCancel(job);
      setCancelReason('');
      setCancelDialogOpen(true);
    } catch (error) {
      console.error('취소 가능 여부 확인 실패:', error);
      setSnackbar({
        open: true,
        message: '취소 가능 여부를 확인할 수 없습니다.',
        severity: 'error'
      });
    }
  };

  // 작업 취소 실행
  const handleCancelJob = async () => {
    if (!selectedJobForCancel || !user?.id || !cancellationInfo?.canCancel) return;
    
    try {
      await JobCancellationService.cancelJob(
        selectedJobForCancel.id,
        user.id,
        user.name,
        cancelReason
      );
      
      const message = `작업이 성공적으로 취소되었습니다.\n\n취소 정보:\n• ${cancellationInfo.cancellationNumber}번째 취소\n• 오늘 ${cancellationInfo.totalCancellationsToday}회 취소 (최대 ${cancellationInfo.maxDailyCancellations}회)`;
      
      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });
      
      setCancelDialogOpen(false);
      setSelectedJobForCancel(null);
      setCancelReason('');
      setCancellationInfo(null);
      
      await loadData();
      
    } catch (error) {
      console.error('작업 취소 실패:', error);
      setSnackbar({
        open: true,
        message: `작업 취소에 실패했습니다: ${(error as Error).message}`,
        severity: 'error'
      });
    }
  };

  // 작업 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '자재준비';
      case 'product_ready': return '자재완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      case 'product_not_ready': return '제품 미준비';
      case 'customer_absent': return '소비자 부재';
      case 'schedule_changed': return '일정 변경';
      default: return '알 수 없음';
    }
  };

  // 작업 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'primary';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'info';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'success';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'product_not_ready': return 'error';
      case 'customer_absent': return 'error';
      case 'schedule_changed': return 'warning';
      default: return 'default';
    }
  };

  // 날짜 포맷
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 시간 포맷
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 총 가격 계산
  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 지역별 작업 필터링 (대기중인 작업만)
  const getJobsByRegion = () => {
    const jobsByRegion: { [key: string]: ConstructionJob[] } = {};
    
    // 대기중인 작업만 필터링
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    
    pendingJobs.forEach(job => {
      const addressParts = job.address.split(' ');
      if (addressParts.length >= 2) {
        const region = addressParts[0]; // 시/도
        const district = addressParts[1]; // 구/군
        
        if (!jobsByRegion[region]) {
          jobsByRegion[region] = [];
        }
        jobsByRegion[region].push(job);
      }
    });
    
    return jobsByRegion;
  };

  // 지역 필터 적용된 작업 목록 (대기중인 작업만)
  const getFilteredJobs = () => {
    // 먼저 대기중인 작업만 필터링
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    
    // 지역 필터가 없으면 대기중인 작업 모두 반환
    if (regionFilter.length === 0) {
      return pendingJobs;
    }
    
    // 지역 필터 적용
    return pendingJobs.filter(job => {
      const addressParts = job.address.split(' ');
      if (addressParts.length >= 2) {
        const region = addressParts[0];
        const district = addressParts[1];
        return regionFilter.includes(`${region} ${district}`);
      }
      return false;
    });
  };

  // 지역 토글
  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  // 지역 필터 토글
  const toggleRegionFilter = (regionDistrict: string) => {
    setRegionFilter(prev => 
      prev.includes(regionDistrict)
        ? prev.filter(r => r !== regionDistrict)
        : [...prev, regionDistrict]
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  // 캘린더 뷰 모드일 때
  if ((viewMode as string) === 'calendar') {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            대기중인 시공건 - 캘린더 보기
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setViewMode('list')}
          >
            목록 보기
          </Button>
        </Box>
        <CalendarView />
              </Box>
    );
  }

  // 목록 뷰 모드
  const filteredJobs = getFilteredJobs();
  const jobsByRegion = getJobsByRegion();
                
                return (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          대기중인 시공건
                      </Typography>
                      <Box display="flex" gap={2}>
                                      <Button 
            variant={(viewMode as string) === 'list' ? "contained" : "outlined"}
            startIcon={<Schedule />}
            onClick={() => setViewMode('list')}
          >
            목록 보기
                                      </Button>
        <Button
            variant={(viewMode as string) === 'calendar' ? "contained" : "outlined"}
          startIcon={<CalendarMonth />}
          onClick={() => setViewMode('calendar')}
        >
          스케줄 보기
        </Button>
        </Box>
      </Box>
      
             {/* 지역 필터 */}
       <Card sx={{ mb: 3 }}>
         <CardContent>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              지역 필터
               </Typography>
               <Button
                 size="small"
                 onClick={() => setRegionFilterExpanded(!regionFilterExpanded)}
               >
              {regionFilterExpanded ? <ExpandLess /> : <ExpandMore />}
               </Button>
             </Box>
            
                         <Collapse in={regionFilterExpanded}>
            <Grid container spacing={2}>
              {Object.entries(regionData).map(([region, districts]) => (
                <Grid item xs={12} sm={6} md={4} key={region}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {region}
                        </Typography>
                 <Button
                   size="small"
                          onClick={() => toggleRegion(region)}
                        >
                          {expandedRegions.includes(region) ? <ExpandLess /> : <ExpandMore />}
                 </Button>
               </Box>
               
                      <Collapse in={expandedRegions.includes(region)}>
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          {districts.map(district => {
                            const regionDistrict = `${region} ${district}`;
                            const isSelected = regionFilter.includes(regionDistrict);
                 
                 return (
                       <FormControlLabel
                                key={district}
                         control={
                           <Checkbox
                             size="small"
                                    checked={isSelected}
                                    onChange={() => toggleRegionFilter(regionDistrict)}
                                   />
                                 }
                                 label={
                                  <Typography variant="body2">
                                    {district}
                                   </Typography>
                                 }
                              />
                 );
                                })}
               </Box>
             </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Collapse>
         </CardContent>
       </Card>

      {/* 작업 목록 */}
      <Grid container spacing={3}>
        {filteredJobs.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" textAlign="center" color="textSecondary" py={4}>
                  {regionFilter.length > 0 ? '선택한 지역에 작업이 없습니다.' : '등록된 작업이 없습니다.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredJobs.map((job) => (
            <Grid item xs={12} key={job.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">
                      {job.title}
                    </Typography>
                        <Chip 
                      label={getStatusText(job.status)} 
                      color={getStatusColor(job.status)} 
                          size="small" 
                        />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    {job.description}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {formatAddressForCard(job.address)}
                    </Typography>
                  </Box>

                  {job.scheduledDate && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(job.scheduledDate)} {formatTime(job.scheduledDate)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    예산: {job.budget?.min?.toLocaleString()}~{job.budget?.max?.toLocaleString()}원
                  </Typography>
                  
                      {job.status === 'pending' && (
                        <Button 
                          variant="contained" 
                      color="primary"
                          onClick={() => handleAcceptJob(job.id)}
                      sx={{ mr: 1 }}
                        >
                      작업 수락
                        </Button>
                      )}
                  
                  {job.status === 'assigned' && job.contractorId === user?.id && (
                          <Button 
                            variant="outlined" 
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => handleCancelJobClick(job)}
                          >
                      작업 취소
                          </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* 작업 취소 확인 다이얼로그 */}
      <Snackbar
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            {selectedJobForCancel && cancellationInfo && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ color: '#f44336', fontWeight: 'bold' }}>
                  🚫 작업 취소 확인
          </Typography>
                
                {!cancellationInfo.canCancel ? (
                  <Box>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        취소할 수 없습니다
                      </Typography>
                      <Typography variant="body2">
                        {cancellationInfo.reason}
                      </Typography>
                    </Alert>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => setCancelDialogOpen(false)}
                        fullWidth
                      >
                        확인
                      </Button>
        </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>{selectedJobForCancel.title}</strong> 작업을 취소하시겠습니까?
                    </Typography>
                    
                    <Box sx={{ mb: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>취소 정보:</strong>
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        • {cancellationInfo.cancellationNumber}번째 취소
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        • 오늘 {cancellationInfo.totalCancellationsToday}회 취소 (최대 {cancellationInfo.maxDailyCancellations}회)
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        • 수락 후 {cancellationInfo.maxCancellationHours}시간까지 취소 가능
                      </Typography>
                      {cancellationInfo.requiresFee && cancellationInfo.feeAmount && (
                        <>
                          <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
                            ⚠️ 수수료 적용
                          </Typography>
                          <Typography variant="body2" color="error">
                            • 수수료율: {cancellationInfo.feeRate}%
                          </Typography>
                          <Typography variant="body2" color="error">
                            • 수수료 금액: {cancellationInfo.feeAmount.toLocaleString()}원
                          </Typography>
                        </>
                      )}
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="취소 사유 (선택사항)"
                      multiline
                      rows={3}
                      value={cancelReason}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelReason(e.target.value)}
                      placeholder="취소 사유를 입력해주세요..."
                      sx={{ mb: 3 }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setCancelDialogOpen(false)}
                        sx={{ flex: 1 }}
                      >
                        취소
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handleCancelJob}
                        sx={{ flex: 1 }}
                      >
                        작업 취소
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Snackbar>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobList;
