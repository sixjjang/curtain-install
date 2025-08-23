import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Rating,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Star, 
  Work, 
  LocationOn, 
  Search, 
  FilterList,
  Sort,
  Phone,
  Email,
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ContractorInfo } from '../../../types';

interface ContractorListItem extends ContractorInfo {
  id: string;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  lastActive?: Date;
  profileImage?: string;
}

const ContractorList: React.FC = () => {
  const { user } = useAuth();
  const [contractors, setContractors] = useState<ContractorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 시공자 데이터 불러오기
  useEffect(() => {
    const loadContractors = async () => {
      try {
        setLoading(true);
        
        // Firebase에서 시공자 데이터 가져오기
        const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
        const { db } = await import('../../../firebase/config');
        
        const contractorsRef = collection(db, 'users');
        const q = query(
          contractorsRef,
          where('role', '==', 'contractor'),
          orderBy('rating', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const contractorsData: ContractorListItem[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          contractorsData.push({
            id: doc.id,
            name: data.name || '이름 없음',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || { address: '주소 없음' },
            experience: data.experience || '경력 정보 없음',
            serviceAreas: data.serviceAreas || [],
            level: data.level || 1,
            rating: data.rating || 0,
            totalJobs: data.totalJobs || 0,
            completedJobs: data.completedJobs || 0,
            hourlyRate: data.hourlyRate || 15000,
            isAvailable: data.isAvailable !== false,
            lastActive: data.lastActive?.toDate() || new Date(),
            profileImage: data.profileImage || '',
            bankName: data.bankName || '',
            bankAccount: data.bankAccount || '',
            accountHolder: data.accountHolder || '',
            totalEarnings: data.totalEarnings || 0,
            points: data.points || 0
          });
        });
        
        setContractors(contractorsData);
      } catch (error) {
        console.error('시공자 목록 불러오기 실패:', error);
        setSnackbar({
          open: true,
          message: '시공자 목록을 불러올 수 없습니다.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadContractors();
  }, []);

  // 필터링 및 정렬된 시공자 목록
  const filteredAndSortedContractors = contractors
    .filter(contractor => {
      const matchesSearch = contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (contractor.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           contractor.experience.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || 
                             (contractor.location?.address || '').includes(locationFilter) ||
                             contractor.serviceAreas.some(area => area.includes(locationFilter));
      
      return matchesSearch && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.totalJobs - a.totalJobs;
        case 'hourlyRate':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case 'recent':
          return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
        default:
          return 0;
      }
    });

  // 시공 의뢰 처리
  const handleRequestContractor = async (contractorId: string, contractorName: string) => {
    try {
      // 여기에 시공 의뢰 로직 추가
      setSnackbar({
        open: true,
        message: `${contractorName} 시공자에게 의뢰 요청을 보냈습니다.`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: '시공 의뢰 요청에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 레벨에 따른 칩 색상
  const getLevelColor = (level: number) => {
    if (level >= 5) return 'error'; // 마스터
    if (level >= 3) return 'warning'; // 시니어
    return 'primary'; // 주니어
  };

  // 레벨에 따른 텍스트
  const getLevelText = (level: number) => {
    if (level >= 5) return '마스터 시공자';
    if (level >= 3) return '시니어 시공자';
    return '주니어 시공자';
  };

  // 마지막 활동 시간 표시
  const getLastActiveText = (lastActive: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
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
      <Typography variant="body2" color="textSecondary" mb={3}>
        총 {filteredAndSortedContractors.length}명의 시공자가 있습니다.
      </Typography>

      {/* 검색 및 필터 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="시공자 이름, 지역, 경력으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>지역 필터</InputLabel>
              <Select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                label="지역 필터"
              >
                <MenuItem value="">전체 지역</MenuItem>
                <MenuItem value="서울">서울</MenuItem>
                <MenuItem value="부산">부산</MenuItem>
                <MenuItem value="대구">대구</MenuItem>
                <MenuItem value="인천">인천</MenuItem>
                <MenuItem value="광주">광주</MenuItem>
                <MenuItem value="대전">대전</MenuItem>
                <MenuItem value="울산">울산</MenuItem>
                <MenuItem value="경기">경기</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>정렬 기준</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="정렬 기준"
              >
                <MenuItem value="rating">평점순</MenuItem>
                <MenuItem value="experience">경험순</MenuItem>
                <MenuItem value="hourlyRate">시급순</MenuItem>
                <MenuItem value="recent">최근 활동순</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* 시공자 목록 */}
      <Grid container spacing={3}>
        {filteredAndSortedContractors.length > 0 ? (
          filteredAndSortedContractors.map((contractor) => (
            <Grid item xs={12} md={6} lg={4} key={contractor.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* 헤더 */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      sx={{ mr: 2, width: 56, height: 56 }}
                      src={contractor.profileImage}
                    >
                      {contractor.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {contractor.name}
                      </Typography>
                      <Chip 
                        label={`Lv.${contractor.level} ${getLevelText(contractor.level)}`} 
                        color={getLevelColor(contractor.level)} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={contractor.isAvailable ? '활동중' : '비활동'} 
                        color={contractor.isAvailable ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                  </Box>

                  {/* 평점 및 경험 */}
                  <Box display="flex" alignItems="center" mb={1}>
                    <Rating value={contractor.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {contractor.rating.toFixed(1)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Work color="action" sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      총 {contractor.totalJobs}건 • 완료 {contractor.completedJobs}건
                    </Typography>
                  </Box>

                  {/* 지역 및 시급 */}
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn color="action" sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      {contractor.location?.address || '주소 정보 없음'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    시급: {contractor.hourlyRate?.toLocaleString()}원
                  </Typography>

                  {/* 경력 */}
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    경력: {contractor.experience}
                  </Typography>

                  {/* 서비스 지역 */}
                  {contractor.serviceAreas.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        서비스 지역:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {contractor.serviceAreas.slice(0, 3).map((area, index) => (
                          <Chip key={index} label={area} size="small" variant="outlined" />
                        ))}
                        {contractor.serviceAreas.length > 3 && (
                          <Chip label={`+${contractor.serviceAreas.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* 마지막 활동 시간 */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccessTime color="action" sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" color="textSecondary">
                      {getLastActiveText(contractor.lastActive || new Date())}
                    </Typography>
                  </Box>

                  {/* 액션 버튼 */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      size="small"
                      onClick={() => handleRequestContractor(contractor.id, contractor.name)}
                      disabled={!contractor.isAvailable}
                    >
                      {contractor.isAvailable ? '시공 의뢰' : '비활동'}
                    </Button>
                    <Tooltip title="연락처 보기">
                      <IconButton size="small">
                        <Phone />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              검색 조건에 맞는 시공자가 없습니다.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Snackbar */}
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

export default ContractorList;
