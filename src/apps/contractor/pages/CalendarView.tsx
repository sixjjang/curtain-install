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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Schedule,
  LocationOn,
  CheckCircle,
  PlayArrow,
  Assignment
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<ConstructionJob[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const allJobs = await JobService.getAllJobs();
        
        // 나의 작업 (배정됨, 진행중, 완료 등)
        const myJobs = allJobs.filter(job => 
          ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
        );
        
        // 대기중인 작업 (수락 가능한 작업)
        const pendingJobs = allJobs.filter(job => job.status === 'pending');
        
        // 나의 작업과 대기중인 작업을 모두 설정
        setJobs([...myJobs, ...pendingJobs]);
      } catch (error) {
        console.error('작업 목록 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'warning'; // 배정됨: 주황색
      case 'product_preparing': return 'warning'; // 제품준비중: 주황색
      case 'product_ready': return 'success'; // 제품준비완료: 녹색
      case 'pickup_completed': return 'info'; // 픽업완료: 파란색
      case 'in_progress': return 'primary'; // 진행중: 파란색
      case 'completed': return 'default'; // 완료: 그레이톤
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '배정됨';
      case 'product_preparing': return '제품준비중';
      case 'product_ready': return '제품준비완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };



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
    setDialogOpen(true);
  };

  // 작업 수락 기능
  const handleAcceptJob = async (jobId: string) => {
    try {
      // 작업 상태를 'assigned'로 업데이트
      await JobService.updateJobStatus(jobId, 'assigned');
      
      // 작업 목록 새로고침
      const allJobs = await JobService.getAllJobs();
      const myJobs = allJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      const pendingJobs = allJobs.filter(job => job.status === 'pending');
      setJobs([...myJobs, ...pendingJobs]);
      
      // 다이얼로그 새로고침
      if (selectedDate) {
        const dateStr = formatDate(selectedDate);
        const jobsOnDate = [...myJobs, ...pendingJobs].filter(job => {
          if (!job.scheduledDate) return false;
          return formatDate(job.scheduledDate) === dateStr;
        });
        setSelectedJobs(jobsOnDate);
      }
      
      alert('🎉 작업이 성공적으로 수락되었습니다!\n\n이제 내 작업 목록에서 확인할 수 있습니다.');
    } catch (error) {
      console.error('작업 수락 실패:', error);
      alert('작업 수락에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleJobDetail = (jobId: string) => {
    navigate(`/contractor/jobs/${jobId}`);
    setDialogOpen(false);
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'in_progress');
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // 다이얼로그 새로고침
      if (selectedDate) {
        const dateStr = formatDate(selectedDate);
        const jobsOnDate = myJobs.filter(job => {
          if (!job.scheduledDate) return false;
          return formatDate(job.scheduledDate) === dateStr;
        });
        setSelectedJobs(jobsOnDate);
      }
    } catch (error) {
      console.error('작업 시작 실패:', error);
    }
  };

  // 픽업 완료 처리
  const handlePickupCompleted = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'pickup_completed');
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // 다이얼로그 새로고침
      if (selectedDate) {
        const dateStr = formatDate(selectedDate);
        const jobsOnDate = myJobs.filter(job => {
          if (!job.scheduledDate) return false;
          return formatDate(job.scheduledDate) === dateStr;
        });
        setSelectedJobs(jobsOnDate);
      }
    } catch (error) {
      console.error('픽업 완료 처리 실패:', error);
    }
  };

  // 고객님댁으로 이동 처리
  const handleStartWork = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'in_progress');
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // 다이얼로그 새로고침
      if (selectedDate) {
        const dateStr = formatDate(selectedDate);
        const jobsOnDate = myJobs.filter(job => {
          if (!job.scheduledDate) return false;
          return formatDate(job.scheduledDate) === dateStr;
        });
        setSelectedJobs(jobsOnDate);
      }
    } catch (error) {
      console.error('시공 시작 처리 실패:', error);
    }
  };

  // 시공완료 다이얼로그 시작
  const handleStartCompletion = (jobId: string) => {
    // 시공완료 처리는 별도 페이지로 이동
    navigate(`/contractor/jobs/${jobId}`);
    setDialogOpen(false);
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      await JobService.updateJobStatus(jobId, 'completed');
      const updatedJobs = await JobService.getAllJobs();
      const myJobs = updatedJobs.filter(job => 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // 다이얼로그 새로고침
      if (selectedDate) {
        const dateStr = formatDate(selectedDate);
        const jobsOnDate = myJobs.filter(job => {
          if (!job.scheduledDate) return false;
          return formatDate(job.scheduledDate) === dateStr;
        });
        setSelectedJobs(jobsOnDate);
      }
    } catch (error) {
      console.error('작업 완료 실패:', error);
    }
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
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
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

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          캘린더 보기
        </Typography>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        캘린더 보기
      </Typography>

      {/* 대기중인 작업 요약 정보 */}
      {(() => {
        const pendingJobs = jobs.filter(job => job.status === 'pending');
        const myJobs = jobs.filter(job => 
          ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
        );
        
        return (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%)', border: '2px solid #ff9800' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold', mb: 1 }}>
                    📋 수락 가능한 작업 현황
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#bf360c' }}>
                    대기중인 작업: <strong>{pendingJobs.length}개</strong> | 
                    내 작업: <strong>{myJobs.length}개</strong>
                  </Typography>
                  {pendingJobs.length > 0 && (
                    <Typography variant="body2" sx={{ color: '#d84315', mt: 1 }}>
                      💡 캘린더에서 📋 아이콘이 있는 작업을 클릭하여 빠르게 수락하세요!
                    </Typography>
                  )}
                </Box>
                {pendingJobs.length > 0 && (
                  <Button
                    variant="contained"
                    color="warning"
                    size="large"
                    sx={{
                      background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
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
                        background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
                        transform: 'scale(1.05)',
                        transition: 'all 0.3s ease'
                      }
                    }}
                    onClick={() => {
                      // 오늘 날짜로 이동하여 대기중인 작업 확인
                      setCurrentDate(new Date());
                      setTimeout(() => {
                        const today = new Date();
                        handleDateClick(today);
                      }, 100);
                    }}
                  >
                    🚀 대기중인 작업 확인하기
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })()}

      {/* 캘린더 헤더 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={goToPreviousMonth}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h5">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </Typography>
              <IconButton onClick={goToNextMonth}>
                <ChevronRight />
              </IconButton>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Today />}
              onClick={goToToday}
            >
              오늘
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 캘린더 범례 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>범례</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#fff3e0', border: '2px dashed #ff9800', borderRadius: 1 }} />
              <Typography variant="body2">📋 수락 가능한 작업</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#ffcc80', borderRadius: 1 }} />
              <Typography variant="body2">내 작업 (배정됨/준비중)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#a5d6a7', borderRadius: 1 }} />
              <Typography variant="body2">제품준비완료</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#90caf9', borderRadius: 1 }} />
              <Typography variant="body2">진행중/픽업완료</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 20, height: 20, backgroundColor: '#f5f5f5', borderRadius: 1 }} />
              <Typography variant="body2">완료</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

                           {/* 캘린더 그리드 */}
        <Paper sx={{ p: 2 }}>
          <Grid container>
            {/* 날짜 칸들 */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const jobsOnDate = getJobsForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            const dayOfWeek = date.getDay();
            const pendingJobsOnDate = jobsOnDate.filter(job => job.status === 'pending');
            const myJobsOnDate = jobsOnDate.filter(job => 
              ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
            );

            return (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 80, sm: 120 },
                    height: jobsOnDate.length > 2 ? 'auto' : { xs: 80, sm: 120 },
                    border: isToday ? '4px solid #1976d2' : '1px solid grey.300',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'grey.100'
                    }
                  }}
                  onClick={() => handleDateClick(date)}
                >
                  {/* 대기중인 작업이 있으면 상단에 표시 */}
                  {pendingJobsOnDate.length > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: '#ff9800',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        zIndex: 1,
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' }
                        }
                      }}
                    >
                      {pendingJobsOnDate.length}
                    </Box>
                  )}
                  
                                     {/* 요일 표시 */}
                   <Typography
                     variant="caption"
                     sx={{
                       display: 'block',
                       textAlign: 'center',
                       fontWeight: 'bold',
                       color: dayOfWeek === 0 ? 'error.main' : dayOfWeek === 6 ? 'primary.main' : 'text.secondary',
                       mb: 0.5,
                       fontSize: { xs: '0.7rem', sm: '0.8rem' }
                     }}
                   >
                     {['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}
                   </Typography>
                   
                   {/* 날짜 표시 */}
                   <Typography
                     variant="body2"
                     sx={{
                       textAlign: 'center',
                       fontWeight: isToday ? 'bold' : 'normal',
                       color: 'text.primary',
                       mb: 1,
                       fontSize: { xs: '0.8rem', sm: '1rem' }
                     }}
                   >
                     {day}
                   </Typography>
                  
                  {/* 작업 표시 */}
                  {jobsOnDate.map((job, jobIndex) => {
                    const isMyJob = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status);
                    const isPendingJob = job.status === 'pending';
                    
                    return (
                      <Box
                        key={job.id}
                        sx={{
                          mt: 0.5,
                          p: { xs: 0.25, sm: 0.5 },
                          backgroundColor: isMyJob ? (
                            job.status === 'completed' ? '#f5f5f5' : 
                            job.status === 'assigned' ? '#ffcc80' :
                            job.status === 'product_preparing' ? '#ffcc80' :
                            job.status === 'product_ready' ? '#a5d6a7' :
                            job.status === 'pickup_completed' ? '#90caf9' :
                            job.status === 'in_progress' ? '#90caf9' : '#fafafa'
                          ) : (
                            isPendingJob ? '#fff3e0' : '#fafafa' // 대기중인 작업은 연한 주황색
                          ),
                          border: isPendingJob ? '2px dashed #ff9800' : 'none', // 대기중인 작업은 점선 테두리
                          borderRadius: 1,
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: job.status === 'completed' ? 'normal' : 'bold',
                          cursor: isPendingJob ? 'pointer' : 'default',
                          '&:hover': isPendingJob ? {
                            backgroundColor: '#ffe0b2',
                            transform: 'scale(1.02)',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(255,152,0,0.3)'
                          } : {}
                        }}
                        onClick={isPendingJob ? () => handleDateClick(date) : undefined}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {isPendingJob ? '📋 ' : ''}{formatTime(job.scheduledDate)} {job.title}
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

      {/* 선택된 날짜의 작업 상세 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
                 <DialogTitle>
                   {selectedDate && (() => {
                     const pendingJobsOnDate = selectedJobs.filter(job => job.status === 'pending');
                     const myJobsOnDate = selectedJobs.filter(job => 
                       ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
                     );
                     
                     return (
                       <Box>
                         <Typography variant="h6">
                           {formatDate(selectedDate)} 작업 일정
                         </Typography>
                         <Box display="flex" gap={2} mt={1}>
                           <Chip 
                             label={`📋 수락 가능: ${pendingJobsOnDate.length}개`} 
                             color="warning" 
                             variant="outlined"
                             sx={{ fontWeight: 'bold' }}
                           />
                           <Chip 
                             label={`내 작업: ${myJobsOnDate.length}개`} 
                             color="primary" 
                             variant="outlined"
                             sx={{ fontWeight: 'bold' }}
                           />
                         </Box>
                       </Box>
                     );
                   })()}
                 </DialogTitle>
                 <DialogContent>
           {selectedJobs.length === 0 ? (
             <Box sx={{ textAlign: 'center', py: 4 }}>
               <Typography variant="h6" color="text.secondary" gutterBottom>
                 📅 해당 날짜에 예정된 작업이 없습니다
               </Typography>
               <Typography variant="body2" color="text.secondary">
                 다른 날짜를 확인하거나 새로운 작업을 기다려보세요
               </Typography>
             </Box>
           ) : (
             <List>
               {selectedJobs
                 .sort((a, b) => {
                   // 대기중인 작업을 먼저 표시
                   if (a.status === 'pending' && b.status !== 'pending') return -1;
                   if (a.status !== 'pending' && b.status === 'pending') return 1;
                   // 같은 상태 내에서는 시간순 정렬
                   return (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0);
                 })
                 .map((job, index) => {
                   const isMyJob = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status);
                   const isPendingJob = job.status === 'pending';
                   
                   return (
                     <React.Fragment key={job.id}>
                       <ListItem>
                         <Box sx={{ 
                           width: '100%',
                           backgroundColor: isMyJob ? (
                             job.status === 'completed' ? '#f5f5f5' : 
                             job.status === 'assigned' ? '#fff3e0' :
                             job.status === 'product_preparing' ? '#fff3e0' :
                             job.status === 'product_ready' ? '#e8f5e8' :
                             job.status === 'pickup_completed' ? '#e3f2fd' :
                             job.status === 'in_progress' ? '#e3f2fd' : '#fafafa'
                           ) : (
                             isPendingJob ? '#fff8e1' : '#fafafa' // 대기중인 작업은 연한 노란색
                           ),
                           p: 2,
                           borderRadius: 1,
                           border: isMyJob ? (
                             job.status === 'completed' ? '1px solid #9e9e9e' : 
                             job.status === 'assigned' ? '1px solid #ff9800' :
                             job.status === 'product_preparing' ? '1px solid #ff9800' :
                             job.status === 'product_ready' ? '1px solid #4caf50' :
                             job.status === 'pickup_completed' ? '1px solid #2196f3' :
                             job.status === 'in_progress' ? '1px solid #2196f3' : '1px solid #e0e0e0'
                           ) : (
                             isPendingJob ? '2px dashed #ff9800' : '1px solid #e0e0e0' // 대기중인 작업은 점선 테두리
                           )
                         }}>
                           <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                             <Typography variant="h6">
                               {isPendingJob ? '�� ' : ''}{job.title} - {calculateTotalPrice(job).toLocaleString()}원
                             </Typography>
                             <Box display="flex" gap={1}>
                               <Chip 
                                 label={isPendingJob ? '수락 가능' : getStatusText(job.status)} 
                                 color={isPendingJob ? 'warning' : getStatusColor(job.status)} 
                                 size="small" 
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
                           
                           <Box display="flex" gap={1} flexWrap="wrap">
                             {/* 대기중인 작업일 때 수락 버튼 */}
                             {isPendingJob && (
                               <Box sx={{ width: '100%', mb: 2 }}>
                                 <Typography variant="body2" color="warning.main" sx={{ mb: 1, fontWeight: 'bold' }}>
                                   💡 이 작업을 수락하시겠습니까?
                                 </Typography>
                                 <Button 
                                   variant="contained" 
                                   color="success"
                                   size="large"
                                   fullWidth
                                   sx={{ 
                                     fontSize: '1.2rem', 
                                     fontWeight: 'bold',
                                     py: 2,
                                     mb: 1,
                                     background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                                     boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)',
                                     animation: 'pulse 1.5s infinite',
                                     '@keyframes pulse': {
                                       '0%': {
                                         transform: 'scale(1)',
                                         boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)'
                                       },
                                       '50%': {
                                         transform: 'scale(1.02)',
                                         boxShadow: '0 6px 16px 2px rgba(76, 175, 80, .6)'
                                       },
                                       '100%': {
                                         transform: 'scale(1)',
                                         boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)'
                                       }
                                     },
                                     '&:hover': {
                                       background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                                       transform: 'scale(1.05)',
                                       transition: 'all 0.3s ease',
                                       boxShadow: '0 6px 20px 2px rgba(76, 175, 80, .6)'
                                     }
                                   }}
                                   onClick={() => handleAcceptJob(job.id)}
                                   startIcon={<CheckCircle sx={{ fontSize: '2rem' }} />}
                                 >
                                   ✅ 이 작업을 수락합니다!
                                 </Button>
                                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                                   수락하면 즉시 내 작업 목록에 추가됩니다
                                 </Typography>
                               </Box>
                             )}
                             
                             {/* 제품준비완료 상태일 때 픽업 버튼 */}
                             {job.status === 'product_ready' && (
                               <Button 
                                 variant="contained" 
                                 color="info" // Changed from success to info for visual distinction
                                 size="medium"
                                 fullWidth
                                 sx={{ 
                                   fontSize: '1rem', 
                                   fontWeight: 'bold',
                                   py: 1.5,
                                   mb: 1,
                                   background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                   boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                   animation: 'pulse 2s infinite',
                                   '@keyframes pulse': {
                                     '0%': {
                                       transform: 'scale(1)',
                                       boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                                     },
                                     '50%': {
                                       transform: 'scale(1.02)',
                                       boxShadow: '0 5px 15px 2px rgba(33, 203, 243, .5)'
                                     },
                                     '100%': {
                                       transform: 'scale(1)',
                                       boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                                     }
                                   },
                                   '&:hover': {
                                     background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                                     transform: 'scale(1.05)',
                                     transition: 'all 0.3s ease'
                                   }
                                 }}
                                 onClick={() => handleStartWork(job.id)}
                               >
                                 🚚 늦지않게 시공지로 이동후 이 버튼을 눌러주세요~^^
                               </Button>
                             )}
                             
                             {/* 진행중 상태일 때 시공완료 버튼 */}
                             {job.status === 'in_progress' && (
                               <Button 
                                 variant="contained" 
                                 color="success"
                                 size="medium"
                                 fullWidth
                                 sx={{ 
                                   fontSize: '1rem', 
                                   fontWeight: 'bold',
                                   py: 1.5,
                                   mb: 1,
                                   background: 'linear-gradient(45deg, #FF9800 30%, #FFB74D 90%)',
                                   boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                                   animation: 'glow 2s ease-in-out infinite alternate',
                                   '@keyframes glow': {
                                     '0%': {
                                       boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)'
                                     },
                                     '100%': {
                                       boxShadow: '0 5px 20px 2px rgba(255, 152, 0, .6)'
                                     }
                                   },
                                   '&:hover': {
                                     background: 'linear-gradient(45deg, #F57C00 30%, #FF9800 90%)',
                                     transform: 'scale(1.05)',
                                     transition: 'all 0.3s ease'
                                   }
                                 }}
                                 startIcon={<CheckCircle />}
                                 onClick={() => handleStartCompletion(job.id)}
                               >
                                 🏗️ 시공 완료 후 고객 서명 받기, 클릭!
                               </Button>
                             )}
                             
                             <Button 
                               variant="outlined" 
                               size="small"
                               onClick={() => handleJobDetail(job.id)}
                             >
                               상세보기
                             </Button>
                           </Box>
                         </Box>
                       </ListItem>
                       {index < selectedJobs.length - 1 && <Divider />}
                     </React.Fragment>
                   );
                 })}
              </List>
            )}
          </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarView;
