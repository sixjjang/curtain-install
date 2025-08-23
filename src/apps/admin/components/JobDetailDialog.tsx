import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Calculate as CalculateIcon,
  AttachFile,
  FileDownload,
  PictureAsPdf,
  Image,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { ConstructionJob, User } from '../../../types';
import { AuthService } from '../../../shared/services/authService';

interface JobDetailDialogProps {
  open: boolean;
  onClose: () => void;
  job: ConstructionJob | null;
}

const JobDetailDialog: React.FC<JobDetailDialogProps> = ({ open, onClose, job }) => {
  const [sellerInfo, setSellerInfo] = useState<User | null>(null);
  const [contractorInfo, setContractorInfo] = useState<User | null>(null);
  const [customerInfo, setCustomerInfo] = useState<User | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (job) {
        try {
          const [seller, contractor, customer] = await Promise.all([
            AuthService.getUserById(job.sellerId),
            job.contractorId ? AuthService.getUserById(job.contractorId) : null,
            job.customerId ? AuthService.getUserById(job.customerId) : null
          ]);
          
          setSellerInfo(seller);
          setContractorInfo(contractor);
          setCustomerInfo(customer);
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
        }
      }
    };

    loadUserInfo();
  }, [job]);

  if (!job) return null;

  const getStatusColor = (status: ConstructionJob['status']) => {
    const statusColors = {
      pending: 'warning',
      assigned: 'info',
      product_preparing: 'warning',
      product_ready: 'success',
      pickup_completed: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error',
      product_not_ready: 'error',
      customer_absent: 'error',
      schedule_changed: 'warning'
    };
    return statusColors[status];
  };

  const getStatusLabel = (status: ConstructionJob['status']) => {
    const statusLabels = {
      pending: '대기중',
      assigned: '배정됨',
      product_preparing: '제품준비중',
      product_ready: '제품준비완료',
      pickup_completed: '픽업완료',
      in_progress: '진행중',
      completed: '완료',
      cancelled: '취소',
      product_not_ready: '제품 미준비',
      customer_absent: '소비자 부재',
      schedule_changed: '일정 변경'
    };
    return statusLabels[status];
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 타입에 따른 아이콘 반환
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image color="primary" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'document':
        return <DescriptionIcon color="info" />;
      default:
        return <AttachFile color="action" />;
    }
  };

  // 파일 다운로드 처리
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        작업 상세보기
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="bold" sx={{ flexGrow: 1, mr: 2 }}>
              {job.title}
            </Typography>
            <Chip 
              label={getStatusLabel(job.status)} 
              color={getStatusColor(job.status) as any}
              size="medium"
            />
          </Box>

        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  위치 정보
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {job.address}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 1 }} />
                  예산 정보
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {job.budget?.min?.toLocaleString() || 0} ~ {job.budget?.max?.toLocaleString() || 0}만원
                </Typography>
              </CardContent>
            </Card>
          </Grid>

                     <Grid item xs={12}>
             <Card variant="outlined">
               <CardContent>
                 <Typography variant="h6" gutterBottom>
                   작업 설명
                 </Typography>
                 <Typography variant="body2" color="textSecondary">
                   {job.description}
                 </Typography>
               </CardContent>
             </Card>
           </Grid>

           {/* 품목 정보 */}
           {job.items && job.items.length > 0 && (
             <Grid item xs={12}>
               <Card variant="outlined">
                 <CardContent>
                   <Typography variant="h6" gutterBottom>
                     품목 정보
                   </Typography>
                   <Grid container spacing={2}>
                     {job.items.map((item, index) => (
                       <Grid item xs={12} key={index}>
                         <Box sx={{ 
                           p: 2, 
                           border: '1px solid #f0f0f0', 
                           borderRadius: 1,
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center'
                         }}>
                           <Box>
                             <Typography variant="subtitle2" fontWeight="bold">
                               {item.name}
                             </Typography>
                             <Typography variant="caption" color="textSecondary">
                               수량: {item.quantity}개 | 단가: {item.unitPrice.toLocaleString()}원
                             </Typography>
                           </Box>
                           <Typography variant="h6" color="primary" fontWeight="bold">
                             {item.totalPrice.toLocaleString()}원
                           </Typography>
                         </Box>
                       </Grid>
                     ))}
                   </Grid>
                   <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', borderRadius: 1 }}>
                     <Typography variant="h6" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <CalculateIcon />
                       총 품목 금액: {job.items.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}원
                     </Typography>
                   </Box>
                 </CardContent>
               </Card>
             </Grid>
           )}

          {job.requirements && job.requirements.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    작업 요구사항
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {job.requirements.map((requirement, index) => (
                      <Chip 
                        key={index} 
                        label={requirement} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* 사용자 정보 */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  판매자 정보
                </Typography>
                {sellerInfo ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {sellerInfo.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      이메일: {sellerInfo.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      연락처: {sellerInfo.phone}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      역할: {sellerInfo.role}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    판매자 정보를 불러올 수 없습니다.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  고객 정보
                </Typography>
                {customerInfo ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {customerInfo.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      이메일: {customerInfo.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      연락처: {customerInfo.phone}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      역할: {customerInfo.role}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    고객 정보를 불러올 수 없습니다.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  시공자 정보
                </Typography>
                {contractorInfo ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {contractorInfo.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      이메일: {contractorInfo.email}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      연락처: {contractorInfo.phone}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      역할: {contractorInfo.role}
                    </Typography>
                  </Box>
                ) : job.contractorId ? (
                  <Typography variant="body2" color="textSecondary">
                    시공자 정보를 불러올 수 없습니다.
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    아직 시공자가 배정되지 않았습니다.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 작업지시서 파일 섹션 */}
          {job.workInstructions && job.workInstructions.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    작업지시서 파일 ({job.workInstructions.length}개)
                  </Typography>
                  <Box>
                    {job.workInstructions.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 1,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          backgroundColor: 'white',
                          '&:hover': {
                            backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          {getFileIcon(file.fileType)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {file.fileName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatFileSize(file.fileSize)} • {file.fileType}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileDownload />}
                          onClick={() => handleFileDownload(file.fileUrl, file.fileName)}
                        >
                          다운로드
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  메타 정보
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      생성일
                    </Typography>
                    <Typography variant="body2">
                      {job.createdAt.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      수정일
                    </Typography>
                    <Typography variant="body2">
                      {job.updatedAt.toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 작업 진행 시간 기록 */}
          {job.progressHistory && job.progressHistory.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    작업 진행 시간 기록
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {job.progressHistory.map((step, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 2, 
                          mb: 1, 
                          border: '1px solid #f0f0f0', 
                          borderRadius: 1,
                          bgcolor: index === job.progressHistory!.length - 1 ? 
                            (theme) => theme.palette.mode === 'light' ? '#f8f9fa' : '#2d2d2d' : 
                            (theme) => theme.palette.mode === 'light' ? 'white' : '#1e1e1e'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={getStatusLabel(step.status)} 
                            color={getStatusColor(step.status) as any}
                            size="small"
                          />
                          <Typography variant="caption" color="textSecondary">
                            {step.timestamp.toLocaleString()}
                          </Typography>
                        </Box>
                        {step.note && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            메모: {step.note}
                          </Typography>
                        )}
                        {step.contractorId && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            시공자 ID: {step.contractorId}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobDetailDialog;
