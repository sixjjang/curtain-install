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
  Calculate as CalculateIcon
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
            AuthService.getUserById(job.customerId)
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
      cancelled: 'error'
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
      cancelled: '취소'
    };
    return statusLabels[status];
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
                  {job.budget.min.toLocaleString()} ~ {job.budget.max.toLocaleString()}만원
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
                          bgcolor: index === job.progressHistory!.length - 1 ? '#f8f9fa' : 'white'
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
