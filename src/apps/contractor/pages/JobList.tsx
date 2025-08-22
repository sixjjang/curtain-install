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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import { Schedule, LocationOn, ExpandMore, ExpandLess, Cancel, AttachFile, Delete, Save, FolderOpen } from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { JobCancellationService } from '../../../shared/services/jobCancellationService';
import { ContractorService, PreferredRegion } from '../../../shared/services/contractorService';
import { ConstructionJob } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';


const JobList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };

  // 품목 정보 포맷팅 함수
  const formatItemsDescription = (job: ConstructionJob): string => {
    if (job.items && job.items.length > 0) {
      // 기본출장비 제외하고 품목만 표시
      const nonTravelItems = job.items.filter(item => item.name !== '기본출장비');
      if (nonTravelItems.length > 0) {
        return nonTravelItems.map(item => `${item.name} ${item.quantity}${item.name.includes('커튼') ? '조' : item.name.includes('블라인드') ? '창' : '개'}`).join(', ');
      }
    }
    return '';
  };

  // 설명에서 아파트명 제거하는 함수
  const formatDescription = (description: string): string => {
    // 아파트명 패턴 제거 (예: "소래포구 아파트", "역삼동 456" 등)
    return description
      .replace(/\b\d+동\s*\d+호\b/g, '') // 동호수 제거
      .replace(/\b[가-힣]+동\s*\d+호\b/g, '') // 한글동+호수 제거
      .replace(/\b[가-힣]+아파트\b/g, '') // 아파트명 제거
      .replace(/\b[가-힣]+동\s*\d+\b/g, '') // 한글동+숫자 제거
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .trim();
  };

  // 주소 정규화 함수
  const normalizeAddress = (address: string): { region: string; district: string } => {
    // 주소에서 지역과 구/군 추출
    const addressParts = address.split(' ');
    
    if (addressParts.length >= 2) {
      let region = addressParts[0];
      let district = addressParts[1];
      
      // 주소 정규화
      if (region === '서울시' || region === '서울') {
        region = '서울특별시';
      } else if (region === '부산시' || region === '부산') {
        region = '부산광역시';
      } else if (region === '대구시' || region === '대구') {
        region = '대구광역시';
      } else if (region === '인천시' || region === '인천') {
        region = '인천광역시';
      } else if (region === '광주시' || region === '광주') {
        region = '광주광역시';
      } else if (region === '대전시' || region === '대전') {
        region = '대전광역시';
      } else if (region === '울산시' || region === '울산') {
        region = '울산광역시';
      }
      
      return { region, district };
    }
    
    return { region: '', district: '' };
  };

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
  const [viewMode, setViewMode] = useState<'list'>('list');
  const [regionFilterExpanded, setRegionFilterExpanded] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 선호 지역 관련 상태
  const [preferredRegions, setPreferredRegions] = useState<PreferredRegion[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveRegionName, setSaveRegionName] = useState('');
  const [showLoadDialog, setShowLoadDialog] = useState(false);

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
  const regionData: { [key: string]: string[] } = {
    '서울특별시': ['강남구', '서초구', '마포구', '송파구', '영등포구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '강서구', '구로구', '금천구', '동작구', '관악구'],
    '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양군', '연천군', '가평군'],
    '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
    '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
    '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
    '세종특별자치시': ['세종특별자치시'],
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
      
      // 선호 지역 불러오기
      const preferredRegionsData = await ContractorService.getPreferredRegions(user.id);
      setPreferredRegions(preferredRegionsData);
      
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

  // 선호 지역 저장
  const handleSavePreferredRegion = async () => {
    if (!user?.id || !saveRegionName.trim()) return;
    
    try {
      await ContractorService.savePreferredRegion(user.id, saveRegionName.trim(), regionFilter);
      setSnackbar({
        open: true,
        message: '선호 지역이 저장되었습니다!',
        severity: 'success'
      });
      setShowSaveDialog(false);
      setSaveRegionName('');
      await loadData(); // 선호 지역 목록 새로고침
    } catch (error) {
      console.error('선호 지역 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '선호 지역 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 선호 지역 불러오기
  const handleLoadPreferredRegion = (regions: string[]) => {
    setRegionFilter(regions);
    setShowLoadDialog(false);
    setSnackbar({
      open: true,
      message: '선호 지역이 적용되었습니다!',
      severity: 'success'
    });
  };

  // 선호 지역 삭제
  const handleDeletePreferredRegion = async (regionId: string) => {
    try {
      await ContractorService.deletePreferredRegion(regionId);
      setSnackbar({
        open: true,
        message: '선호 지역이 삭제되었습니다.',
        severity: 'success'
      });
      await loadData(); // 선호 지역 목록 새로고침
    } catch (error) {
      console.error('선호 지역 삭제 실패:', error);
      setSnackbar({
        open: true,
        message: '선호 지역 삭제에 실패했습니다.',
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
    
    console.log('🔍 지역 필터:', regionFilter);
    console.log('🔍 대기중인 작업들:', pendingJobs.map(job => ({ title: job.title, address: job.address })));
    
    // 지역 필터 적용
    const filteredJobs = pendingJobs.filter(job => {
      const { region, district } = normalizeAddress(job.address);
      
      if (region && district) {
        const regionDistrict = `${region} ${district}`;
        
        console.log(`🔍 작업 "${job.title}": ${region} ${district} (원본: ${job.address})`);
        
        // 정확한 지역-구 매칭 확인
        if (regionFilter.includes(regionDistrict)) {
          console.log(`✅ 정확한 매칭: ${regionDistrict}`);
          return true;
        }
        
        // "전체" 선택 확인 (예: "서울특별시 전체")
        const fullRegionFilter = regionFilter.find(filter => filter.includes('전체'));
        if (fullRegionFilter) {
          const fullRegion = fullRegionFilter.replace(' 전체', '');
          console.log(`🔍 전체 지역 확인: ${fullRegion}`);
          if (region === fullRegion) {
            // 해당 지역의 모든 구/군 목록 가져오기
            const allDistricts = regionData[fullRegion] || [];
            console.log(`🔍 해당 지역의 모든 구/군:`, allDistricts);
            // 현재 작업의 구가 해당 지역에 포함되는지 확인
            if (allDistricts.includes(district)) {
              console.log(`✅ 전체 지역 매칭: ${region} ${district}`);
              return true;
            }
          }
        }
        
        console.log(`❌ 매칭 실패: ${regionDistrict}`);
        return false;
      }
      return false;
    });
    
    console.log('🔍 필터링 결과:', filteredJobs.length, '개 작업');
    return filteredJobs;
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



  // 목록 뷰 모드
  const filteredJobs = getFilteredJobs();
  const jobsByRegion = getJobsByRegion();
                
                return (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                        시공건 찾기
                      </Typography>
                    </Box>
                    
                    {/* 지역 필터 */}
                    <Card sx={{ mb: 2 }}>
         <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
               <Box 
                 display="flex" 
                 alignItems="center" 
                 gap={1}
                 onClick={() => setRegionFilterExpanded(!regionFilterExpanded)}
                 sx={{ 
                   cursor: 'pointer',
                   '&:hover': {
                     opacity: 0.8
                   }
                 }}
               >
                 <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                   지역 필터
                 </Typography>
                 <Typography 
                   variant="body2" 
                   color="textSecondary" 
                   sx={{ 
                     fontSize: { xs: '0.75rem', sm: '0.875rem' },
                     fontStyle: 'italic'
                   }}
                 >
                   {regionFilter.length > 0 
                     ? (() => {
                         // 선택된 지역들을 대분류별로 그룹화
                         const groupedRegions: { [key: string]: string[] } = {};
                         regionFilter.forEach(regionDistrict => {
                           const parts = regionDistrict.split(' ');
                           if (parts.length >= 2) {
                             const region = parts[0];
                             const district = parts.slice(1).join(' ');
                             if (!groupedRegions[region]) {
                               groupedRegions[region] = [];
                             }
                             groupedRegions[region].push(district);
                           }
                         });
                         
                         // 대분류별로 정렬된 문자열 생성 (전체 선택 여부 확인)
                         return Object.entries(groupedRegions)
                           .map(([region, districts]) => {
                             // 해당 지역의 모든 구/군 목록 가져오기
                             const allDistricts = regionData[region] || [];
                             
                             // 모든 구/군이 선택되었는지 확인
                             const allSelected = allDistricts.every((district: string) => 
                               groupedRegions[region].includes(district)
                             );
                             
                             if (allSelected && allDistricts.length > 0) {
                               return `${region} 전체`;
                             } else {
                               return `${region} ${districts.join(', ')}`;
                             }
                           })
                           .join(', ');
                       })()
                     : '원하는 지역을 선택하세요'
                   }
                 </Typography>
               </Box>
               <Box display="flex" gap={1}>
                 {/* 선호 지역 저장 버튼 */}
                 {regionFilter.length > 0 && (
                   <Button
                     size="small"
                     variant="outlined"
                     onClick={() => setShowSaveDialog(true)}
                     sx={{ 
                       minWidth: 'auto', 
                       p: { xs: 0.5, sm: 1 },
                       fontSize: { xs: '0.75rem', sm: '0.875rem' }
                     }}
                   >
                     저장
                   </Button>
                 )}
                 
                 {/* 선호 지역 불러오기 버튼 */}
                 {preferredRegions.length > 0 && (
                   <Button
                     size="small"
                     variant="outlined"
                     onClick={() => setShowLoadDialog(true)}
                     sx={{ 
                       minWidth: 'auto', 
                       p: { xs: 0.5, sm: 1 },
                       fontSize: { xs: '0.75rem', sm: '0.875rem' }
                     }}
                   >
                     불러오기
                   </Button>
                 )}
                 
                 <Button
                   size="small"
                   onClick={() => setRegionFilterExpanded(!regionFilterExpanded)}
                   sx={{ minWidth: 'auto', p: { xs: 0.5, sm: 1 } }}
                 >
                   {regionFilterExpanded ? <ExpandLess /> : <ExpandMore />}
                 </Button>
               </Box>
             </Box>
            
                         <Collapse in={regionFilterExpanded}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {Object.entries(regionData).map(([region, districts]) => (
                <Grid item xs={12} sm={6} md={4} key={region}>
                  <Card variant="outlined" sx={{ 
                    '& .MuiCardContent-root': { 
                      p: { xs: 1, sm: 1.5 } 
                    } 
                  }}>
                    <CardContent>
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        mb={0.5}
                      >
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          gap={1}
                          onClick={() => toggleRegion(region)}
                          sx={{ 
                            cursor: 'pointer',
                            flex: 1,
                            '&:hover': {
                              opacity: 0.8
                            }
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' } 
                          }}>
                            {region}
                          </Typography>
                        </Box>
                        
                        {/* 전체 선택 체크박스 */}
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={(() => {
                                const regionDistricts = districts.map(district => `${region} ${district}`);
                                return regionDistricts.every(district => regionFilter.includes(district));
                              })()}
                              indeterminate={(() => {
                                const regionDistricts = districts.map(district => `${region} ${district}`);
                                const selectedCount = regionDistricts.filter(district => regionFilter.includes(district)).length;
                                return selectedCount > 0 && selectedCount < regionDistricts.length;
                              })()}
                              onChange={(e) => {
                                e.stopPropagation();
                                const regionDistricts = districts.map(district => `${region} ${district}`);
                                const allSelected = regionDistricts.every(district => regionFilter.includes(district));
                                
                                if (allSelected) {
                                  // 모든 지역 해제
                                  setRegionFilter(prev => prev.filter(item => !regionDistricts.includes(item)));
                                } else {
                                  // 모든 지역 선택
                                  const newFilter = [...regionFilter];
                                  regionDistricts.forEach(district => {
                                    if (!newFilter.includes(district)) {
                                      newFilter.push(district);
                                    }
                                  });
                                  setRegionFilter(newFilter);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: { xs: 0.25, sm: 0.5 } }}
                            />
                          }
                          label="전체"
                          sx={{ 
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }
                          }}
                        />
                        
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRegion(region);
                            }}
                            sx={{ minWidth: 'auto', p: { xs: 0.25, sm: 0.5 } }}
                          >
                            {expandedRegions.includes(region) ? <ExpandLess /> : <ExpandMore />}
                          </Button>
                        </Box>
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                          {expandedRegions.includes(region) ? <ExpandLess /> : <ExpandMore />}
                        </Box>
                      </Box>
               
                      <Collapse in={expandedRegions.includes(region)}>
                        <Box>
                          <Grid container spacing={0.5}>
                            {districts.map(district => {
                              const regionDistrict = `${region} ${district}`;
                              const isSelected = regionFilter.includes(regionDistrict);
                   
                    return (
                          <Grid item xs={6} sm={4} md={3} key={district}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={isSelected}
                                  onChange={() => toggleRegionFilter(regionDistrict)}
                                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  lineHeight: { xs: 1.2, sm: 1.4 }
                                }}>
                                  {district}
                                </Typography>
                              }
                              sx={{ 
                                m: 0, 
                                py: { xs: 0.25, sm: 0.5 },
                                '& .MuiFormControlLabel-label': {
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }
                              }}
                            />
                          </Grid>
                    );
                              })}
                          </Grid>
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
      <Grid container spacing={{ xs: 1, sm: 2, md: 2 }}>
        {filteredJobs.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" textAlign="center" color="textSecondary" py={{ xs: 3, sm: 4 }}>
                  {regionFilter.length > 0 ? '선택한 지역에 작업이 없습니다.' : '등록된 작업이 없습니다.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredJobs.map((job) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={job.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ 
                  p: { xs: 1, sm: 1.5 },
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* 헤더 영역 */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 'bold',
                        lineHeight: 1.2,
                        flex: 1,
                        mr: 1
                      }}
                      noWrap
                    >
                      {job.title}
                    </Typography>
                    <Chip 
                      label={getStatusText(job.status)} 
                      color={getStatusColor(job.status)} 
                      size="small"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  </Box>
                  
                  {/* 품목 정보 */}
                  {formatItemsDescription(job) && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      mb={1} 
                      sx={{ 
                        fontSize: '0.8rem',
                        lineHeight: 1.3,
                        wordBreak: 'break-all'
                      }}
                    >
                      {formatItemsDescription(job)}
                    </Typography>
                  )}
                  
                  {/* 설명 (아파트명 제거) */}
                  {formatDescription(job.description) && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      mb={1} 
                      sx={{ 
                        fontSize: '0.75rem',
                        lineHeight: 1.3,
                        fontStyle: 'italic'
                      }}
                    >
                      {formatDescription(job.description)}
                    </Typography>
                  )}
                  
                  {/* 예산 정보 */}
                  <Box sx={{ flexGrow: 1, mb: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography 
                        variant="caption" 
                        color="primary"
                        sx={{ 
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        예산: {job.finalAmount 
                          ? `${job.finalAmount.toLocaleString()}원` 
                          : calculateTotalBudget(job) > 0 
                            ? `${calculateTotalBudget(job).toLocaleString()}원`
                            : '예산 미정'
                        }
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* 버튼 영역 */}
                  <Box sx={{ mt: 'auto' }}>
                    {job.status === 'pending' && (
                      <Button 
                        variant="contained" 
                        color="primary"
                        size="small"
                        fullWidth
                        onClick={() => handleAcceptJob(job.id)}
                        sx={{ 
                          fontSize: '0.8rem',
                          py: 0.5
                        }}
                      >
                        작업 수락
                      </Button>
                    )}
                    
                    {job.status === 'assigned' && job.contractorId === user?.id && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        size="small"
                        fullWidth
                        startIcon={<Cancel sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => handleCancelJobClick(job)}
                        sx={{ 
                          fontSize: '0.8rem',
                          py: 0.5
                        }}
                      >
                        작업 취소
                      </Button>
                    )}
                  </Box>
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

      {/* 선호 지역 저장 다이얼로그 */}
      <Dialog 
        open={showSaveDialog} 
        onClose={() => setShowSaveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Save />
            선호 지역 저장
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            현재 선택된 지역을 선호 지역으로 저장합니다.
          </Typography>
          <TextField
            fullWidth
            label="선호 지역 이름"
            value={saveRegionName}
            onChange={(e) => setSaveRegionName(e.target.value)}
            placeholder="예: 서울 강남구, 서초구"
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="textSecondary">
            선택된 지역: {regionFilter.join(', ')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={handleSavePreferredRegion}
            variant="contained"
            disabled={!saveRegionName.trim()}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 선호 지역 불러오기 다이얼로그 */}
      <Dialog 
        open={showLoadDialog} 
        onClose={() => setShowLoadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <FolderOpen />
            선호 지역 불러오기
          </Box>
        </DialogTitle>
        <DialogContent>
          {preferredRegions.length === 0 ? (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={3}>
              저장된 선호 지역이 없습니다.
            </Typography>
          ) : (
            <List>
              {preferredRegions.map((preferredRegion) => (
                <ListItem 
                  key={preferredRegion.id}
                  sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 1, 
                    mb: 1,
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                >
                                   <ListItemText
                   primary={
                     <Box display="flex" justifyContent="space-between" alignItems="center">
                       <Typography variant="body1" fontWeight="bold">
                         {preferredRegion.name}
                       </Typography>
                       <Box display="flex" gap={1}>
                         <Button
                           size="small"
                           variant="outlined"
                           onClick={() => handleLoadPreferredRegion(preferredRegion.regions)}
                         >
                           불러오기
                         </Button>
                         <IconButton
                           size="small"
                           onClick={() => handleDeletePreferredRegion(preferredRegion.id)}
                           color="error"
                         >
                           <Delete />
                         </IconButton>
                       </Box>
                     </Box>
                   }
                   secondary={(() => {
                     // 선택된 지역들을 대분류별로 그룹화
                     const groupedRegions: { [key: string]: string[] } = {};
                     preferredRegion.regions.forEach(regionDistrict => {
                       const parts = regionDistrict.split(' ');
                       if (parts.length >= 2) {
                         const region = parts[0];
                         const district = parts.slice(1).join(' ');
                         if (!groupedRegions[region]) {
                           groupedRegions[region] = [];
                         }
                         groupedRegions[region].push(district);
                       }
                     });
                     
                     // 대분류별로 정렬된 문자열 생성 (전체 선택 여부 확인)
                     return Object.entries(groupedRegions)
                       .map(([region, districts]) => {
                         // 해당 지역의 모든 구/군 목록 가져오기
                         const allDistricts = regionData[region] || [];
                         
                         // 모든 구/군이 선택되었는지 확인
                         const allSelected = allDistricts.every((district: string) => 
                           groupedRegions[region].includes(district)
                         );
                         
                         if (allSelected && allDistricts.length > 0) {
                           return `${region} 전체`;
                         } else {
                           return `${region} ${districts.join(', ')}`;
                         }
                       })
                       .join(', ');
                   })()}
                   secondaryTypographyProps={{ fontSize: '0.875rem' }}
                 />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobList;
