import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Delete,
  CheckCircle,
  Error,
  AttachFile,
  FileDownload,
  Upload
} from '@mui/icons-material';
import { ExcelUploadService } from '../../../shared/services/excelUploadService';
import { ExcelJobData, WorkInstruction } from '../../../types';
import { StorageService } from '../../../shared/services/storageService';
import { PricingService } from '../../../shared/services/pricingService';
import { SellerService } from '../../../shared/services/sellerService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { formatPhoneInput } from '../../../shared/utils/phoneFormatter';
import CreateJobDialog from '../components/CreateJobDialog';

const ExcelJobUpload: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ExcelJobData[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ExcelJobData | null>(null);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [selectedJobForFile, setSelectedJobForFile] = useState<ExcelJobData | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [selectedJobForCreate, setSelectedJobForCreate] = useState<ExcelJobData | null>(null);
  const [pricingItems, setPricingItems] = useState<any[]>([]);

  // 품목 목록 로드
  useEffect(() => {
    const loadPricingItems = async () => {
      try {
        const items = await PricingService.getAllItems();
        setPricingItems(items);
      } catch (error) {
        console.error('품목 목록 로드 실패:', error);
      }
    };

    loadPricingItems();
  }, []);

  // 템플릿 다운로드
  const handleDownloadTemplate = () => {
    ExcelUploadService.downloadTemplate();
  };

  // 엑셀 파일 업로드
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      
      let uploadedJobs = await ExcelUploadService.parseExcelFile(file);
      
      // 기본출장비와 픽업 정보 자동입력
      uploadedJobs = await Promise.all(uploadedJobs.map(async (job) => {
        // 기본출장비가 비어있으면 자동입력
        if (!job.travelFee) {
          try {
            const travelFee = await PricingService.getTravelFee();
            job.travelFee = travelFee;
          } catch (error) {
            console.error('기본출장비 가져오기 실패:', error);
            job.travelFee = 17000; // 기본값
          }
        }
        
        // 픽업 정보가 비어있으면 판매자 정보로 자동입력
        if (!job.pickupCompanyName || !job.pickupPhone || !job.pickupAddress) {
          try {
            const pickupInfo = await SellerService.getPickupInfo(user?.id || '');
            if (pickupInfo) {
              job.pickupCompanyName = job.pickupCompanyName || pickupInfo.companyName;
              job.pickupPhone = job.pickupPhone || pickupInfo.phone;
              job.pickupAddress = job.pickupAddress || pickupInfo.address;
            }
          } catch (error) {
            console.error('픽업 정보 가져오기 실패:', error);
          }
        }
        
        return job;
      }));
      
      setJobs(uploadedJobs);
      setSuccess(`${uploadedJobs.length}개의 작업이 업로드되었습니다.`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };



  // 작업 수정
  const handleEditJob = (job: ExcelJobData) => {
    setEditingJob({ ...job });
    setEditDialogOpen(true);
  };

  // 새작업등록 모달로 수정
  const handleEditWithCreateDialog = (job: ExcelJobData) => {
    setSelectedJobForCreate(job);
    setCreateJobDialogOpen(true);
  };

  // 작업 삭제
  const handleDeleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  // 작업 수정 저장
  const handleSaveJob = () => {
    if (!editingJob) return;

    // 데이터 검증
    if (!editingJob.customerName || !editingJob.customerPhone) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 제목 자동생성
    const autoTitle = ExcelUploadService.generateTitle(
      editingJob.scheduledDate,
      editingJob.scheduledTime,
      editingJob.customerAddress,
      editingJob.blindsQuantity,
      editingJob.curtainsQuantity
    );
    
    const updatedJob = { ...editingJob, title: autoTitle };

    setJobs(prev => prev.map(job => 
      job.id === editingJob.id ? { ...updatedJob, status: 'ready' } : job
    ));
    
    setEditDialogOpen(false);
    setEditingJob(null);
    setError('');
  };

  // 파일 업로드 다이얼로그 열기
  const handleOpenFileUpload = (job: ExcelJobData) => {
    setSelectedJobForFile(job);
    setFileUploadDialogOpen(true);
  };

  // 작업지시서 파일 업로드
  const handleWorkInstructionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedJobForFile) return;

    try {
      setUploadingFiles(true);
      const uploadedFiles: WorkInstruction[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`파일 ${file.name}이 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.`);
          continue;
        }

        // 파일 타입 확인
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          setError(`파일 ${file.name}의 형식이 지원되지 않습니다. 이미지, PDF, Word 파일만 업로드 가능합니다.`);
          continue;
        }

        // Firebase Storage에 업로드
        const fileUrl = await StorageService.uploadFile(file, 'work-instructions');
        
        const workInstruction: WorkInstruction = {
          id: Date.now().toString() + i,
          fileName: file.name,
          fileUrl,
          fileType: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
          fileSize: file.size,
          uploadedAt: new Date(),
          uploadedBy: user?.id || ''
        };

        uploadedFiles.push(workInstruction);
      }

      // 작업에 파일 추가
      setJobs(prev => prev.map(job => 
        job.id === selectedJobForFile.id 
          ? { 
              ...job, 
              workInstructions: [...(job.workInstructions || []), ...uploadedFiles] 
            } 
          : job
      ));

      setError('');
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setError('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
    }
  };

  // 파일 삭제
  const handleDeleteFile = (jobId: string, fileId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            workInstructions: job.workInstructions?.filter(file => file.id !== fileId) || [] 
          } 
        : job
    ));
  };



  // 엑셀 내보내기
  const handleExportToExcel = () => {
    ExcelUploadService.exportJobsToExcel(jobs);
  };

  const readyJobsCount = jobs.filter(job => job.status === 'ready').length;
  const errorJobsCount = jobs.filter(job => job.status === 'error').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        시공의뢰 (엑셀 업로드)
      </Typography>

      {/* 업로드 섹션 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            엑셀 파일 업로드
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
              >
                템플릿 다운로드
              </Button>
            </Grid>
            <Grid item>
              <Typography variant="body2" color="textSecondary">
                📋 템플릿에는 다음 필드들이 포함됩니다: 제목, 설명, 시공주소, 시공일시, 고객정보, 예산, 픽업정보 등
              </Typography>
            </Grid>
            <Grid item>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="excel-file-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="excel-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : '엑셀 파일 업로드'}
                </Button>
              </label>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={handleExportToExcel}
                disabled={jobs.length === 0}
              >
                엑셀 내보내기
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 통계 정보 */}
      {jobs.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              업로드 현황
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Chip 
                  label={`전체: ${jobs.length}개`} 
                  color="primary" 
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`준비완료: ${readyJobsCount}개`} 
                  color="success" 
                  icon={<CheckCircle />}
                />
              </Grid>
              <Grid item>
                <Chip 
                  label={`오류: ${errorJobsCount}개`} 
                  color="error" 
                  icon={<Error />}
                />
              </Grid>

            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 작업 목록 */}
      {jobs.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                업로드된 작업 목록
              </Typography>
              <Typography variant="body2" color="textSecondary">
                행을 클릭하면 새작업등록 모달이 열립니다
              </Typography>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>상태</TableCell>
                    <TableCell>제목</TableCell>
                    <TableCell>고객정보</TableCell>
                    <TableCell>시공일시</TableCell>
                    <TableCell>품목수량</TableCell>
                    <TableCell>총예산</TableCell>
                    <TableCell>픽업정보</TableCell>
                    <TableCell>작업지시서</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow 
                      key={job.id}
                      onClick={() => handleEditWithCreateDialog(job)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={job.status === 'ready' ? '준비완료' : job.status === 'error' ? '오류' : '대기중'}
                          color={job.status === 'ready' ? 'success' : job.status === 'error' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {job.title}
                        </Typography>
                        {job.errorMessage && (
                          <Typography variant="caption" color="error" display="block">
                            {job.errorMessage}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.customerName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {job.customerPhone}
                        </Typography>
                        {job.customerAddress && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {job.customerAddress}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.scheduledDate && job.scheduledTime 
                            ? `${job.scheduledDate} ${job.scheduledTime}`
                            : '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {[
                            job.blindsQuantity ? `블라인드 ${job.blindsQuantity}창` : '',
                            job.curtainsQuantity ? `커튼 ${job.curtainsQuantity}조` : ''
                          ].filter(Boolean).join(', ') || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {(() => {
                            let total = job.travelFee || 0;
                            
                            // 블라인드 금액 계산 (실제 가격 사용)
                            if (job.blindsQuantity && job.blindsQuantity > 0) {
                              const blindsItem = pricingItems.find(item => item.name === '블라인드');
                              const blindsPrice = blindsItem ? blindsItem.basePrice : 50000;
                              total += job.blindsQuantity * blindsPrice;
                            }
                            
                            // 커튼 금액 계산 (실제 가격 사용)
                            if (job.curtainsQuantity && job.curtainsQuantity > 0) {
                              const curtainsItem = pricingItems.find(item => item.name === '커튼');
                              const curtainsPrice = curtainsItem ? curtainsItem.basePrice : 80000;
                              total += job.curtainsQuantity * curtainsPrice;
                            }
                            
                            return `${total.toLocaleString()}원`;
                          })()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.pickupCompanyName || '-'}
                        </Typography>
                        {job.pickupPhone && (
                          <Typography variant="caption" color="textSecondary">
                            {job.pickupPhone}
                          </Typography>
                        )}
                        {job.pickupScheduledDate && job.pickupScheduledTime && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {job.pickupScheduledDate} {job.pickupScheduledTime}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {job.workInstructions?.length || 0}개
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenFileUpload(job)}
                            disabled={job.status === 'error'}
                          >
                            <AttachFile />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 작업 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>작업 수정</DialogTitle>
        <DialogContent>
          {editingJob && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="고객주소"
                  value={editingJob.customerAddress || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, customerAddress: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="시공일"
                  type="date"
                  value={editingJob.scheduledDate || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, scheduledDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="시공시간"
                  type="time"
                  value={editingJob.scheduledTime || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, scheduledTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="고객명"
                  value={editingJob.customerName}
                  onChange={(e) => setEditingJob({ ...editingJob, customerName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="고객연락처"
                  value={editingJob.customerPhone}
                  onChange={(e) => setEditingJob({ ...editingJob, customerPhone: formatPhoneInput(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="고객주소"
                  value={editingJob.customerAddress || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, customerAddress: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="블라인드 수량"
                  type="number"
                  value={editingJob.blindsQuantity || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, blindsQuantity: Number(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="커튼 수량"
                  type="number"
                  value={editingJob.curtainsQuantity || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, curtainsQuantity: Number(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="작업설명"
                  value={editingJob.description || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              
              {/* 픽업 정보 섹션 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  픽업 정보
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="픽업 상호"
                  value={editingJob.pickupCompanyName || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, pickupCompanyName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="픽업 연락처"
                  value={editingJob.pickupPhone || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, pickupPhone: formatPhoneInput(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="픽업 주소"
                  value={editingJob.pickupAddress || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, pickupAddress: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="준비예정일"
                  type="date"
                  value={editingJob.pickupScheduledDate || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, pickupScheduledDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="준비예정시간"
                  type="time"
                  value={editingJob.pickupScheduledTime || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, pickupScheduledTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveJob} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      {/* 파일 업로드 다이얼로그 */}
      <Dialog open={fileUploadDialogOpen} onClose={() => setFileUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>작업지시서 파일 업로드</DialogTitle>
        <DialogContent>
          {selectedJobForFile && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {selectedJobForFile.title}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="work-instruction-file-upload"
                  multiple
                  type="file"
                  onChange={handleWorkInstructionUpload}
                />
                <label htmlFor="work-instruction-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                    disabled={uploadingFiles}
                  >
                    파일 선택
                  </Button>
                </label>
              </Box>

              {selectedJobForFile.workInstructions && selectedJobForFile.workInstructions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    첨부된 파일 ({selectedJobForFile.workInstructions.length}개)
                  </Typography>
                  <List dense>
                    {selectedJobForFile.workInstructions.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemText
                          primary={file.fileName}
                          secondary={`${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteFile(selectedJobForFile.id, file.id)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileUploadDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 새작업등록 모달 */}
      <CreateJobDialog
        open={createJobDialogOpen}
        onClose={() => {
          setCreateJobDialogOpen(false);
          setSelectedJobForCreate(null);
        }}
        onJobCreated={() => {
          setCreateJobDialogOpen(false);
          setSelectedJobForCreate(null);
          // 성공한 작업 제거
          if (selectedJobForCreate) {
            setJobs(prev => prev.filter(job => job.id !== selectedJobForCreate.id));
          }
        }}
        excelJobData={selectedJobForCreate || undefined}
      />
    </Box>
  );
};

export default ExcelJobUpload;
