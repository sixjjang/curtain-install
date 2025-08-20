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

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 주소를 구/동까지만 표시하는 함수
  const formatAddressForCard = (address: string): string => {
    // 서울시 강남구 테헤란로 123 -> 강남구 테헤란로
    // 부산시 해운대구 해운대로 456 -> 해운대구 해운대로
    // 경기도 수원시 영통구 영통동 789 -> 영통구 영통동
    const parts = address.split(' ');
    
    if (parts.length >= 4) {
      // 시/도, 시, 구/군, 동/도로명까지 포함 (예: 경기도 수원시 영통구 영통동)
      return parts.slice(2, 4).join(' ');
    } else if (parts.length >= 3) {
      // 시/도, 구/군, 도로명/동까지 포함 (예: 서울시 강남구 테헤란로)
      return parts.slice(1, 3).join(' ');
    } else if (parts.length >= 2) {
      // 구/군, 도로명/동까지만
      return parts.slice(1).join(' ');
    }
    
    return address; // 파싱 실패 시 원본 반환
  };
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [myJobs, setMyJobs] = useState<ConstructionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<ConstructionJob[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
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
    '제주특별자치도': ['제주특별자치도']
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const allJobs = await JobService.getAllJobs();
        
        // 작업이 없으면 테스트 데이터 생성
        if (allJobs.length === 0) {
          console.log('작업이 없습니다. 테스트 데이터를 생성합니다...');
          await JobService.createTestJobs();
          const updatedJobs = await JobService.getAllJobs();
          setJobs(updatedJobs);
        } else {
          setJobs(allJobs);
        }
        
        // 디버깅용 로그
        const pendingJobs = allJobs.filter(job => job.status === 'pending');
        console.log(`전체 작업: ${allJobs.length}개, 대기중인 작업: ${pendingJobs.length}개`);
        if (pendingJobs.length > 0) {
          console.log('대기중인 작업들:', pendingJobs);
        }

        // 나의 작업 (배정됨, 진행중, 완료) - 현재 로그인한 시공자만
        const myJobs = allJobs.filter(job => {
          const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'cancelled', 'product_not_ready', 'customer_absent', 'schedule_changed'].includes(job.status);
          const contractorMatch = job.contractorId === user?.id;
          return statusMatch && contractorMatch;
        });
        setMyJobs(myJobs);
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
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'product_not_ready': return 'error';
      case 'customer_absent': return 'error';
      case 'schedule_changed': return 'warning';
      default: return 'default';
    }
  };

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
      case 'product_not_ready': return '제품 미준비';
      case 'customer_absent': return '소비자 부재';
      case 'schedule_changed': return '일정 변경';
      default: return '알 수 없음';
    }
  };



  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return '미정';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '미정';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
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

  const handleJobDetail = (jobId: string) => {
    navigate(`/contractor/jobs/${jobId}`);
  };

  // 작업 수락 기능
  const handleAcceptJob = async (jobId: string) => {
    try {
      // 작업 상태를 'assigned'로 업데이트하고 현재 시공자 ID 설정
      await JobService.updateJobStatus(jobId, 'assigned', user?.id);
      
      // 성공 메시지 표시
      setSnackbar({
        open: true,
        message: '🎉 작업이 성공적으로 수락되었습니다!\n\n이제 내 작업 목록에서 확인할 수 있습니다.',
        severity: 'success'
      });
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      setJobs(updatedJobs);
      
      // 나의 작업도 새로고침 (현재 로그인한 시공자만)
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'cancelled', 'product_not_ready', 'customer_absent', 'schedule_changed'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setMyJobs(myJobs);
      
    } catch (error) {
      console.error('작업 수락 실패:', error);
      setSnackbar({
        open: true,
        message: '작업 수락에 실패했습니다. 다시 시도해주세요.',
        severity: 'error'
      });
    }
  };

  // 작업 취소 확인 다이얼로그 열기
  const handleCancelJobClick = async (job: ConstructionJob) => {
    if (!user?.id) return;
    
    try {
      // 취소 가능 여부 확인
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
      
      // 성공 메시지 표시
      const message = `작업이 성공적으로 취소되었습니다.\n\n취소 정보:\n• ${cancellationInfo.cancellationNumber}번째 취소\n• 오늘 ${cancellationInfo.totalCancellationsToday}회 취소 (최대 ${cancellationInfo.maxDailyCancellations}회)`;
      
      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });
      
      // 다이얼로그 닫기
      setCancelDialogOpen(false);
      setSelectedJobForCancel(null);
      setCancelReason('');
      setCancellationInfo(null);
      
      // 작업 목록 새로고침
      const updatedJobs = await JobService.getAllJobs();
      setJobs(updatedJobs);
      
      // 나의 작업도 새로고침
      const myJobs = updatedJobs.filter(job => {
        const statusMatch = ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'cancelled', 'product_not_ready', 'customer_absent', 'schedule_changed'].includes(job.status);
        const contractorMatch = job.contractorId === user?.id;
        return statusMatch && contractorMatch;
      });
      setMyJobs(myJobs);
      
    } catch (error) {
      console.error('작업 취소 실패:', error);
      setSnackbar({
        open: true,
        message: `작업 취소에 실패했습니다: ${(error as Error).message}`,
        severity: 'error'
      });
    }
  };

  // 나의 작업과 시간이 겹치는지 확인
  const hasTimeConflict = (jobDate: Date | null | undefined, jobTime: string) => {
    if (!jobDate) return false;
    
    const jobDateTime = new Date(jobDate);
    const [hours, minutes] = jobTime.split(':').map(Number);
    jobDateTime.setHours(hours, minutes, 0, 0);

    return myJobs.some(myJob => {
      if (!myJob.scheduledDate) return false;
      
      const myJobDateTime = new Date(myJob.scheduledDate);
      const timeDiff = Math.abs(jobDateTime.getTime() - myJobDateTime.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // 2시간 이내의 작업은 겹치는 것으로 간주
      return hoursDiff < 2;
    });
  };

  const filteredJobs = jobs.filter(job => {
    // 대기중인 작업만 표시
    const matchesStatus = job.status === 'pending';
    
    // 지역 필터 (복수 선택 지원)
    const matchesRegion = regionFilter.length === 0 || 
      regionFilter.some(region => 
        job.address.includes(region) || 
        (region.includes('시') && job.address.includes(region.replace('시', ''))) ||
        (region.includes('구') && job.address.includes(region)) ||
        (region.includes('군') && job.address.includes(region))
      );
    
    return matchesStatus && matchesRegion;
  });

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

  const getJobsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    // 캘린더에서는 모든 대기중인 작업을 표시 (지역 필터 무시)
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    
    console.log(`날짜 ${dateStr}에 대한 대기중인 작업 필터링:`, pendingJobs.map(job => ({
      id: job.id,
      title: job.title,
      scheduledDate: job.scheduledDate,
      scheduledDateType: typeof job.scheduledDate,
      formattedDate: job.scheduledDate ? formatDate(job.scheduledDate) : 'null'
    })));
    
    const jobsOnDate = pendingJobs.filter(job => {
      if (!job.scheduledDate) return false;
      
      // scheduledDate가 문자열인 경우 Date 객체로 변환
      let jobDate = job.scheduledDate;
      if (typeof jobDate === 'string') {
        jobDate = new Date(jobDate);
      }
      
      const jobDateStr = formatDate(jobDate);
      const matches = jobDateStr === dateStr;
      
      if (matches) {
        console.log(`작업 ${job.title}이 날짜 ${dateStr}와 매칭됨`);
      }
      
      return matches;
    });
    
    // 중복 제거 (같은 ID의 작업은 하나만 표시)
    const uniqueJobs = jobsOnDate.filter((job, index, self) => 
      index === self.findIndex(j => j.id === job.id)
    );
    
    // 디버깅용 로그
    if (uniqueJobs.length > 0) {
      console.log(`getJobsForDate(${dateStr}): ${uniqueJobs.length}개 작업 발견`, uniqueJobs);
    }
    
    return uniqueJobs;
  };

  // 나의 작업 가져오기 (해당 날짜)
  const getMyJobsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return myJobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    // 캘린더에서는 모든 대기중인 작업을 표시 (지역 필터 무시)
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    const jobsOnDate = pendingJobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
    
    setSelectedDate(date);
    setSelectedJobs(jobsOnDate);
    setDialogOpen(true);
  };

  // 나의 작업과 시공찾기 작업을 구분해서 가져오기
  const getJobsForDialog = (date: Date) => {
    const dateStr = formatDate(date);
    const myJobsOnDate = myJobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
    
    const availableJobsOnDate = filteredJobs.filter(job => {
      if (!job.scheduledDate) return false;
      return formatDate(job.scheduledDate) === dateStr;
    });
    
    return { myJobsOnDate, availableJobsOnDate };
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          시공 찾기
        </Typography>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  // 캘린더 뷰 모드일 때
  if (viewMode === 'calendar') {
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];

    // 대기중인 작업과 내 작업 개수 계산
    const pendingJobs = jobs.filter(job => job.status === 'pending');
    const myJobsCount = myJobs.length;

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            시공 찾기 - 캘린더 보기
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setViewMode('list')}
          >
            목록 보기
          </Button>
        </Box>

        {/* 대기중인 작업 요약 정보 */}
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%)', border: '2px solid #ff9800' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold', mb: 1 }}>
                  📋 수락 가능한 작업 현황
                </Typography>
                <Typography variant="body1" sx={{ color: '#bf360c' }}>
                  대기중인 작업: <strong>{pendingJobs.length}개</strong> | 
                  내 작업: <strong>{myJobsCount}개</strong>
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
              const myJobsOnDate = getMyJobsForDate(date);
              const isToday = formatDate(date) === formatDate(new Date());
              const dayOfWeek = date.getDay();
              const pendingJobsOnDate = jobsOnDate; // getJobsForDate는 이미 대기중인 작업만 반환
              
              // 디버깅용 로그
              if (jobsOnDate.length > 0) {
                console.log(`${formatDate(date)}: 대기중인 작업 ${jobsOnDate.length}개`, jobsOnDate);
              }

              return (
                <Grid item xs key={day}>
                  <Box
                    sx={{
                      p: { xs: 0.5, sm: 1 },
                      minHeight: { xs: 80, sm: 120 },
                      height: (myJobsOnDate.length + jobsOnDate.filter(job => !hasTimeConflict(job.scheduledDate!, formatTime(job.scheduledDate!))).length) > 2 ? 'auto' : { xs: 80, sm: 120 },
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
                          {formatTime(job.scheduledDate)} {job.title}
                        </Typography>
                      </Box>
                    ))}
                    
                    {/* 대기중인 작업 표시 */}
                    {jobsOnDate
                      .filter(job => job.status === 'pending')
                      .map((job, jobIndex) => (
                        <Box
                          key={job.id}
                          sx={{
                            mt: 0.5,
                            p: { xs: 0.25, sm: 0.5 },
                            backgroundColor: '#fff3e0', // 대기중인 작업은 연한 주황색
                            border: '2px dashed #ff9800', // 대기중인 작업은 점선 테두리
                            borderRadius: 1,
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: '#ffe0b2',
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(255,152,0,0.3)'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 해당 작업만 선택하여 다이얼로그 열기
                            setSelectedDate(date);
                            setSelectedJobs([job]);
                            setDialogOpen(true);
                          }}
                        >
                          {/* 대기중 뱃지 */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              backgroundColor: '#ff5722',
                              color: 'white',
                              borderRadius: '50%',
                              width: 16,
                              height: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              zIndex: 2,
                              animation: 'pulse 1.5s infinite',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.1)' },
                                '100%': { transform: 'scale(1)' }
                              }
                            }}
                          >
                            📋
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', pr: 2 }}>
                            {formatTime(job.scheduledDate)} {job.title}
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
                const { myJobsOnDate, availableJobsOnDate } = getJobsForDialog(selectedDate);
                const totalJobs = myJobsOnDate.length + availableJobsOnDate.length;
                
                return (
                  <Box>
                    {/* 다이얼로그 헤더 */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {formatDate(selectedDate)} 작업 일정
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Chip 
                          label={`📋 수락 가능: ${availableJobsOnDate.length}개`} 
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
                    
                    {totalJobs === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          📅 해당 날짜에 예정된 작업이 없습니다
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          다른 날짜를 확인하거나 새로운 작업을 기다려보세요
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {/* 수락 가능한 작업 섹션 (먼저 표시) */}
                        {availableJobsOnDate.length > 0 && (
                          <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              📋 수락 가능한 작업 ({availableJobsOnDate.length}개)
                            </Typography>
                            {availableJobsOnDate
                              .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
                              .map((job, index) => {
                                const hasConflict = job.scheduledDate ? hasTimeConflict(job.scheduledDate, formatTime(job.scheduledDate)) : false;
                                
                                return (
                                  <Box key={job.id} sx={{ 
                                    mb: 3, 
                                    p: 3, 
                                    border: '2px dashed #ff9800', 
                                    borderRadius: 2, 
                                    backgroundColor: '#fff8e1',
                                    opacity: hasConflict ? 0.6 : 1,
                                    position: 'relative'
                                  }}>
                                    {hasConflict && (
                                      <Box sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}>
                                        ⚠️ 시간 겹침
                                      </Box>
                                    )}
                                    
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                      <Typography variant="h6" sx={{ color: '#e65100', fontWeight: 'bold' }}>
                                        📋 {job.title} - {calculateTotalPrice(job).toLocaleString()}원
                                      </Typography>
                                      <Chip 
                                        label="수락 가능" 
                                        color="warning" 
                                        size="small" 
                                        sx={{ fontWeight: 'bold' }}
                                      />
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
                                        {formatAddressForCard(job.address)}
                                      </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" color="textSecondary" mb={2}>
                                      총 금액: <strong>{calculateTotalPrice(job).toLocaleString()}원</strong>
                                    </Typography>
                                    
                                    <Typography variant="body2" mb={3}>
                                      {job.description}
                                    </Typography>
                                    
                                    <Box sx={{ width: '100%' }}>
                                      <Typography variant="body2" color="warning.main" sx={{ mb: 1, fontWeight: 'bold' }}>
                                        💡 이 작업을 수락하시겠습니까?
                                      </Typography>
                                      <Button 
                                        variant="contained" 
                                        color="success"
                                        size="large"
                                        fullWidth
                                        disabled={hasConflict}
                                        sx={{ 
                                          fontSize: '1.1rem', 
                                          fontWeight: 'bold',
                                          py: 1.5,
                                          mb: 1,
                                          background: hasConflict ? 'grey' : 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                                          boxShadow: hasConflict ? 'none' : '0 4px 8px 2px rgba(76, 175, 80, .4)',
                                          animation: hasConflict ? 'none' : 'pulse 1.5s infinite',
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
                                            background: hasConflict ? 'grey' : 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                                            transform: hasConflict ? 'none' : 'scale(1.05)',
                                            transition: 'all 0.3s ease',
                                            boxShadow: hasConflict ? 'none' : '0 6px 20px 2px rgba(76, 175, 80, .6)'
                                          }
                                        }}
                                        onClick={() => handleAcceptJob(job.id)}
                                      >
                                        ✅ 이 작업을 수락합니다!
                                      </Button>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                                        수락하면 즉시 내 작업 목록에 추가됩니다
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                          </Box>
                        )}
                        
                        {/* 나의 작업 섹션 */}
                        {myJobsOnDate.length > 0 && (
                          <Box>
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
                                      {job.title} - {calculateTotalPrice(job).toLocaleString()}원
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
                                  
                                  {/* 취소 버튼 (assigned 상태일 때만 표시) */}
                                  {job.status === 'assigned' && (
                                    <Box sx={{ mt: 2 }}>
                                      <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<Cancel />}
                                        onClick={() => handleCancelJobClick(job)}
                                        sx={{
                                          borderColor: '#f44336',
                                          color: '#f44336',
                                          '&:hover': {
                                            borderColor: '#d32f2f',
                                            backgroundColor: '#ffebee'
                                          }
                                        }}
                                      >
                                        작업 취소
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                          </Box>
                        )}
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
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          시공 찾기
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CalendarMonth />}
          onClick={() => setViewMode('calendar')}
        >
          캘린더 보기
        </Button>
      </Box>
      
             {/* 지역 필터 */}
       <Card sx={{ mb: 3 }}>
         <CardContent>
           <Box>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
               <Typography variant="subtitle2">
                 지역 선택 ({regionFilter.length}개 선택됨)
               </Typography>
               <Button
                 variant="text"
                 size="small"
                 onClick={() => setRegionFilterExpanded(!regionFilterExpanded)}
                 startIcon={regionFilterExpanded ? <ExpandLess /> : <ExpandMore />}
               >
                 {regionFilterExpanded ? '숨기기' : '보이기'}
               </Button>
             </Box>
            
                         <Collapse in={regionFilterExpanded}>
               {/* 전체 선택 버튼들 */}
               <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                 <Button
                   variant="outlined"
                   size="small"
                   onClick={() => {
                     const allCities = Object.values(regionData).flat();
                     setRegionFilter(allCities);
                   }}
                 >
                   전체 지역 선택
                 </Button>
                 <Button
                   variant="outlined"
                   size="small"
                   onClick={() => setRegionFilter([])}
                 >
                   전체 해제
                 </Button>
               </Box>
               
               <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
               {Object.entries(regionData).map(([region, cities]) => {
                 const isRegionSelected = cities.every(city => regionFilter.includes(city));
                 const isRegionPartiallySelected = cities.some(city => regionFilter.includes(city)) && !isRegionSelected;
                 
                 return (
                   <Box key={region} sx={{ mb: 2, border: '1px solid #f0f0f0', borderRadius: 1, p: 1 }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                       <Button
                         variant="text"
                         size="small"
                         onClick={() => {
                           setExpandedRegions(prev => 
                             prev.includes(region) 
                               ? prev.filter(r => r !== region)
                               : [...prev, region]
                           );
                         }}
                         sx={{ 
                           justifyContent: 'space-between', 
                           flexGrow: 1,
                           textAlign: 'left',
                           textTransform: 'none',
                           fontWeight: 'bold',
                           color: 'primary.main'
                         }}
                       >
                         {region}
                         {expandedRegions.includes(region) ? <ExpandLess /> : <ExpandMore />}
                       </Button>
                       
                       {/* 도/시 전체 선택 체크박스 */}
                       <FormControlLabel
                         control={
                           <Checkbox
                             size="small"
                             checked={isRegionSelected}
                             indeterminate={isRegionPartiallySelected}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 // 해당 지역의 모든 도시 선택
                                 const newFilter = [...regionFilter];
                                 cities.forEach(city => {
                                   if (!newFilter.includes(city)) {
                                     newFilter.push(city);
                                   }
                                 });
                                 setRegionFilter(newFilter);
                               } else {
                                 // 해당 지역의 모든 도시 해제
                                 setRegionFilter(prev => prev.filter(city => !cities.includes(city)));
                               }
                             }}
                           />
                         }
                         label=""
                         sx={{ m: 0 }}
                       />
                     </Box>
                     
                     <Collapse in={expandedRegions.includes(region)}>
                       <Box sx={{ ml: 1 }}>
                         <Grid container spacing={0.5}>
                           {cities.map((city) => (
                             <Grid item xs={12} sm={6} md={4} key={city}>
                               <FormControlLabel
                                 control={
                                   <Checkbox
                                     size="small"
                                     checked={regionFilter.includes(city)}
                                     onChange={(e) => {
                                       if (e.target.checked) {
                                         setRegionFilter(prev => [...prev, city]);
                                       } else {
                                         setRegionFilter(prev => prev.filter(r => r !== city));
                                       }
                                     }}
                                   />
                                 }
                                 label={
                                   <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                     {city}
                                   </Typography>
                                 }
                                 sx={{ 
                                   m: 0, 
                                   p: 0.5,
                                   borderRadius: 1,
                                   '&:hover': {
                                     backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                   }
                                 }}
                               />
                             </Grid>
                           ))}
                         </Grid>
                       </Box>
                     </Collapse>
                   </Box>
                 );
                                })}
               </Box>
             </Collapse>
           </Box>
         </CardContent>
       </Card>

      {/* 작업 목록 */}
      <Grid container spacing={2}>
        {filteredJobs.map((job) => {
          const hasConflict = job.scheduledDate ? hasTimeConflict(job.scheduledDate, formatTime(job.scheduledDate)) : false;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ opacity: hasConflict ? 0.6 : 1 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6">{job.title}</Typography>
                    <Box display="flex" gap={1}>
                      {hasConflict && (
                        <Chip 
                          label="시간 겹침" 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {job.status === 'pending' ? formatAddressForCard(job.address) : job.address}
                    </Typography>
                  </Box>

                  {job.scheduledDate && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Schedule fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        시공일시: {formatDateTime(job.scheduledDate)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    총 금액: {calculateTotalPrice(job).toLocaleString()}원
                  </Typography>
                  
                  <Typography variant="body2" mb={1}>
                    {job.description}
                  </Typography>
                  
                  {/* 작업지시서 파일 표시 */}
                  {job.workInstructions && job.workInstructions.length > 0 && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachFile fontSize="small" color="primary" />
                      <Typography variant="caption" color="primary">
                        작업지시서 {job.workInstructions.length}개 첨부
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip 
                      label={getStatusText(job.status)} 
                      color={getStatusColor(job.status)} 
                      size="small" 
                    />
                    <Box display="flex" gap={1}>
                      {job.status === 'pending' && (
                        <Button 
                          variant="contained" 
                          color="success"
                          size="small"
                          disabled={hasConflict}
                          onClick={() => handleAcceptJob(job.id)}
                        >
                          수락
                        </Button>
                      )}
                      {['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed', 'cancelled', 'product_not_ready', 'customer_absent', 'schedule_changed'].includes(job.status) && (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => navigate(`/contractor/chat/${job.id}`)}
                          >
                            채팅
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleJobDetail(job.id)}
                          >
                            상세보기
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredJobs.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            조건에 맞는 작업이 없습니다.
          </Typography>
        </Box>
      )}

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
