import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  CloudUpload,
  Link,
  Warning,
  Schedule,
  Extension,
  Download,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { AdvertisementService } from '../../../shared/services/advertisementService';
import { Advertisement } from '../../../types';

const AdvertisementManagement: React.FC = () => {
  const { user } = useAuth();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [position, setPosition] = useState<'sidebar' | 'dashboard' | 'chat'>('sidebar');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [publishStartDate, setPublishStartDate] = useState<string>('');
  const [publishEndDate, setPublishEndDate] = useState<string>('');
  
  // 만료 알림 상태
  const [expiredAds, setExpiredAds] = useState<Advertisement[]>([]);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [extensionDialog, setExtensionDialog] = useState<{open: boolean, ad: Advertisement | null}>({open: false, ad: null});
  const [newEndDate, setNewEndDate] = useState<string>('');
  
  // 로딩 상태
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 광고 목록 로드
  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      setError('');
      const ads = await AdvertisementService.getAllAdvertisements();
      setAdvertisements(ads);
      
      // 만료된 광고 체크
      const expired = await AdvertisementService.getExpiredAdvertisements();
      setExpiredAds(expired);
      
      if (expired.length > 0) {
        setShowExpiredDialog(true);
      }
    } catch (error) {
      console.error('광고 목록 로드 실패:', error);
      setError('광고 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvertisements();
  }, []);

  // 다이얼로그 열기 (새 광고)
  const handleOpenDialog = () => {
    setEditingAd(null);
    setTitle('');
    setLinkUrl('');
    setPosition('sidebar');
    setImageFile(null);
    setImagePreview('');
    setIsActive(true);
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (광고 수정)
  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setLinkUrl(ad.linkUrl);
    setPosition(ad.position);
    setImageFile(null);
    setImagePreview(ad.imageUrl);
    setIsActive(ad.isActive);
    setPublishStartDate(ad.publishStartDate.toISOString().slice(0, 16));
    setPublishEndDate(ad.publishEndDate.toISOString().slice(0, 16));
    setDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAd(null);
    setTitle('');
    setLinkUrl('');
    setPosition('sidebar');
    setImageFile(null);
    setImagePreview('');
    setIsActive(true);
    setPublishStartDate('');
    setPublishEndDate('');
  };

  // 이미지 파일 선택
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 광고 저장
  const handleSave = async () => {
    if (!user?.id) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!title.trim() || !linkUrl.trim()) {
      setError('제목과 링크 URL을 입력해주세요.');
      return;
    }

    if (!editingAd && !imageFile) {
      setError('광고 이미지를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (editingAd) {
        // 광고 수정
        await AdvertisementService.updateAdvertisement(
          editingAd.id,
          {
            title: title.trim(),
            linkUrl: linkUrl.trim(),
            position,
            isActive
          },
          imageFile || undefined
        );
        setSuccess('광고가 성공적으로 수정되었습니다.');
      } else {
        // 새 광고 생성
        if (!imageFile) {
          setError('광고 이미지를 선택해주세요.');
          return;
        }
                 if (!publishStartDate || !publishEndDate) {
           setError('게시 시작일과 종료일을 입력해주세요.');
           return;
         }
         
         await AdvertisementService.createAdvertisement(
           title.trim(),
           imageFile,
           linkUrl.trim(),
           position,
           user.id,
           new Date(publishStartDate),
           new Date(publishEndDate)
         );
        setSuccess('광고가 성공적으로 생성되었습니다.');
      }

      handleCloseDialog();
      loadAdvertisements();
    } catch (error) {
      console.error('광고 저장 실패:', error);
      setError('광고 저장에 실패했습니다: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 광고 삭제
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 광고를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeleting(id);
      await AdvertisementService.deleteAdvertisement(id);
      setSuccess('광고가 성공적으로 삭제되었습니다.');
      loadAdvertisements();
    } catch (error) {
      console.error('광고 삭제 실패:', error);
      setError('광고 삭제에 실패했습니다: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  // 광고 상태 토글
  const handleToggleStatus = async (id: string) => {
    try {
      await AdvertisementService.toggleAdvertisementStatus(id);
      setSuccess('광고 상태가 변경되었습니다.');
      loadAdvertisements();
    } catch (error) {
      console.error('광고 상태 변경 실패:', error);
      setError('광고 상태 변경에 실패했습니다: ' + (error as Error).message);
    }
  };

  // 위치별 라벨
  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'sidebar': return '사이드바';
      case 'dashboard': return '대시보드';
      case 'chat': return '채팅';
      default: return position;
    }
  };

  // 광고 가이드 이미지 생성
  const generateAdGuideImage = (position: 'sidebar' | 'dashboard' | 'chat'): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    // 위치별 크기 설정
    let width: number, height: number;
    switch (position) {
      case 'sidebar':
        width = 300;
        height = 200;
        break;
      case 'dashboard':
        width = 600;
        height = 400;
        break;
      case 'chat':
        width = 600;
        height = 400;
        break;
      default:
        width = 300;
        height = 200;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 배경
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    
    // 테두리
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // 제목
    ctx.fillStyle = '#2196f3';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${getPositionLabel(position)} 광고 가이드`, width / 2, 30);
    
    // 크기 정보
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText(`권장 크기: ${width}px × ${height}px`, width / 2, 60);
    
    // 안내 텍스트
    ctx.font = '12px Arial';
    const guideTexts = [
      '• 이미지는 JPG, PNG 형식을 권장합니다',
      '• 파일 크기는 2MB 이하로 제한됩니다',
      '• 투명 배경은 지원하지 않습니다',
      '• 텍스트가 포함된 경우 가독성을 확인해주세요'
    ];
    
    guideTexts.forEach((text, index) => {
      ctx.fillText(text, width / 2, 90 + (index * 20));
    });
    
    // 예시 영역
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(width * 0.1, height * 0.6, width * 0.8, height * 0.3);
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.1, height * 0.6, width * 0.8, height * 0.3);
    
    ctx.fillStyle = '#1976d2';
    ctx.font = '12px Arial';
    ctx.fillText('광고 이미지 예시 영역', width / 2, height * 0.6 + 20);
    
    return canvas.toDataURL('image/png');
  };

  // 광고 가이드 다운로드
  const downloadAdGuide = (position: 'sidebar' | 'dashboard' | 'chat') => {
    const imageDataUrl = generateAdGuideImage(position);
    const link = document.createElement('a');
    link.download = `${getPositionLabel(position)}_광고가이드.png`;
    link.href = imageDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 전체 광고 가이드 다운로드
  const downloadAllAdGuides = () => {
    const positions: ('sidebar' | 'dashboard' | 'chat')[] = ['sidebar', 'dashboard', 'chat'];
    
    positions.forEach((position, index) => {
      setTimeout(() => {
        downloadAdGuide(position);
      }, index * 500); // 0.5초 간격으로 다운로드
    });
  };

  // 광고 연장 요청
  const handleExtensionRequest = async () => {
    if (!extensionDialog.ad || !newEndDate) return;
    
    try {
      await AdvertisementService.requestExtension(extensionDialog.ad.id, new Date(newEndDate));
      setSuccess('광고 연장이 완료되었습니다.');
      setExtensionDialog({open: false, ad: null});
      setNewEndDate('');
      loadAdvertisements();
    } catch (error) {
      console.error('광고 연장 실패:', error);
      setError('광고 연장에 실패했습니다: ' + (error as Error).message);
    }
  };

  // 광고 종료
  const handleEndAdvertisement = async (id: string) => {
    if (!window.confirm('정말로 이 광고를 종료하시겠습니까?')) {
      return;
    }
    
    try {
      await AdvertisementService.endAdvertisement(id);
      setSuccess('광고가 종료되었습니다.');
      loadAdvertisements();
    } catch (error) {
      console.error('광고 종료 실패:', error);
      setError('광고 종료에 실패했습니다: ' + (error as Error).message);
    }
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
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <Typography variant="h4" component="h1">
           광고 관리
         </Typography>
         <Box display="flex" gap={2}>
           <Button
             variant="outlined"
             startIcon={<Download />}
             onClick={downloadAllAdGuides}
           >
             광고 가이드 다운로드
           </Button>
           <Button
             variant="contained"
             startIcon={<Add />}
             onClick={handleOpenDialog}
           >
             새 광고 추가
           </Button>
         </Box>
       </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

             {success && (
         <Alert severity="success" sx={{ mb: 3 }}>
           {success}
         </Alert>
       )}

               {/* 광고 가이드 정보 카드 */}
        <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Info color="primary" />
              <Typography variant="h6">광고 가이드 안내</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              광고주에게 광고 이미지 자료를 요청할 때 사용할 수 있는 가이드 이미지를 다운로드할 수 있습니다.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  bgcolor: 'background.default' 
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    사이드바 광고
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    권장 크기: 300px × 200px
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => downloadAdGuide('sidebar')}
                    sx={{ mt: 1 }}
                  >
                    가이드 다운로드
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  bgcolor: 'background.default' 
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    대시보드 광고
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    권장 크기: 600px × 400px
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => downloadAdGuide('dashboard')}
                    sx={{ mt: 1 }}
                  >
                    가이드 다운로드
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  bgcolor: 'background.default' 
                }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    채팅 광고
                  </Typography>
                  <Typography variant="caption" display="block" color="textSecondary">
                    권장 크기: 600px × 400px
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => downloadAdGuide('chat')}
                    sx={{ mt: 1 }}
                  >
                    가이드 다운로드
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

      <Grid container spacing={3}>
        {advertisements.map((ad) => (
          <Grid item xs={12} sm={6} md={4} key={ad.id}>
            <Card>
              <Box sx={{ position: 'relative' }}>
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  style={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <Chip
                    label={getPositionLabel(ad.position)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={ad.isActive ? '활성' : '비활성'}
                    size="small"
                    color={ad.isActive ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {ad.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {ad.linkUrl}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  생성일: {ad.createdAt.toLocaleDateString('ko-KR')}
                </Typography>
                                 <Typography variant="caption" color="textSecondary" display="block">
                   클릭수: {ad.clickCount || 0}회
                 </Typography>
                 <Typography variant="caption" color="textSecondary" display="block">
                   게시기간: {ad.publishStartDate.toLocaleDateString('ko-KR')} ~ {ad.publishEndDate.toLocaleDateString('ko-KR')}
                 </Typography>
                 {ad.isExpired && (
                   <Chip
                     label="만료됨"
                     size="small"
                     color="error"
                     variant="outlined"
                     sx={{ mt: 1 }}
                   />
                 )}
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEditAd(ad)}
                  >
                    수정
                  </Button>
                  <Button
                    size="small"
                    startIcon={ad.isActive ? <VisibilityOff /> : <Visibility />}
                    onClick={() => handleToggleStatus(ad.id)}
                  >
                    {ad.isActive ? '비활성화' : '활성화'}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(ad.id)}
                    disabled={deleting === ad.id}
                  >
                    {deleting === ad.id ? '삭제 중...' : '삭제'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {advertisements.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" textAlign="center" color="textSecondary">
              등록된 광고가 없습니다.
            </Typography>
            <Typography variant="body2" textAlign="center" color="textSecondary">
              "새 광고 추가" 버튼을 클릭하여 첫 번째 광고를 등록해보세요.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 광고 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAd ? '광고 수정' : '새 광고 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="광고 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="링크 URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                required
                InputProps={{
                  startAdornment: <Link sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>배치 위치</InputLabel>
                <Select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as 'sidebar' | 'dashboard' | 'chat')}
                  label="배치 위치"
                >
                  <MenuItem value="sidebar">사이드바 (3개)</MenuItem>
                  <MenuItem value="dashboard">대시보드 (1개)</MenuItem>
                  <MenuItem value="chat">채팅 (1개)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label="활성화"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="게시 시작일"
                value={publishStartDate}
                onChange={(e) => setPublishStartDate(e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="게시 종료일"
                value={publishEndDate}
                onChange={(e) => setPublishEndDate(e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button
                    component="span"
                    startIcon={<CloudUpload />}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  >
                    광고 이미지 선택
                  </Button>
                </label>
                
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={imagePreview}
                      alt="미리보기"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                )}
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  권장 크기: {position === 'sidebar' ? '300x200px' : '600x400px'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
          >
            {saving ? '저장 중...' : (editingAd ? '수정' : '추가')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 만료된 광고 알림 다이얼로그 */}
      <Dialog open={showExpiredDialog} onClose={() => setShowExpiredDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            <Typography variant="h6">게시기간 만료 알림</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            다음 {expiredAds.length}개의 광고가 게시기간이 만료되었습니다:
          </Typography>
          <Box sx={{ mt: 2 }}>
            {expiredAds.map((ad) => (
              <Card key={ad.id} sx={{ mb: 2, p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{ad.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      게시 종료일: {ad.publishEndDate.toLocaleDateString('ko-KR')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      클릭수: {ad.clickCount}회
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Extension />}
                      onClick={() => {
                        setExtensionDialog({open: true, ad});
                        setNewEndDate('');
                      }}
                    >
                      연장
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleEndAdvertisement(ad.id)}
                    >
                      종료
                    </Button>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpiredDialog(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 광고 연장 다이얼로그 */}
      <Dialog open={extensionDialog.open} onClose={() => setExtensionDialog({open: false, ad: null})} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Extension color="primary" />
            <Typography variant="h6">광고 연장</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {extensionDialog.ad && (
            <>
              <Typography variant="body1" gutterBottom>
                "{extensionDialog.ad.title}" 광고의 게시기간을 연장합니다.
              </Typography>
              <TextField
                fullWidth
                type="datetime-local"
                label="새로운 게시 종료일"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                required
                sx={{ mt: 2 }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtensionDialog({open: false, ad: null})}>취소</Button>
          <Button
            onClick={handleExtensionRequest}
            variant="contained"
            disabled={!newEndDate}
          >
            연장 요청
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvertisementManagement;
