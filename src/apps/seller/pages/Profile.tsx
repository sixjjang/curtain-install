import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Save as SaveIcon, 
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SellerPickupInfo, User } from '../../../types';
import { SellerService, SellerBasicInfo } from '../../../shared/services/sellerService';
import { StorageService } from '../../../shared/services/storageService';
import { 
  optimizeImage, 
  validateImageFile, 
  formatFileSize 
} from '../../../shared/utils/imageOptimizer';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  console.log('🔍 Profile 컴포넌트 렌더링 시작');
  console.log('🔍 Profile - 현재 사용자:', user);
  
  // 기본 정보 상태
  const [basicInfo, setBasicInfo] = useState<SellerBasicInfo>({
    name: user?.name || '',
    companyName: user?.companyName || '',
    businessNumber: user?.businessNumber || '',
    address: user?.businessAddress || '',
    phone: user?.phone || '',
    email: user?.email || '',
    profileImage: user?.profileImage || ''
  });
  
  // 프로필 사진 상태
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [optimizationDialog, setOptimizationDialog] = useState(false);
  const [optimizationInfo, setOptimizationInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  } | null>(null);
  
  // 픽업 정보 상태
  const [pickupInfo, setPickupInfo] = useState<SellerPickupInfo>({
    companyName: '',
    phone: '',
    address: ''
  });
  
  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 기본 정보 변경 핸들러
  const handleBasicInfoChange = (field: string, value: string) => {
    setBasicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 픽업 정보 변경 핸들러
  const handlePickupInfoChange = (field: keyof SellerPickupInfo, value: string) => {
    setPickupInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 사용자 정보가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (user) {
      console.log('🔄 판매자 프로필 - 사용자 정보 업데이트:', user);
      
      // 기본 정보 업데이트 (User 객체의 직접 필드에서)
      setBasicInfo({
        name: user.name || '',
        companyName: user.companyName || '',
        businessNumber: user.businessNumber || '',
        address: user.businessAddress || '',
        phone: user.phone || '',
        email: user.email || '',
        profileImage: user.profileImage || ''
      });
      
      // 프로필 이미지 업데이트
      if (user.profileImage) {
        setProfileImage(user.profileImage);
      }
      
      console.log('✅ 판매자 프로필 - 상태 업데이트 완료');
    }
  }, [user]);

  // 프로필 사진 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

        // Firebase Storage에 안전하게 업로드 (CORS 오류 시 로컬 저장)
        if (user?.id) {
          try {
            const imageFile = StorageService.dataURLtoFile(optimizedResult.dataUrl, file.name);
            const imageUrl = await StorageService.uploadProfileImageSafe(imageFile, user.id);
            
            // 업로드된 URL로 설정
            setProfileImage(imageUrl);
            
            const basicInfoWithImage = {
              ...basicInfo,
              profileImage: imageUrl
            };
            await SellerService.saveBasicInfo(user.id, basicInfoWithImage);
            
            // AuthContext의 사용자 정보 업데이트
            console.log('🔄 AuthContext 업데이트 시작:', imageUrl);
            await updateUser({ profileImage: imageUrl });
            console.log('✅ AuthContext 업데이트 완료');
            
            // Firebase Storage에 성공적으로 업로드된 경우
            if (StorageService.isFirebaseStorageURL(imageUrl)) {
              setSnackbar({
                open: true,
                message: '프로필 사진이 서버에 저장되었습니다.',
                severity: 'success'
              });
            } else {
              // 로컬 저장된 경우
              setSnackbar({
                open: true,
                message: '프로필 사진이 로컬에 저장되었습니다. (CORS 설정 완료 후 서버 저장 가능)',
                severity: 'success'
              });
            }
          } catch (error) {
            console.error('이미지 저장 실패:', error);
            // 로컬 저장으로 폴백
            setProfileImage(optimizedResult.dataUrl);
            
            const basicInfoWithImage = {
              ...basicInfo,
              profileImage: optimizedResult.dataUrl
            };
            await SellerService.saveBasicInfo(user.id, basicInfoWithImage);
            
            // AuthContext의 사용자 정보 업데이트
            console.log('🔄 AuthContext 업데이트 시작 (로컬):', optimizedResult.dataUrl);
            await updateUser({ profileImage: optimizedResult.dataUrl });
            console.log('✅ AuthContext 업데이트 완료 (로컬)');
            
            setSnackbar({
              open: true,
              message: '프로필 사진이 로컬에 저장되었습니다.',
              severity: 'success'
            });
          }
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

  // 사진 업로드 버튼 클릭
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // 저장된 정보 불러오기
  useEffect(() => {
    const loadSavedInfo = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 판매자 프로필 정보 불러오기 시작:', user.id);
        console.log('🔍 현재 user 객체:', user);
        
        // users 컬렉션에서 직접 정보 사용 (sellers 컬렉션 대신)
        console.log('✅ users 컬렉션의 판매자 정보 (직접 필드):', {
          name: user.name,
          companyName: user.companyName,
          businessNumber: user.businessNumber,
          businessAddress: user.businessAddress,
          phone: user.phone,
          email: user.email,
          profileImage: user.profileImage
        });
        
        // 기본 정보 설정 (User 객체의 직접 필드에서)
        setBasicInfo({
          name: user.name || '',
          companyName: user.companyName || '',
          businessNumber: user.businessNumber || '',
          address: user.businessAddress || '',
          phone: user.phone || '',
          email: user.email || '',
          profileImage: user.profileImage || ''
        });
        
        // 프로필 이미지 설정
        if (user.profileImage) {
          setProfileImage(user.profileImage);
        }
        
        // 픽업 정보 불러오기 (sellers 컬렉션에서)
        const savedPickupInfo = await SellerService.getPickupInfo(user.id);
        if (savedPickupInfo) {
          console.log('✅ 저장된 픽업 정보:', savedPickupInfo);
          setPickupInfo(savedPickupInfo);
        } else {
          console.log('⚠️ 저장된 픽업 정보 없음, 기본값으로 초기화');
          // 기본 픽업 정보로 초기화 (기본 정보와 동일하게 설정)
          setPickupInfo({
            companyName: user.companyName || '',
            phone: user.phone || '',
            address: user.businessAddress || ''
          });
        }
      } catch (error) {
        console.error('❌ 저장된 정보 불러오기 실패:', error);
        // 오류 발생 시 사용자 정보로 초기화
        setBasicInfo({
          name: user.name || '',
          companyName: user.companyName || '',
          businessNumber: user.businessNumber || '',
          address: user.businessAddress || '',
          phone: user.phone || '',
          email: user.email || '',
          profileImage: user.profileImage || ''
        });
      }
    };

    loadSavedInfo();
  }, [user]);

  // 기본 정보 저장
  const handleSaveBasicInfo = async () => {
    if (!user?.id) {
      setSnackbar({
        open: true,
        message: '로그인이 필요합니다.',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      // AuthContext의 updateUser를 사용하여 users 컬렉션에 저장
      const updateData: Partial<User> = {
        name: basicInfo.name,
        companyName: basicInfo.companyName,
        businessNumber: basicInfo.businessNumber,
        businessAddress: basicInfo.address,
        phone: basicInfo.phone,
        email: basicInfo.email,
        ...(profileImage && { profileImage }) // profileImage가 있을 때만 포함
      };
      
      console.log('🔍 기본 정보 저장 시작:', updateData);
      await updateUser(updateData);
      
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: '기본 정보가 저장되었습니다.',
        severity: 'success'
      });
    } catch (error) {
      console.error('기본 정보 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '기본 정보 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 픽업 정보 저장
  const handleSavePickupInfo = async () => {
    if (!user?.id) {
      setSnackbar({
        open: true,
        message: '로그인이 필요합니다.',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      await SellerService.savePickupInfo(user.id, pickupInfo);
      
      setSnackbar({
        open: true,
        message: '픽업 정보가 저장되었습니다.',
        severity: 'success'
      });
    } catch (error) {
      console.error('픽업 정보 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '픽업 정보 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  console.log('🔍 Profile 컴포넌트 - return 시작');
  
  return (
    <Box sx={{ 
      padding: '20px',
      minHeight: '500px',
      backgroundColor: 'background.paper',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {(() => { console.log('🔍 Profile 컴포넌트 - 판매자 프로필 제목 렌더링'); return null; })()}
      


      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    fontSize: '2rem'
                  }}
                  src={profileImage || undefined}
                >
                  {basicInfo.name.charAt(0)}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }}
                  onClick={handlePhotoClick}
                  disabled={imageLoading}
                >
                  {imageLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PhotoCameraIcon />
                  )}
                </IconButton>
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {basicInfo.name}
              </Typography>
              <Chip 
                label={user?.seller?.rating && user.seller.rating > 0 ? `평점 ${user.seller.rating.toFixed(1)}/5.0` : '평점 없음'} 
                color={user?.seller?.rating && user.seller.rating > 0 ? "primary" : "default"} 
                sx={{ mb: 2 }} 
              />
              <Typography variant="body2" color="textSecondary">
                {basicInfo.companyName}
              </Typography>
              
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  기본 정보
                </Typography>
                <Button
                  variant={isEditing ? "outlined" : "contained"}
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(!isEditing)}
                  size="small"
                >
                  {isEditing ? '편집 취소' : '편집'}
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이름"
                    value={basicInfo.name}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="상호명"
                    value={basicInfo.companyName}
                    onChange={(e) => handleBasicInfoChange('companyName', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="사업자번호"
                    value={basicInfo.businessNumber}
                    onChange={(e) => handleBasicInfoChange('businessNumber', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="연락처"
                    value={basicInfo.phone}
                    onChange={(e) => handleBasicInfoChange('phone', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="이메일"
                    value={basicInfo.email}
                    onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="주소"
                    value={basicInfo.address}
                    onChange={(e) => handleBasicInfoChange('address', e.target.value)}
                    margin="normal"
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>

              {isEditing && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveBasicInfo}
                    disabled={loading}
                  >
                    {loading ? '저장 중...' : '기본 정보 저장'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 픽업 정보 섹션 */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                픽업 정보 (시공자 전달용)
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                새 작업 등록 시 자동으로 입력되는 픽업 정보를 설정하세요.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="상호"
                    value={pickupInfo.companyName}
                    onChange={(e) => handlePickupInfoChange('companyName', e.target.value)}
                    placeholder="픽업할 업체명을 입력하세요"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="연락처"
                    value={pickupInfo.phone}
                    onChange={(e) => handlePickupInfoChange('phone', e.target.value)}
                    placeholder="010-0000-0000"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="픽업 주소"
                    value={pickupInfo.address}
                    onChange={(e) => handlePickupInfoChange('address', e.target.value)}
                    placeholder="픽업할 장소의 주소를 입력하세요"
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePickupInfo}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '픽업 정보 저장'}
                </Button>
              </Box>
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
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800', 
                borderRadius: 1 
              }}>
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
