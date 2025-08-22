import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Paper,
  Snackbar
} from '@mui/material';
import { Schedule, LocationOn } from '@mui/icons-material';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface MyJobsCalendarViewProps {
  myJobs: ConstructionJob[];
}

const MyJobsCalendarView: React.FC<MyJobsCalendarViewProps> = ({ myJobs }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 총 금액 계산
  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 작업 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '📋 배정됨';
      case 'product_preparing': return '🔧 제품준비중';
      case 'product_ready': return '📦 제품준비완료';
      case 'pickup_completed': return '🚚 픽업완료';
      case 'in_progress': return '🏗️ 진행중';
      case 'completed': return '✅ 완료';
      default: return '알 수 없음';
    }
  };

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  // 날짜 포맷 (YYYY-MM-DD)
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 시간 포맷 (HH:mm)
  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '미정';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getMyJobsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return myJobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setDialogOpen(true);
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

  return (
    <Box>
      {/* 캘린더 헤더 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Button onClick={goToPreviousMonth}>
                이전
              </Button>
              <Typography variant="h5">
                {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
              </Typography>
              <Button onClick={goToNextMonth}>
                다음
              </Button>
            </Box>
            <Button
              variant="outlined"
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
            const myJobsOnDate = getMyJobsForDate(date);
            const isToday = formatDate(date) === formatDate(new Date());
            const dayOfWeek = date.getDay();
            
            return (
              <Grid item xs key={day}>
                <Box
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 80, sm: 120 },
                    height: myJobsOnDate.length > 2 ? 'auto' : { xs: 80, sm: 120 },
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
                  
                  {/* 내 작업 표시 */}
                  {myJobsOnDate.map((job, jobIndex) => (
                    <Box
                      key={job.id}
                      sx={{
                        mt: 0.5,
                        p: { xs: 0.25, sm: 0.5 },
                        backgroundColor: job.status === 'completed' ? '#f5f5f5' : 
                                         job.status === 'assigned' ? '#ffcc80' :
                                         job.status === 'product_preparing' ? '#ffcc80' :
                                         job.status === 'product_ready' ? '#a5d6a7' :
                                         job.status === 'pickup_completed' ? '#90caf9' :
                                         job.status === 'in_progress' ? '#90caf9' : '#fafafa',
                        borderRadius: 1,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: job.status === 'completed' ? 'normal' : 'bold'
                      }}
                    >
                                             <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                         {formatTime(job.scheduledDate)} {job.title.replace(/-\d{1,3}(,\d{3})*원$/, '')}
                       </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* 선택된 날짜의 작업 상세 다이얼로그 */}
      <Snackbar
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Card sx={{ maxWidth: 800, width: '100%' }}>
          <CardContent>
            {selectedDate && (() => {
              const myJobsOnDate = getMyJobsForDate(selectedDate);
              
              return (
                <Box>
                  {/* 다이얼로그 헤더 */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {formatDate(selectedDate)} 내 작업
                    </Typography>
                    <Chip 
                      label={`내 작업: ${myJobsOnDate.length}개`} 
                      color="primary" 
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  {myJobsOnDate.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        📅 해당 날짜에 예정된 작업이 없습니다
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        다른 날짜를 확인해보세요
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {/* 나의 작업 섹션 */}
                      <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        📅 나의 작업 ({myJobsOnDate.length}개)
                      </Typography>
                      {myJobsOnDate
                        .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
                        .map((job, index) => (
                          <Box key={`my-${job.id}`} sx={{ 
                            mb: 2, 
                            p: 2, 
                            border: job.status === 'completed' ? '1px solid #4caf50' : '1px solid #1976d2', 
                            borderRadius: 1, 
                            backgroundColor: job.status === 'completed' ? '#e8f5e8' : '#e3f2fd'
                          }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                             <Typography variant="h6" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#0d47a1' }}>
                                 {job.title.replace(/-\d{1,3}(,\d{3})*원$/, '')}
                               </Typography>
                              <Chip 
                                label={getStatusText(job.status)} 
                                sx={{ 
                                  backgroundColor: job.status === 'completed' ? '#4caf50' : 
                                                job.status === 'in_progress' ? '#ff9800' : 
                                                job.status === 'assigned' ? '#2196f3' : '#1976d2', 
                                  color: 'white' 
                                }}
                                size="small" 
                              />
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Schedule fontSize="small" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#1976d2' }} />
                              <Typography variant="body2" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#0d47a1' }}>
                                {job.scheduledDate && formatTime(job.scheduledDate)}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <LocationOn fontSize="small" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#1976d2' }} />
                              <Typography variant="body2" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#0d47a1' }}>
                                {job.address}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" sx={{ color: job.status === 'completed' ? '#2e7d32' : '#0d47a1' }} mb={2}>
                              총 금액: {calculateTotalPrice(job).toLocaleString()}원
                            </Typography>
                            
                            <Typography variant="body2" mb={2} sx={{ color: job.status === 'completed' ? '#2e7d32' : '#0d47a1' }}>
                              {job.description}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Button onClick={() => setDialogOpen(false)}>
                      닫기
                    </Button>
                  </Box>
                </Box>
              );
            })()}
          </CardContent>
        </Card>
      </Snackbar>
    </Box>
  );
};

export default MyJobsCalendarView;
