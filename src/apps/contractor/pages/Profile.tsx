import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Save, PhotoCamera, Info as InfoIcon } from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ContractorInfo } from '../../../types';
import { ContractorService, ContractorBasicInfo } from '../../../shared/services/contractorService';
import { StorageService } from '../../../shared/services/storageService';
import { 
  optimizeImage, 
  validateImageFile, 
  formatFileSize 
} from '../../../shared/utils/imageOptimizer';

// 시공 가능지역 데이터
const regionData: { [key: string]: string[] } = {
  '서울특별시': ['강남구', '서초구', '마포구', '송파구', '영등포구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '강서구', '구로구', '금천구', '동작구', '관악구'],
  '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
  '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
  '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
  '세종특별자치시': ['세종특별자치시'],
  '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양군', '연천군', '포천군', '가평군'],
  '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '제주특별자치도': ['제주시', '서귀포시']
};

// 은행 목록
const banks = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', 
  'SC제일은행', '케이뱅크', '카카오뱅크', '토스뱅크', '새마을금고', '신협'
];

const Profile: React.FC = () => {
  const { user } = useAuth();
  const contractor = user?.contractor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(contractor?.serviceAreas || []);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState(contractor?.bankName || '');
  const [bankAccount, setBankAccount] = useState(contractor?.bankAccount || '');
  const [experience, setExperience] = useState(contractor?.experience || '');
  const [optimizationDialog, setOptimizationDialog] = useState(false);
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageLoading(true);
      
      try {
        // 파일 유효성 검사
        const validation = validateImageFile(file, 10 * 1024 * 1024); // 10MB
        if (!validation.isValid) {
          setSnackbar({
            open: true,
            message: validation.error || '파일 검증에 실패했습니다.',
            severity: 'error'
          });
          setImageLoading(false);
          return;
        }

        // 이미지 최적화
        const optimizedResult = await optimizeImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          maxFileSize: 2 * 1024 * 1024, // 2MB
          format: 'jpeg'
        });

        // 최적화 정보 저장
        setOptimizationInfo({
          originalSize: optimizedResult.originalSize,
          optimizedSize: optimizedResult.optimizedSize,
          compressionRatio: optimizedResult.compressionRatio
        });

        // CORS 설정 완료 전까지 로컬 저장 방식 사용
        if (user?.id) {
          // 로컬 dataURL로 저장 (CORS 설정 완료 후 Firebase Storage로 변경 예정)
          setProfileImage(optimizedResult.dataUrl);
          
          const basicInfo: ContractorBasicInfo = {
            name: contractor?.name || '',
            phone: contractor?.phone || '',
            email: contractor?.email || '',
            address: contractor?.location?.address || '',
            experience: experience,
            serviceAreas: selectedRegions,
            bankName: selectedBank,
            bankAccount: bankAccount,
            profileImage: optimizedResult.dataUrl
          };
          await ContractorService.saveBasicInfo(user.id, basicInfo);
        } else {
          // 로컬 미리보기용 (임시)
          setProfileImage(optimizedResult.dataUrl);
        }
        
        // 최적화 정보 다이얼로그 표시 (압축률이 20% 이상인 경우)
        if (optimizedResult.compressionRatio > 0.2) {
          setOptimizationDialog(true);
        }

        setSnackbar({
          open: true,
          message: '프로필 사진이 최적화되어 저장되었습니다.',
          severity: 'success'
        });
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        setSnackbar({
          open: true,
          message: '이미지 업로드에 실패했습니다.',
          severity: 'error'
        });
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRegionChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedRegions(typeof value === 'string' ? value.split(',') : value);
  };

  // 저장된 정보 불러오기
  React.useEffect(() => {
    const loadSavedInfo = async () => {
      if (!user?.id) return;
      
      try {
        const savedBasicInfo = await ContractorService.getBasicInfo(user.id);
        if (savedBasicInfo) {
          setExperience(savedBasicInfo.experience);
          setSelectedRegions(savedBasicInfo.serviceAreas);
          setSelectedBank(savedBasicInfo.bankName);
          setBankAccount(savedBasicInfo.bankAccount);
          if (savedBasicInfo.profileImage) {
            setProfileImage(savedBasicInfo.profileImage);
          }
        }
      } catch (error) {
        console.error('저장된 정보 불러오기 실패:', error);
      }
    };

    loadSavedInfo();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) {
      setSnackbar({
        open: true,
        message: '로그인이 필요합니다.',
        severity: 'error'
      });
      return;
    }

    try {
      const basicInfo: ContractorBasicInfo = {
        name: contractor?.name || '',
        phone: contractor?.phone || '',
        email: contractor?.email || '',
        address: contractor?.location?.address || '',
        experience: experience,
        serviceAreas: selectedRegions,
        bankName: selectedBank,
        bankAccount: bankAccount,
        ...(profileImage && { profileImage })
      };

      await ContractorService.saveBasicInfo(user.id, basicInfo);
      
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: '프로필이 저장되었습니다.',
        severity: 'success'
      });
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '프로필 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  if (!contractor) {
    return <Typography>로딩 중...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          프로필
        </Typography>
        <Button
          variant={isEditing ? "contained" : "outlined"}
          startIcon={isEditing ? <Save /> : <Edit />}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? '저장' : '편집'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box position="relative" display="inline-block">
                <Avatar 
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  src={profileImage || undefined}
                >
                  {contractor?.name?.charAt(0)}
                </Avatar>
                {isEditing && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                    onClick={handlePhotoClick}
                    disabled={imageLoading}
                  >
                    {imageLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PhotoCamera />
                    )}
                  </IconButton>
                )}
              </Box>
              
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <Typography variant="h5" gutterBottom>
                {contractor?.name}
              </Typography>
              <Chip label={`Lv. ${contractor.level || 1}`} color="primary" sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                시공 경력: {contractor.experience || '입력 필요'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이름"
                    defaultValue={contractor?.name}
                    margin="normal"
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="연락처"
                    defaultValue={contractor?.phone}
                    margin="normal"
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="이메일"
                    defaultValue={contractor?.email}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="주소"
                    defaultValue={contractor?.location?.address || ''}
                    margin="normal"
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                시공 정보
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="시공경력"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    margin="normal"
                    placeholder="예: 5년, 3년 6개월"
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="총 시공 건수"
                    defaultValue={`${contractor?.totalJobs || 0}건`}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="평균 평점"
                    defaultValue={`${Number(contractor.rating || 0).toFixed(1)}/5.0`}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="현재 레벨"
                    defaultValue={`Lv. ${contractor.level || 1}`}
                    margin="normal"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

                             <Typography variant="h6" gutterBottom>
                 시공 가능지역
               </Typography>
               
               <Grid container spacing={2}>
                 <Grid item xs={12} sm={6}>
                   <FormControl fullWidth margin="normal">
                     <InputLabel>시/도 선택</InputLabel>
                     <Select
                       value={selectedCity || ''}
                       onChange={(e) => setSelectedCity(e.target.value)}
                       label="시/도 선택"
                       disabled={!isEditing}
                     >
                       {Object.keys(regionData).map((city) => (
                         <MenuItem key={city} value={city}>
                           {city}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} sm={6}>
                   <FormControl fullWidth margin="normal">
                     <InputLabel>구/군 선택</InputLabel>
                     <Select
                       multiple
                       value={selectedRegions}
                       onChange={handleRegionChange}
                       input={<OutlinedInput label="구/군 선택" />}
                       renderValue={(selected) => (
                         <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                           {selected.map((value) => (
                             <Chip key={value} label={value} size="small" />
                           ))}
                         </Box>
                       )}
                       disabled={!isEditing || !selectedCity}
                       MenuProps={{
                         PaperProps: {
                           style: {
                             maxHeight: 300,
                           },
                         },
                       }}
                     >
                       {selectedCity && regionData[selectedCity]?.map((district) => (
                         <MenuItem key={district} value={district}>
                           <Checkbox checked={selectedRegions.indexOf(district) > -1} />
                           <ListItemText primary={district} />
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
               </Grid>
               
               {selectedRegions.length > 0 && (
                 <Box sx={{ mt: 2 }}>
                   <Typography variant="body2" color="textSecondary" gutterBottom>
                     선택된 지역:
                   </Typography>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                     {selectedRegions.map((region) => (
                       <Chip 
                         key={region} 
                         label={region} 
                         size="small" 
                         onDelete={isEditing ? () => {
                           setSelectedRegions(selectedRegions.filter(r => r !== region));
                         } : undefined}
                       />
                     ))}
                   </Box>
                 </Box>
               )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                계좌 정보
              </Typography>
              
              <Grid container spacing={2}>
                                 <Grid item xs={12} sm={6}>
                   <FormControl fullWidth margin="normal">
                     <InputLabel>은행 선택</InputLabel>
                     <Select
                       value={selectedBank}
                       onChange={(e) => setSelectedBank(e.target.value)}
                       label="은행 선택"
                       disabled={!isEditing}
                     >
                       {banks.map((bank) => (
                         <MenuItem key={bank} value={bank}>
                           {bank}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="계좌번호"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    margin="normal"
                    placeholder="계좌번호를 입력하세요"
                    InputProps={{ readOnly: !isEditing }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* 이미지 최적화 정보 다이얼로그 */}
      <Dialog 
        open={optimizationDialog} 
        onClose={() => setOptimizationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            <Typography component="span">이미지 최적화 완료</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {optimizationInfo && (
            <Box>
              <Typography variant="body1" gutterBottom>
                이미지가 성공적으로 최적화되었습니다.
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>원본 크기:</strong> {formatFileSize(optimizationInfo.originalSize)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>최적화 크기:</strong> {formatFileSize(optimizationInfo.optimizedSize)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  <strong>압축률:</strong> {(optimizationInfo.compressionRatio * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                최적화된 이미지는 더 빠른 로딩과 저장 공간 절약에 도움이 됩니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptimizationDialog(false)}>
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
