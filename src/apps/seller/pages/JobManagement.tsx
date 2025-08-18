import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  IconButton,
  Paper,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add, 
  LocationOn, 
  Schedule, 
  AttachMoney, 
  Person, 
  Description,
  ChevronLeft,
  ChevronRight,
  Today,
  CheckCircle,
  PlayArrow,
  Assignment,
  Star,
  Engineering
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService } from '../../../shared/services/customerService';
import { ConstructionJob } from '../../../types';
import CreateJobDialog from '../components/CreateJobDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const JobManagement: React.FC = () => {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [contractorInfo, setContractorInfo] = useState<any>(null);
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // 캘린더 관련 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<ConstructionJob[]>([]);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  // 작업 목록 가져오기
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const allJobs = await JobService.getAllJobs();
      // 현재 로그인한 판매자의 작업만 필터링
      const sellerJobs = allJobs.filter(job => job.sellerId === user?.id);
      
      // 디버깅: 대기중인 작업들의 scheduledDate 확인
      const pendingJobs = sellerJobs.filter(job => job.status === 'pending');
      console.log('대기중인 작업들:', pendingJobs.map(job => ({
        title: job.title,
        status: job.status,
        scheduledDate: job.scheduledDate,
        hasScheduledDate: !!job.scheduledDate,
        scheduledDateType: typeof job.scheduledDate,
        scheduledDateString: job.scheduledDate ? job.scheduledDate.toString() : 'null'
      })));
      
      // 모든 작업의 scheduledDate 상태 확인
      console.log('모든 작업의 scheduledDate 상태:', sellerJobs.map(job => ({
        title: job.title,
        status: job.status,
        hasScheduledDate: !!job.scheduledDate,
        scheduledDate: job.scheduledDate
      })));
      
      setJobs(sellerJobs);
    } catch (error) {
      console.error('작업 목록 가져오기 실패:', error);
      setError('작업 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const handleJobCreated = () => {
    // 작업 생성 후 목록 새로고침
    fetchJobs();
  };

  // 상세보기 다이얼로그 열기
  const handleDetailClick = async (job: ConstructionJob) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
    
    // 고객 정보 가져오기
    try {
      if (job.customerId) {
        const customer = await CustomerService.getCustomerInfo(job.customerId);
        setCustomerInfo(customer);
      }
    } catch (error) {
      console.error('고객 정보 가져오기 실패:', error);
      setCustomerInfo(null);
    }

    // 시공기사 정보 가져오기
    try {
      if (job.contractorId) {
        const { AuthService } = await import('../../../shared/services/authService');
        const contractor = await AuthService.getUserById(job.contractorId);
        setContractorInfo(contractor);
      } else {
        setContractorInfo(null);
      }
    } catch (error) {
      console.error('시공기사 정보 가져오기 실패:', error);
      setContractorInfo(null);
    }
  };

  // 상세보기 다이얼로그 닫기
  const handleDetailClose = () => {
    setDetailDialogOpen(false);
    setSelectedJob(null);
    setCustomerInfo(null);
    setContractorInfo(null);
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '제품준비중';
      case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  // 상태 색상 변환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'success';
      case 'pickup_completed': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // 제품준비 상태 변경
  const handleProductStatusChange = async (jobId: string, newStatus: 'product_preparing' | 'product_ready') => {
    try {
      await JobService.updateJobStatus(jobId, newStatus);
      // 작업 목록 새로고침
      await fetchJobs();
    } catch (error) {
      console.error('제품 상태 변경 실패:', error);
      setError('제품 상태 변경에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 캘린더 관련 함수들
  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '미정';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const jobsOnDate = jobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
    
    setSelectedDate(date);
    setSelectedJobs(jobsOnDate);
    setCalendarDialogOpen(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getJobsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    const todayStr = formatDate(new Date());
    
    const filteredJobs = jobs.filter(job => {
      // scheduledDate가 있는 경우 해당 날짜와 비교
      if (job.scheduledDate) {
        const jobDateStr = formatDate(job.scheduledDate);
        const matches = jobDateStr === dateStr;
        
        // 디버깅: 대기중인 작업의 날짜 매칭 확인
        if (job.status === 'pending') {
          console.log(`대기중인 작업 "${job.title}":`, {
            jobDate: jobDateStr,
            targetDate: dateStr,
            matches: matches,
            scheduledDate: job.scheduledDate
          });
        }
        
        return matches;
      }
      
      // scheduledDate가 없고 대기중인 작업인 경우 오늘 날짜에 표시
      if (job.status === 'pending' && !job.scheduledDate && dateStr === todayStr) {
        console.log(`scheduledDate가 없는 대기중인 작업 "${job.title}"을 오늘 날짜에 표시`);
        return true;
      }
      
      return false;
    });
    
    // 디버깅: 해당 날짜에 표시될 작업들
    if (filteredJobs.length > 0) {
      console.log(`${dateStr}에 표시될 작업들:`, filteredJobs.map(job => ({
        title: job.title,
        status: job.status,
        scheduledDate: job.scheduledDate,
        hasScheduledDate: !!job.scheduledDate
      })));
    }
    
    return filteredJobs;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          시공 작업 관리
        </Typography>
                 <Button 
           variant="contained" 
           startIcon={<Add />}
           onClick={() => setCreateDialogOpen(true)}
         >
           시공의뢰
         </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 탭 네비게이션 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="작업 관리 탭">
          <Tab label="목록 보기" />
          <Tab label="스케줄 보기" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* 목록 보기 탭 */}
          <TabPanel value={tabValue} index={0}>
            {jobs.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  등록된 작업이 없습니다
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  "새 작업 등록" 버튼을 클릭하여 첫 번째 작업을 등록해보세요.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid item xs={12} md={6} key={job.id}>
                    <Card>
                      <CardContent>
                                                 <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                           <Typography variant="h6" sx={{ flex: 1, mr: 2 }}>
                             {job.title}
                           </Typography>
                           <Box display="flex" gap={1}>
                             <Chip 
                               label={getStatusText(job.status)} 
                               color={getStatusColor(job.status)} 
                               size="small"
                             />
                             <Chip 
                               label={job.isInternal ? "자사시공" : "시공의뢰"} 
                               color={job.isInternal ? "secondary" : "primary"} 
                               size="small" 
                               variant="outlined"
                             />
                           </Box>
                         </Box>
                        
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {job.address}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {job.scheduledDate 
                              ? `${formatDate(job.scheduledDate)} ${formatTime(job.scheduledDate)}`
                              : '시공일시 미정'
                            }
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <AttachMoney fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {job.finalAmount ? `${job.finalAmount.toLocaleString()}원` : `${job.budget.min.toLocaleString()}원 ~ ${job.budget.max.toLocaleString()}원`}
                          </Typography>
                        </Box>

                        {/* 고객 만족도 평가 점수 */}
                        {job.customerSatisfaction && (
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  sx={{
                                    color: index < job.customerSatisfaction! ? '#FFD700' : '#E0E0E0',
                                    fontSize: '1rem'
                                  }}
                                />
                              ))}
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                              고객 만족도: {job.customerSatisfaction}/5
                            </Typography>
                          </Box>
                        )}

                        <Typography variant="body2" color="textSecondary" mb={2}>
                          {job.description}
                        </Typography>

                        {/* 제품준비 상태 관리 버튼 */}
                        {job.status === 'assigned' && (
                          <Box display="flex" gap={1} mb={2}>
                            <Button 
                              variant="contained" 
                              size="medium"
                              fullWidth
                              color="warning"
                              sx={{ 
                                fontSize: '1rem', 
                                fontWeight: 'bold',
                                py: 1.5,
                                mb: 1,
                                background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                  },
                                  '50%': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 5px 15px 2px rgba(255, 152, 0, .5)'
                                  },
                                  '100%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                  }
                                },
                                '&:hover': {
                                  background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                                  transform: 'scale(1.05)',
                                  transition: 'all 0.3s ease'
                                }
                              }}
                              onClick={() => handleProductStatusChange(job.id, 'product_preparing')}
                            >
                              📦 제품 준비를 시작합니다~ 클릭!!
                            </Button>
                          </Box>
                        )}

                        {job.status === 'product_preparing' && (
                          <Box display="flex" gap={1} mb={2}>
                            <Button 
                              variant="contained" 
                              size="medium"
                              fullWidth
                              color="success"
                              sx={{ 
                                fontSize: '1rem', 
                                fontWeight: 'bold',
                                py: 1.5,
                                mb: 1,
                                background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                  '0%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                  },
                                  '50%': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 5px 15px 2px rgba(255, 152, 0, .5)'
                                  },
                                  '100%': {
                                    transform: 'scale(1)',
                                    boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                  }
                                },
                                '&:hover': {
                                  background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                                  transform: 'scale(1.05)',
                                  transition: 'all 0.3s ease'
                                }
                              }}
                              onClick={() => handleProductStatusChange(job.id, 'product_ready')}
                            >
                              📦 제품이 모두 준비된 후 클릭해주세요!!
                            </Button>
                          </Box>
                        )}

                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleDetailClick(job)}
                        >
                          상세보기
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* 스케줄 보기 탭 */}
          <TabPanel value={tabValue} index={1}>
            {/* 캘린더 헤더 */}
            <Card sx={{ mb: 3 }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                   <Box display="flex" alignItems="center" justifyContent="space-between" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                     <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                       <IconButton onClick={goToPreviousMonth} size="small">
                         <ChevronLeft />
                       </IconButton>
                       <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                         {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                       </Typography>
                       <IconButton onClick={goToNextMonth} size="small">
                         <ChevronRight />
                       </IconButton>
                     </Box>
                     <Button
                       variant="outlined"
                       startIcon={<Today />}
                       onClick={goToToday}
                       size="small"
                     >
                       오늘
                     </Button>
                   </Box>
                   
                   {/* 캘린더 범례 */}
                   <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                     <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                       범례:
                     </Typography>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Box sx={{ width: 12, height: 12, bgcolor: 'warning.light', border: '2px dashed warning.main', borderRadius: 0.5 }} />
                       <Typography variant="caption">대기중</Typography>
                     </Box>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Box sx={{ width: 12, height: 12, bgcolor: 'primary.light', borderRadius: 0.5 }} />
                       <Typography variant="caption">시공의뢰</Typography>
                     </Box>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Box sx={{ width: 12, height: 12, bgcolor: 'secondary.light', border: '1px solid secondary.main', borderRadius: 0.5 }} />
                       <Typography variant="caption">자사시공</Typography>
                     </Box>
                   </Box>
                 </CardContent>
             </Card>

                         {/* 캘린더 그리드 */}
             <Paper sx={{ p: { xs: 1, sm: 2 } }}>
               <Grid container>
                 {/* 날짜 칸들 */}
                 {Array.from({ length: daysInMonth }).map((_, index) => {
                   const day = index + 1;
                   const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                   const jobsOnDate = getJobsForDate(date);
                   const isToday = formatDate(date) === formatDate(new Date());
                   const dayOfWeek = date.getDay();
                   const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

                   return (
                     <Grid item xs key={day}>
                                               <Box
                          sx={{
                            p: { xs: 0.5, sm: 1 },
                            minHeight: { xs: 80, sm: 120 },
                            height: 'auto',
                            border: isToday ? '4px solid #1976d2' : '1px solid grey.300',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'grey.100'
                            }
                          }}
                          onClick={() => handleDateClick(date)}
                        >
                         {/* 요일 표시 */}
                         <Typography
                           variant="caption"
                           sx={{
                             display: 'block',
                             textAlign: 'center',
                             fontWeight: 'bold',
                             color: dayOfWeek === 0 ? 'error.main' : dayOfWeek === 6 ? 'primary.main' : 'text.secondary',
                             mb: { xs: 0.25, sm: 0.5 },
                             fontSize: { xs: '0.6rem', sm: '0.75rem' }
                           }}
                         >
                           {dayNames[dayOfWeek]}
                         </Typography>
                         
                         {/* 날짜 표시 */}
                         <Typography
                           variant="body2"
                           sx={{
                             textAlign: 'center',
                             fontWeight: isToday ? 'bold' : 'normal',
                             color: 'text.primary',
                             mb: { xs: 0.5, sm: 1 },
                             fontSize: { xs: '0.75rem', sm: '0.875rem' }
                           }}
                         >
                           {day}
                         </Typography>
                         
                                                                              {/* 작업 표시 */}
                           {jobsOnDate.map((job, jobIndex) => {
                             // 대기중인 작업인지 확인
                             const isPending = job.status === 'pending';
                             
                             return (
                               <Box
                                 key={job.id}
                                 sx={{
                                   mt: { xs: 0.25, sm: 0.5 },
                                   p: { xs: 0.25, sm: 0.5 },
                                   backgroundColor: isPending 
                                     ? 'warning.light' 
                                     : job.isInternal 
                                       ? 'secondary.light' 
                                       : `${getStatusColor(job.status)}.light`,
                                   border: isPending 
                                     ? '2px dashed warning.main'
                                     : job.isInternal 
                                       ? '1px solid secondary.main' 
                                       : 'none',
                                   borderRadius: 1,
                                   fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                   overflow: 'hidden',
                                   textOverflow: 'ellipsis',
                                   whiteSpace: 'nowrap',
                                   mb: jobIndex === jobsOnDate.length - 1 ? 0 : { xs: 0.25, sm: 0.5 },
                                   // 대기중인 작업은 점선 애니메이션 추가
                                   ...(isPending && {
                                     animation: 'dashedBorder 2s infinite',
                                     '@keyframes dashedBorder': {
                                       '0%': { borderColor: 'warning.main' },
                                       '50%': { borderColor: 'warning.dark' },
                                       '100%': { borderColor: 'warning.main' }
                                     }
                                   })
                                 }}
                               >
                                 <Typography 
                                   variant="caption" 
                                   sx={{ 
                                     fontWeight: 'bold',
                                     fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                     color: isPending ? 'warning.dark' : 'inherit'
                                   }}
                                 >
                                   {isPending ? '⏳ ' : ''}
                                   {job.scheduledDate ? formatTime(job.scheduledDate) : '미정'} {job.title}
                                 </Typography>
                                 <Typography 
                                   variant="caption" 
                                   sx={{ 
                                     display: 'block',
                                     fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                     color: isPending 
                                       ? 'warning.dark' 
                                       : job.isInternal 
                                         ? 'secondary.dark' 
                                         : 'text.secondary'
                                   }}
                                 >
                                   {isPending 
                                     ? (job.scheduledDate ? "대기중" : "대기중 (일정미정)") 
                                     : job.isInternal ? "자사시공" : "시공의뢰"}
                                 </Typography>
                               </Box>
                             );
                           })}
                       </Box>
                     </Grid>
                   );
                 })}
               </Grid>
             </Paper>
          </TabPanel>
        </>
      )}

      <CreateJobDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onJobCreated={handleJobCreated}
      />

      {/* 상세보기 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleDetailClose} 
        maxWidth="md" 
        fullWidth
      >
        {selectedJob && (
          <>
                         <DialogTitle>
               <Box display="flex" justifyContent="space-between" alignItems="center">
                 <Typography variant="h6">
                   작업 상세 정보
                 </Typography>
                 <Box display="flex" gap={1}>
                   <Chip 
                     label={getStatusText(selectedJob.status)} 
                     color={getStatusColor(selectedJob.status)} 
                     size="small"
                   />
                   <Chip 
                     label={selectedJob.isInternal ? "자사시공" : "시공의뢰"} 
                     color={selectedJob.isInternal ? "secondary" : "primary"} 
                     size="small" 
                     variant="outlined"
                   />
                 </Box>
               </Box>
             </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* 기본 정보 */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedJob.title}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                {/* 주소 정보 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationOn color="action" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      주소
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 3 }}>
                    {selectedJob.address}
                  </Typography>
                </Grid>

                {/* 시공일시 */}
                {selectedJob.scheduledDate && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Schedule color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        시공일시
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 3 }}>
                      {formatDateTime(selectedJob.scheduledDate)}
                    </Typography>
                  </Grid>
                )}

                {/* 예산 정보 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AttachMoney color="action" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      예산
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 3 }}>
                    {selectedJob.budget.min.toLocaleString()}원 ~ {selectedJob.budget.max.toLocaleString()}원
                  </Typography>
                </Grid>

                {/* 작업 설명 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Description color="action" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      작업 설명
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 3, whiteSpace: 'pre-line' }}>
                    {selectedJob.description || '작업 설명이 없습니다.'}
                  </Typography>
                </Grid>

                {/* 작업 요구사항 */}
                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Assignment color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        작업 요구사항
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3 }}>
                      {selectedJob.requirements.map((requirement, index) => (
                        <Chip 
                          key={index} 
                          label={requirement} 
                          size="small" 
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* 픽업 정보 */}
                {selectedJob.pickupInfo && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        픽업 정보
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>회사명:</strong> {selectedJob.pickupInfo.companyName}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>주소:</strong> {selectedJob.pickupInfo.address}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>연락처:</strong> {selectedJob.pickupInfo.phone}
                      </Typography>
                      {selectedJob.pickupInfo.scheduledDateTime && (
                        <Typography variant="body2">
                          <strong>픽업 일시:</strong> {selectedJob.pickupInfo.scheduledDateTime}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* 배정된 시공기사 정보 */}
                {selectedJob.contractorId && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Engineering color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        배정된 시공기사 정보
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3, p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
                      {contractorInfo ? (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>이름:</strong> {contractorInfo.name}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>연락처:</strong> {contractorInfo.phone}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>이메일:</strong> {contractorInfo.email}
                          </Typography>
                          {contractorInfo.contractor && (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>경력:</strong> {contractorInfo.contractor.experience}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>평점:</strong> {contractorInfo.contractor.rating}/5
                              </Typography>
                              <Typography variant="body2">
                                <strong>완료 작업:</strong> {contractorInfo.contractor.completedJobs}건
                              </Typography>
                            </>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          시공기사 정보를 불러오는 중...
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* 최종 금액 (확정된 경우) */}
                {selectedJob.finalAmount && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachMoney color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        확정 금액
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary" sx={{ ml: 3 }}>
                      {selectedJob.finalAmount.toLocaleString()}원
                    </Typography>
                  </Grid>
                )}

                {/* 고객 만족도 */}
                {selectedJob.customerSatisfaction && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Star color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        고객 만족도
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          sx={{
                            color: index < selectedJob.customerSatisfaction! ? '#FFD700' : '#E0E0E0',
                            fontSize: '1.5rem'
                          }}
                        />
                      ))}
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {selectedJob.customerSatisfaction}/5
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* 작업 진행 기록 */}
                {selectedJob.progressHistory && selectedJob.progressHistory.length > 0 && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CheckCircle color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        작업 진행 기록
                      </Typography>
                    </Box>
                    <List dense sx={{ ml: 3 }}>
                      {selectedJob.progressHistory.map((step, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip 
                                    label={getStatusText(step.status)} 
                                    color={getStatusColor(step.status)} 
                                    size="small"
                                  />
                                  {step.contractorId && (
                                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                      👷 {contractorInfo?.name || '시공기사'}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography variant="caption" color="textSecondary">
                                  {formatDateTime(step.timestamp)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                {step.note && (
                                  <Typography variant="caption" color="textSecondary">
                                    메모: {step.note}
                                  </Typography>
                                )}
                                {step.contractorId && contractorInfo && (
                                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                    📞 {contractorInfo.phone}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {/* 품목 목록 */}
                {selectedJob.items && selectedJob.items.length > 0 && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachMoney color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        품목 및 단가
                      </Typography>
                    </Box>
                    <List dense sx={{ ml: 3 }}>
                      {selectedJob.items.map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2">
                                  {item.name} × {item.quantity}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.totalPrice.toLocaleString()}원
                                </Typography>
                              </Box>
                            }
                            secondary={`단가: ${item.unitPrice.toLocaleString()}원`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', borderRadius: 1 }}>
                      <Typography variant="h6" color="white" textAlign="center">
                        총 예산: {selectedJob.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}원
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* 고객 정보 */}
                {customerInfo && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        고객 정보
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>이름:</strong> {customerInfo.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>연락처:</strong> {customerInfo.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>주소:</strong> {customerInfo.address}
                      </Typography>
                      {customerInfo.email && (
                        <Typography variant="body2">
                          <strong>이메일:</strong> {customerInfo.email}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* 생성일 */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    생성일: {formatDateTime(selectedJob.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDetailClose}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

             {/* 캘린더 상세 다이얼로그 */}
       <Dialog
         open={calendarDialogOpen}
         onClose={() => setCalendarDialogOpen(false)}
         maxWidth="md"
         fullWidth
       >
         <DialogTitle>
           {selectedDate && `${formatDate(selectedDate)} 작업 일정`}
         </DialogTitle>
         <DialogContent>
           {selectedJobs.length === 0 ? (
             <Typography color="textSecondary">
               해당 날짜에 예정된 작업이 없습니다.
             </Typography>
           ) : (
             <List>
               {selectedJobs
                 .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
                 .map((job, index) => (
                   <React.Fragment key={job.id}>
                     <ListItem>
                       <Box sx={{ width: '100%' }}>
                         <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                           <Typography variant="h6">{job.title}</Typography>
                           <Box display="flex" gap={1}>
                             <Chip 
                               label={getStatusText(job.status)} 
                               color={getStatusColor(job.status)} 
                               size="small" 
                             />
                             <Chip 
                               label={job.isInternal ? "자사시공" : "시공의뢰"} 
                               color={job.isInternal ? "secondary" : "primary"} 
                               size="small" 
                               variant="outlined"
                             />
                           </Box>
                         </Box>
                         
                         <Box display="flex" alignItems="center" gap={1} mb={1}>
                           <Schedule fontSize="small" color="action" />
                           <Typography variant="body2" color="textSecondary">
                             {job.scheduledDate && formatTime(job.scheduledDate)}
                           </Typography>
                         </Box>
                         
                         <Box display="flex" alignItems="center" gap={1} mb={1}>
                           <LocationOn fontSize="small" color="action" />
                           <Typography variant="body2" color="textSecondary">
                             {job.address}
                           </Typography>
                         </Box>
                         
                         <Typography variant="body2" color="textSecondary" mb={2}>
                           총 금액: {calculateTotalPrice(job).toLocaleString()}원
                         </Typography>
                         
                         <Typography variant="body2" mb={2}>
                           {job.description}
                         </Typography>
                         
                         {/* 제품준비 상태 관리 버튼 */}
                         {job.status === 'assigned' && (
                           <Box display="flex" gap={1} mb={2}>
                             <Button 
                               variant="contained" 
                               size="medium"
                               fullWidth
                               color="warning"
                               sx={{ 
                                 fontSize: '1rem', 
                                 fontWeight: 'bold',
                                 py: 1.5,
                                 mb: 1,
                                 background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                 boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                                 animation: 'pulse 2s infinite',
                                 '@keyframes pulse': {
                                   '0%': {
                                     transform: 'scale(1)',
                                     boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                   },
                                   '50%': {
                                     transform: 'scale(1.02)',
                                     boxShadow: '0 5px 15px 2px rgba(255, 152, 0, .5)'
                                   },
                                   '100%': {
                                     transform: 'scale(1)',
                                     boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                   }
                                 },
                                 '&:hover': {
                                   background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                                   transform: 'scale(1.05)',
                                   transition: 'all 0.3s ease'
                                 }
                               }}
                               onClick={() => handleProductStatusChange(job.id, 'product_preparing')}
                             >
                               📦 제품 준비를 시작합니다~ 클릭!!
                             </Button>
                           </Box>
                         )}

                         {job.status === 'product_preparing' && (
                           <Box display="flex" gap={1} mb={2}>
                             <Button 
                               variant="contained" 
                               size="medium"
                               fullWidth
                               color="success"
                               sx={{ 
                                 fontSize: '1rem', 
                                 fontWeight: 'bold',
                                 py: 1.5,
                                 mb: 1,
                                 background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                 boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                                 animation: 'pulse 2s infinite',
                                 '@keyframes pulse': {
                                   '0%': {
                                     transform: 'scale(1)',
                                     boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                   },
                                   '50%': {
                                     transform: 'scale(1.02)',
                                     boxShadow: '0 5px 15px 2px rgba(255, 152, 0, .5)'
                                   },
                                   '100%': {
                                     transform: 'scale(1)',
                                     boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                   }
                                 },
                                 '&:hover': {
                                   background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                                   transform: 'scale(1.05)',
                                   transition: 'all 0.3s ease'
                                 }
                               }}
                               onClick={() => handleProductStatusChange(job.id, 'product_ready')}
                             >
                               📦 제품이 모두 준비된 후 클릭해주세요!!
                             </Button>
                           </Box>
                         )}
                         
                         <Button 
                           variant="outlined" 
                           size="small"
                           onClick={() => {
                             setCalendarDialogOpen(false);
                             handleDetailClick(job);
                           }}
                         >
                           상세보기
                         </Button>
                       </Box>
                     </ListItem>
                     {index < selectedJobs.length - 1 && <Divider />}
                   </React.Fragment>
                 ))}
             </List>
           )}
         </DialogContent>
         <DialogActions sx={{ justifyContent: 'space-between' }}>
           <Button 
             variant="contained" 
             startIcon={<Add />}
             onClick={() => {
               setCalendarDialogOpen(false);
               setCreateDialogOpen(true);
             }}
           >
             일정추가
           </Button>
           <Button onClick={() => setCalendarDialogOpen(false)}>
             닫기
           </Button>
         </DialogActions>
       </Dialog>
    </Box>
  );
};

export default JobManagement;
