import React, { useState } from 'react';
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
  Checkbox,
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
  Edit,
  Delete,
  CheckCircle,
  Error,
  Warning,
  AttachFile,
  Save,
  Cancel,
  FileDownload,
  Upload
} from '@mui/icons-material';
import { ExcelUploadService } from '../../../shared/services/excelUploadService';
import { ExcelJobData, WorkInstruction } from '../../../types';
import { StorageService } from '../../../shared/services/storageService';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService } from '../../../shared/services/customerService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { formatPhoneInput } from '../../../shared/utils/phoneFormatter';

const ExcelJobUpload: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ExcelJobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ExcelJobData | null>(null);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [selectedJobForFile, setSelectedJobForFile] = useState<ExcelJobData | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
      
      const uploadedJobs = await ExcelUploadService.parseExcelFile(file);
      setJobs(uploadedJobs);
      setSuccess(`${uploadedJobs.length}개의 작업이 업로드되었습니다.`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 작업 선택/해제
  const handleSelectJob = (jobId: string, selected: boolean) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, isSelected: selected } : job
    ));
  };

  // 전체 선택/해제
  const handleSelectAll = (selected: boolean) => {
    setJobs(prev => prev.map(job => ({ ...job, isSelected: selected })));
  };

  // 작업 수정
  const handleEditJob = (job: ExcelJobData) => {
    setEditingJob({ ...job });
    setEditDialogOpen(true);
  };

  // 작업 삭제
  const handleDeleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  // 작업 수정 저장
  const handleSaveJob = () => {
    if (!editingJob) return;

    // 데이터 검증
    if (!editingJob.title || !editingJob.address || !editingJob.customerName || !editingJob.customerPhone) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setJobs(prev => prev.map(job => 
      job.id === editingJob.id ? { ...editingJob, status: 'ready' } : job
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

  // 선택된 작업들 시공의뢰 등록
  const handleSubmitSelectedJobs = async () => {
    const selectedJobs = jobs.filter(job => job.isSelected && job.status === 'ready');
    
    if (selectedJobs.length === 0) {
      setError('등록할 작업을 선택해주세요.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      for (const job of selectedJobs) {
        // 고객 정보 저장
        let customerId = 'temp-customer-id';
        if (job.customerPhone) {
          try {
            customerId = await CustomerService.saveCustomerInfo({
              name: job.customerName,
              phone: job.customerPhone,
              address: job.address,
              rating: 0,
              totalJobs: 0
            });
          } catch (error) {
            console.error('고객 정보 저장 실패:', error);
            customerId = `temp-${Date.now()}`;
          }
        }

        // 시공일시 생성
        let scheduledDateTime: Date | undefined;
        if (job.scheduledDate && job.scheduledTime) {
          const [hours, minutes] = job.scheduledTime.split(':').map(Number);
          scheduledDateTime = new Date(job.scheduledDate);
          scheduledDateTime.setHours(hours, minutes, 0, 0);
        }

        // 작업 데이터 생성
        const jobData = {
          sellerId: user?.id || '',
          customerId: customerId,
          title: job.title,
          description: job.description,
          address: job.address,
          coordinates: { lat: 37.5665, lng: 126.9780 }, // 서울 시청 좌표 (기본값)
          budget: {
            min: job.budgetMin || 0,
            max: job.budgetMax || 0
          },
          items: [],
          status: 'pending' as const,
          scheduledDate: scheduledDateTime,
          isInternal: job.isInternal,
          workInstructions: job.workInstructions || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await JobService.createJob(jobData);
      }

      // 성공한 작업들 제거
      setJobs(prev => prev.filter(job => !job.isSelected || job.status !== 'ready'));
      setSuccess(`${selectedJobs.length}개의 작업이 성공적으로 등록되었습니다.`);
    } catch (error: any) {
      setError(`작업 등록 실패: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 전체 작업 시공의뢰 등록
  const handleSubmitAllJobs = async () => {
    const readyJobs = jobs.filter(job => job.status === 'ready');
    
    if (readyJobs.length === 0) {
      setError('등록할 준비된 작업이 없습니다.');
      return;
    }

    // 모든 준비된 작업을 선택
    setJobs(prev => prev.map(job => 
      job.status === 'ready' ? { ...job, isSelected: true } : job
    ));

    await handleSubmitSelectedJobs();
  };

  // 엑셀 내보내기
  const handleExportToExcel = () => {
    ExcelUploadService.exportJobsToExcel(jobs);
  };

  const readyJobsCount = jobs.filter(job => job.status === 'ready').length;
  const errorJobsCount = jobs.filter(job => job.status === 'error').length;
  const selectedJobsCount = jobs.filter(job => job.isSelected).length;

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
              <Grid item>
                <Chip 
                  label={`선택됨: ${selectedJobsCount}개`} 
                  color="info" 
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
              <Box>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmitAllJobs}
                  disabled={readyJobsCount === 0 || uploading}
                  sx={{ mr: 1 }}
                >
                  {uploading ? <CircularProgress size={20} /> : '전체 시공의뢰'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitSelectedJobs}
                  disabled={selectedJobsCount === 0 || uploading}
                >
                  {uploading ? <CircularProgress size={20} /> : '선택 시공의뢰'}
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={jobs.length > 0 && jobs.every(job => job.isSelected)}
                        indeterminate={jobs.some(job => job.isSelected) && !jobs.every(job => job.isSelected)}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>제목</TableCell>
                    <TableCell>고객명</TableCell>
                    <TableCell>주소</TableCell>
                    <TableCell>시공일시</TableCell>
                    <TableCell>예산</TableCell>
                    <TableCell>작업지시서</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={job.isSelected}
                          onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                          disabled={job.status === 'error'}
                        />
                      </TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {job.address}
                        </Typography>
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
                          {job.budgetMin && job.budgetMax
                            ? `${job.budgetMin.toLocaleString()} ~ ${job.budgetMax.toLocaleString()}원`
                            : '-'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditJob(job)}
                            disabled={job.status === 'error'}
                          >
                            <Edit />
                          </IconButton>
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
                  label="주소"
                  value={editingJob.address}
                  onChange={(e) => setEditingJob({ ...editingJob, address: e.target.value })}
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
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="최소예산"
                  type="number"
                  value={editingJob.budgetMin || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, budgetMin: Number(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="최대예산"
                  type="number"
                  value={editingJob.budgetMax || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, budgetMax: Number(e.target.value) || undefined })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingJob.isInternal}
                      onChange={(e) => setEditingJob({ ...editingJob, isInternal: e.target.checked })}
                    />
                  }
                  label="내부 작업"
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
    </Box>
  );
};

export default ExcelJobUpload;
