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
  CheckCircle,
  PlayArrow,
  Assignment,
  Star,
  Engineering,
  Chat,
  Phone,
  Cancel,
  Delete,
  Edit,
  Event,
  AttachFile,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService } from '../../../shared/services/customerService';
import { SellerService } from '../../../shared/services/sellerService';

import { ConstructionJob } from '../../../types';
import CreateJobDialog from '../components/CreateJobDialog';
import ChatArea from '../components/ChatArea';
import ExcelJobUpload from './ExcelJobUpload';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../../../shared/services/notificationService';
import { PointService } from '../../../shared/services/pointService';

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
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<ConstructionJob | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatJob, setChatJob] = useState<ConstructionJob | null>(null);

  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [contractorInfo, setContractorInfo] = useState<any>(null);
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  

  const [chatNotifications, setChatNotifications] = useState<{[jobId: string]: number}>({});
  const [pointBalance, setPointBalance] = useState(0);
  const [pickupInfoAutoFilled, setPickupInfoAutoFilled] = useState(false);

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };

  // 포인트 잔액 가져오기
  const fetchPointBalance = async () => {
    if (user?.id) {
      try {
        const balance = await PointService.getPointBalance(user.id, 'seller');
        setPointBalance(balance);
      } catch (error) {
        console.error('포인트 잔액 조회 실패:', error);
      }
    }
  };

  // 작업 목록 가져오기
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.id) {
        console.warn('사용자 ID가 없습니다.');
        setJobs([]);
        return;
      }
      
      // 현재 로그인한 판매자의 작업만 가져오기
      const sellerJobs = await JobService.getJobsBySeller(user.id);
      
      // 각 작업별 채팅 알림 개수 가져오기
      try {
        const notifications = await NotificationService.getNotifications(user.id);
        const chatNotifMap: {[jobId: string]: number} = {};
        
        notifications.forEach(notification => {
          if (notification.type === 'info' && notification.actionUrl?.includes('/chat/')) {
            const jobId = notification.actionUrl.split('/chat/')[1];
            if (jobId && !notification.isRead) {
              chatNotifMap[jobId] = (chatNotifMap[jobId] || 0) + 1;
            }
          }
        });
        
        setChatNotifications(chatNotifMap);
      } catch (notificationError) {
        console.warn('알림 정보 가져오기 실패:', notificationError);
        setChatNotifications({});
      }
      
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
      fetchPointBalance();
    }
  }, [user]);

  // 실시간 알림 구독
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = NotificationService.subscribeToNotifications(user.id, (notifications) => {
        const chatNotifMap: {[jobId: string]: number} = {};
        
        notifications.forEach(notification => {
          if (notification.type === 'info' && notification.actionUrl?.includes('/chat/')) {
            const jobId = notification.actionUrl.split('/chat/')[1];
            if (jobId && !notification.isRead) {
              chatNotifMap[jobId] = (chatNotifMap[jobId] || 0) + 1;
            }
          }
        });
        
        setChatNotifications(chatNotifMap);
      });
      
      return unsubscribe;
    }
  }, [user?.id]);

  const handleJobCreated = () => {
    // 작업 생성 후 목록 새로고침
    fetchJobs();
  };

  // 상세보기 다이얼로그 열기
  const handleDetailClick = async (job: ConstructionJob) => {
    console.log('작업상세정보 모달 - 전체 작업 데이터:', job);
    console.log('작업상세정보 모달 - 시공일시:', job.scheduledDate);
    console.log('작업상세정보 모달 - 픽업정보:', job.pickupInfo);
    
    // 판매자의 픽업정보 가져오기
    let sellerPickupInfo = null;
    try {
      if (user?.id) {
        sellerPickupInfo = await SellerService.getPickupInfo(user.id);
        console.log('판매자 픽업정보:', sellerPickupInfo);
      }
    } catch (error) {
      console.error('판매자 픽업정보 가져오기 실패:', error);
    }
    
    // 픽업정보가 비어있고 판매자 픽업정보가 있으면 자동으로 채우기
    let updatedJob = { ...job };
    let wasAutoFilled = false;
    if (sellerPickupInfo && (!job.pickupInfo || 
        (!job.pickupInfo.companyName && !job.pickupInfo.phone && !job.pickupInfo.address))) {
      updatedJob = {
        ...job,
        pickupInfo: {
          companyName: sellerPickupInfo.companyName || '',
          phone: sellerPickupInfo.phone || '',
          address: sellerPickupInfo.address || '',
          scheduledDateTime: job.pickupInfo?.scheduledDateTime || ''
        }
      };
      wasAutoFilled = true;
      console.log('픽업정보 자동 채움:', updatedJob.pickupInfo);
    }
    
    setPickupInfoAutoFilled(wasAutoFilled);
    
    setSelectedJob(updatedJob);
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
    setPickupInfoAutoFilled(false);
  };

  // 픽업정보 업데이트
  const handleUpdatePickupInfo = async () => {
    if (!selectedJob) return;
    
    try {
      setLoading(true);
      await JobService.updateJob(selectedJob.id, {
        pickupInfo: selectedJob.pickupInfo
      });
      
      // 작업 목록도 업데이트
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === selectedJob.id 
            ? { ...job, pickupInfo: selectedJob.pickupInfo }
            : job
        )
      );
      
      setPickupInfoAutoFilled(false);
      alert('픽업정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('픽업정보 업데이트 실패:', error);
      alert('픽업정보 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 작업 취소
  const handleCancelJob = async (job: ConstructionJob) => {
    if (job.status !== 'pending') {
      setError('대기중 상태의 작업만 취소할 수 있습니다.');
      return;
    }

    if (!window.confirm('작업을 취소하시겠습니까? 취소된 작업은 복구할 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      await JobService.cancelJob(job.id);
      alert('작업이 취소되었습니다.');
      fetchJobs(); // 목록 새로고침
    } catch (error) {
      console.error('작업 취소 실패:', error);
      setError('작업 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
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

  // 품목 삭제
  const handleDeleteItem = async (jobId: string, itemIndex: number) => {
    if (!selectedJob || !selectedJob.items) {
      return;
    }

    if (!window.confirm('이 품목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      
      // 해당 인덱스의 품목을 제외한 새로운 품목 배열 생성
      const updatedItems = selectedJob.items.filter((_, index) => index !== itemIndex);
      
      // JobService를 통해 품목 업데이트
      await JobService.updateJobItems(jobId, updatedItems);
      
      // 로컬 상태 업데이트
      setSelectedJob({
        ...selectedJob,
        items: updatedItems
      });
      
      // 작업 목록도 업데이트
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, items: updatedItems }
            : job
        )
      );
      
      alert('품목이 삭제되었습니다.');
    } catch (error) {
      console.error('품목 삭제 실패:', error);
      alert('품목 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 작업 수정 다이얼로그 열기
  const handleEditJob = async (job: ConstructionJob) => {
    console.log('작업수정 모달 - 전체 작업 데이터:', job);
    console.log('작업수정 모달 - 시공일시:', job.scheduledDate);
    console.log('작업수정 모달 - 픽업정보:', job.pickupInfo);
    
    // 판매자의 픽업정보 가져오기
    let sellerPickupInfo = null;
    try {
      if (user?.id) {
        sellerPickupInfo = await SellerService.getPickupInfo(user.id);
        console.log('판매자 픽업정보:', sellerPickupInfo);
      }
    } catch (error) {
      console.error('판매자 픽업정보 가져오기 실패:', error);
    }
    
    // 고객 정보 가져오기
    let customerData = null;
    try {
      if (job.customerId) {
        customerData = await CustomerService.getCustomerInfo(job.customerId);
        console.log('고객 정보:', customerData);
      }
    } catch (error) {
      console.error('고객 정보 가져오기 실패:', error);
    }
    
    // 픽업정보가 비어있고 판매자 픽업정보가 있으면 자동으로 채우기
    let updatedJob = { ...job };
    let wasAutoFilled = false;
    if (sellerPickupInfo && (!job.pickupInfo || 
        (!job.pickupInfo.companyName && !job.pickupInfo.phone && !job.pickupInfo.address))) {
      updatedJob = {
        ...job,
        pickupInfo: {
          companyName: sellerPickupInfo.companyName || '',
          phone: sellerPickupInfo.phone || '',
          address: sellerPickupInfo.address || '',
          scheduledDateTime: job.pickupInfo?.scheduledDateTime || ''
        }
      };
      wasAutoFilled = true;
      console.log('픽업정보 자동 채움:', updatedJob.pickupInfo);
    }
    
    // 고객 정보가 있으면 작업 데이터에 추가 (타입 안전하게)
    if (customerData) {
      updatedJob = {
        ...updatedJob,
        // @ts-ignore - 동적으로 고객 정보 추가
        customerName: customerData.name,
        customerPhone: customerData.phone
      } as any;
    }
    
    setJobToEdit(updatedJob);
    setEditDialogOpen(true);
  };

  // 작업 수정 완료
  const handleJobEdited = () => {
    setEditDialogOpen(false);
    setJobToEdit(null);
    fetchJobs(); // 작업 목록 새로고침
  };

  // 작업 삭제
  const handleDeleteJob = async (job: ConstructionJob) => {
    if (!window.confirm('이 작업을 완전히 삭제하시겠습니까? 삭제된 작업은 복구할 수 없습니다.')) {
      return;
    }

    try {
      setLoading(true);
      await JobService.deleteJob(job.id);
      alert('작업이 삭제되었습니다.');
      fetchJobs(); // 작업 목록 새로고침
    } catch (error) {
      console.error('작업 삭제 실패:', error);
      alert('작업 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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



  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };



  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            현재 포인트 잔액: <strong>{pointBalance.toLocaleString()}포인트</strong>
          </Typography>
        </Box>
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
          <Tab label="시공의뢰(엑셀업로드)" />
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
                           <Box display="flex" gap={1} alignItems="center">
                             {chatNotifications[job.id] > 0 && (
                               <Chip 
                                 label={`💬 ${chatNotifications[job.id]}`}
                                 color="error"
                                 size="small"
                                 sx={{ 
                                   animation: 'pulse 1.5s infinite',
                                   '@keyframes pulse': {
                                     '0%': { transform: 'scale(1)' },
                                     '50%': { transform: 'scale(1.05)' },
                                     '100%': { transform: 'scale(1)' }
                                   }
                                 }}
                               />
                             )}
                             <Chip 
                               label={getStatusText(job.status)} 
                               color={getStatusColor(job.status)} 
                               size="small"
                               sx={{
                                 ...(job.status === 'cancelled' && {
                                   backgroundColor: '#f44336',
                                   color: 'white',
                                   fontWeight: 'bold',
                                   '&:hover': {
                                     backgroundColor: '#d32f2f'
                                   }
                                 })
                               }}
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
                            {job.scheduledDate 
                              ? `${formatDate(job.scheduledDate)} ${formatTime(job.scheduledDate)}`
                              : '시공일시 미정'
                            }
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <AttachMoney fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            {job.finalAmount 
                              ? `${job.finalAmount.toLocaleString()}원` 
                              : calculateTotalBudget(job) > 0 
                                ? `${calculateTotalBudget(job).toLocaleString()}원`
                                : '예산 미정'
                            }
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

                        <Box display="flex" gap={1}>
                          {job.contractorId && (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<Chat />}
                              onClick={async () => {
                                // 해당 작업의 채팅 알림을 읽음 처리
                                if (chatNotifications[job.id] > 0) {
                                  try {
                                    const notifications = await NotificationService.getNotifications(user!.id);
                                    const chatNotificationsForJob = notifications.filter(
                                      notification => 
                                        notification.type === 'info' && 
                                        notification.actionUrl?.includes(`/chat/${job.id}`) &&
                                        !notification.isRead
                                    );
                                    
                                    await Promise.all(
                                      chatNotificationsForJob.map(notification => 
                                        NotificationService.markAsRead(notification.id)
                                      )
                                    );
                                  } catch (error) {
                                    console.error('채팅 알림 읽음 처리 실패:', error);
                                  }
                                }
                                // 채팅 모달 열기
                                setChatJob(job);
                                setChatDialogOpen(true);
                              }}
                              sx={{
                                ...(chatNotifications[job.id] > 0 && {
                                  animation: 'pulse 1.5s infinite',
                                  '@keyframes pulse': {
                                    '0%': { transform: 'scale(1)' },
                                    '50%': { transform: 'scale(1.05)' },
                                    '100%': { transform: 'scale(1)' }
                                  }
                                })
                              }}
                            >
                              채팅
                              {chatNotifications[job.id] > 0 && ` (${chatNotifications[job.id]})`}
                            </Button>
                          )}
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleDetailClick(job)}
                          >
                            상세보기
                          </Button>
                          {job.status === 'pending' && (
                            <Button 
                              variant="outlined" 
                              size="small"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleCancelJob(job)}
                              sx={{ ml: 1 }}
                            >
                              취소
                            </Button>
                          )}
                          
                          {/* 취소된 작업에 대한 수정/삭제 버튼 */}
                          {job.status === 'cancelled' && (
                            <>
                              <Button 
                                variant="outlined" 
                                size="small"
                                color="primary"
                                startIcon={<Edit />}
                                onClick={() => handleEditJob(job)}
                                sx={{ ml: 1 }}
                              >
                                수정
                              </Button>
                              <Button 
                                variant="outlined" 
                                size="small"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => handleDeleteJob(job)}
                                sx={{ ml: 1 }}
                              >
                                삭제
                              </Button>
                            </>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>



          {/* 엑셀 업로드 탭 */}
          <TabPanel value={tabValue} index={1}>
            <ExcelJobUpload />
          </TabPanel>
        </>
      )}

      <CreateJobDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onJobCreated={handleJobCreated}
      />

      {/* 작업 수정 다이얼로그 */}
      {jobToEdit && (
        <CreateJobDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setJobToEdit(null);
          }}
          onJobCreated={handleJobEdited}
          initialJobData={jobToEdit}
        />
      )}

      {/* 상세보기 다이얼로그 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleDetailClose} 
        maxWidth="md" 
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        disablePortal
        keepMounted={false}
        container={() => document.body}
        sx={{
          '& .MuiBackdrop-root': {
            pointerEvents: 'none'
          }
        }}
        slotProps={{
          backdrop: {
            inert: true
          }
        }}
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

                {/* 시공일시 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Schedule color="action" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      시공일시
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 3 }}>
                    {(() => {
                      console.log('시공일시 디버깅:', {
                        scheduledDate: selectedJob.scheduledDate,
                        scheduledDateType: typeof selectedJob.scheduledDate,
                        scheduledDateValue: selectedJob.scheduledDate
                      });
                      
                      if (selectedJob.scheduledDate) {
                        try {
                          const date = new Date(selectedJob.scheduledDate);
                          if (!isNaN(date.getTime())) {
                            return `${date.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })} ${date.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`;
                          }
                        } catch (error) {
                          console.error('시공일시 파싱 에러:', error);
                        }
                      }
                      return '시공일시가 설정되지 않았습니다.';
                    })()}
                  </Typography>
                </Grid>

                {/* 준비일시 */}
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Event color="action" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      준비일시
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ ml: 3 }}>
                    {(() => {
                      console.log('준비일시 디버깅:', {
                        pickupInfo: selectedJob.pickupInfo,
                        scheduledDateTime: selectedJob.pickupInfo?.scheduledDateTime,
                        scheduledDateTimeType: typeof selectedJob.pickupInfo?.scheduledDateTime
                      });
                      
                      if (selectedJob.pickupInfo?.scheduledDateTime) {
                        try {
                          const date = new Date(selectedJob.pickupInfo.scheduledDateTime);
                          if (!isNaN(date.getTime())) {
                            return `${date.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })} ${date.toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`;
                          }
                        } catch (error) {
                          console.error('준비일시 파싱 에러:', error);
                        }
                      }
                      return '준비일시가 설정되지 않았습니다.';
                    })()}
                  </Typography>
                </Grid>

                {/* 작업지시서 파일첨부 */}
                {selectedJob.workInstructions && selectedJob.workInstructions.length > 0 && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AttachFile color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        작업지시서 파일첨부
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3 }}>
                      {selectedJob.workInstructions.map((file, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {file.fileName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            파일 크기: {file.fileSize} | 업로드: {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<AttachFile />}
                              onClick={() => window.open(file.fileUrl, '_blank')}
                            >
                              파일 보기
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}





                {/* 고객 연락처 */}
                {customerInfo && customerInfo.phone && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Phone color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        고객 연락처
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ ml: 3 }}>
                      {customerInfo.phone}
                    </Typography>
                  </Grid>
                )}

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
                  selectedJob.pickupInfo.companyName || 
                  selectedJob.pickupInfo.address || 
                  selectedJob.pickupInfo.phone || 
                  selectedJob.pickupInfo.scheduledDateTime
                ) ? (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        픽업 정보
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      ml: 3, 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                      borderRadius: 1 
                    }}>
                      {selectedJob.pickupInfo.companyName && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>회사명:</strong> {selectedJob.pickupInfo.companyName}
                        </Typography>
                      )}
                      {selectedJob.pickupInfo.address && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>주소:</strong> {selectedJob.pickupInfo.address}
                        </Typography>
                      )}
                      {selectedJob.pickupInfo.phone && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>연락처:</strong> {selectedJob.pickupInfo.phone}
                        </Typography>
                      )}
                      {selectedJob.pickupInfo.scheduledDateTime && (
                        <Typography variant="body2">
                          <strong>픽업 일시:</strong> {(() => {
                            try {
                              const date = new Date(selectedJob.pickupInfo.scheduledDateTime);
                              if (!isNaN(date.getTime())) {
                                return `${date.toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'long'
                                })} ${date.toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`;
                              }
                            } catch (error) {
                              console.error('픽업 일시 파싱 에러:', error);
                            }
                            return selectedJob.pickupInfo.scheduledDateTime;
                          })()}
                        </Typography>
                      )}
                    </Box>
                    {pickupInfoAutoFilled && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleUpdatePickupInfo}
                          disabled={loading}
                        >
                          {loading ? '업데이트 중...' : '픽업정보 저장'}
                        </Button>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                          프로필 정보로 자동 채워진 픽업정보를 저장합니다.
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                ) : (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person color="action" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        픽업 정보
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3, p: 2, bgcolor: 'orange.50', borderRadius: 1, border: '1px solid #ff9800' }}>
                      <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ⚠️ 픽업 정보가 설정되지 않았습니다
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        프로필 설정에서 픽업 정보(상호, 연락처, 픽업주소)를 입력하시면 
                        새 작업 등록 시 자동으로 입력됩니다.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          handleDetailClose();
                          navigate('/seller/profile');
                        }}
                      >
                        프로필 설정으로 이동
                      </Button>
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
                          <Box sx={{ width: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
                            {step.note && (
                              <Typography variant="caption" color="textSecondary" display="block">
                                메모: {step.note}
                              </Typography>
                            )}
                            {step.contractorId && contractorInfo && (
                              <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                                📞 {contractorInfo.phone}
                              </Typography>
                            )}
                          </Box>
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
                              <>
                                <Typography variant="body2" component="span">
                                  {item.name} × {item.quantity}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" component="span" sx={{ float: 'right' }}>
                                  {item.totalPrice.toLocaleString()}원
                                </Typography>
                              </>
                            }
                            secondary={
                              <Typography variant="caption" color="textSecondary" component="span">
                                단가: {item.unitPrice.toLocaleString()}원
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleDeleteItem(selectedJob.id, index)}
                              disabled={loading}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
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
                    <Box sx={{ 
                      ml: 3, 
                      p: 2, 
                      bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                      borderRadius: 1 
                    }}>
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
              {selectedJob && selectedJob.contractorId && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Chat />}
                  onClick={() => {
                    handleDetailClose();
                    setChatJob(selectedJob);
                    setChatDialogOpen(true);
                  }}
                >
                  채팅하기
                </Button>
              )}
              <Button onClick={handleDetailClose}>
                닫기
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 채팅 모달 */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            시공자와 채팅
          </Typography>
          <IconButton
            onClick={() => setChatDialogOpen(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {chatJob && (
            <ChatArea 
              selectedJob={chatJob} 
              isModal={true}
            />
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};



export default JobManagement;
