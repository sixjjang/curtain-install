import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, Star } from '@mui/icons-material';
import { LevelService } from '../../../shared/services/levelService';
import { ContractorLevel } from '../../../types';

const LevelManagement: React.FC = () => {
  const [levels, setLevels] = useState<ContractorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ContractorLevel | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 폼 상태
  const [formData, setFormData] = useState({
    level: 1,
    name: '',
    commissionRate: 15,
    hourlyRateMultiplier: 1.0,
    benefits: [''],
    requirements: {
      minExperience: 0,
      minJobs: 0,
      minRating: 0
    },
    isActive: true
  });

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const levelsData = await LevelService.getAllLevels();
      setLevels(levelsData);
    } catch (error) {
      console.error('레벨 목록 가져오기 실패:', error);
      setSnackbar({
        open: true,
        message: '레벨 목록을 가져오는데 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (level?: ContractorLevel) => {
    if (level) {
      setEditingLevel(level);
      setFormData({
        level: level.level,
        name: level.name,
        commissionRate: level.commissionRate,
        hourlyRateMultiplier: level.hourlyRateMultiplier,
        benefits: [...level.benefits],
        requirements: { ...level.requirements },
        isActive: level.isActive
      });
    } else {
      setEditingLevel(null);
      setFormData({
        level: 1,
        name: '',
        commissionRate: 15,
        hourlyRateMultiplier: 1.0,
        benefits: [''],
        requirements: {
          minExperience: 0,
          minJobs: 0,
          minRating: 0
        },
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLevel(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingLevel) {
        await LevelService.updateLevel(editingLevel.id, formData);
        setSnackbar({
          open: true,
          message: '레벨이 성공적으로 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await LevelService.createLevel(formData);
        setSnackbar({
          open: true,
          message: '레벨이 성공적으로 생성되었습니다.',
          severity: 'success'
        });
      }
      handleCloseDialog();
      fetchLevels();
    } catch (error) {
      console.error('레벨 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '레벨 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (levelId: string) => {
    if (window.confirm('정말로 이 레벨을 삭제하시겠습니까?')) {
      try {
        await LevelService.deleteLevel(levelId);
        setSnackbar({
          open: true,
          message: '레벨이 성공적으로 삭제되었습니다.',
          severity: 'success'
        });
        fetchLevels();
      } catch (error) {
        console.error('레벨 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '레벨 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const handleCreateDefaultLevels = async () => {
    if (window.confirm('기본 레벨을 생성하시겠습니까? 기존 레벨이 있다면 중복될 수 있습니다.')) {
      try {
        await LevelService.createDefaultLevels();
        setSnackbar({
          open: true,
          message: '기본 레벨이 성공적으로 생성되었습니다.',
          severity: 'success'
        });
        fetchLevels();
      } catch (error) {
        console.error('기본 레벨 생성 실패:', error);
        setSnackbar({
          open: true,
          message: '기본 레벨 생성에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({ ...formData, benefits: newBenefits });
  };

  const addBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, '']
    });
  };

  const removeBenefit = (index: number) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData({ ...formData, benefits: newBenefits });
  };

  if (loading) {
    return (
      <Box>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleCreateDefaultLevels}
          >
            기본 레벨 생성
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            새 레벨 추가
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>레벨</TableCell>
                  <TableCell>명칭</TableCell>
                  <TableCell>수수료율</TableCell>
                  <TableCell>시급 배수</TableCell>
                  <TableCell>최소 경력</TableCell>
                  <TableCell>최소 작업수</TableCell>
                  <TableCell>최소 평점</TableCell>
                  <TableCell>혜택</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Star color="primary" />
                        <Typography variant="h6">{level.level}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {level.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${level.commissionRate}%`} 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {level.hourlyRateMultiplier}x
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {level.requirements.minExperience}개월
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {level.requirements.minJobs}건
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2">
                          {level.requirements.minRating}
                        </Typography>
                        <Star fontSize="small" color="warning" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        {level.benefits.slice(0, 2).map((benefit, index) => (
                          <Chip
                            key={index}
                            label={benefit}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {level.benefits.length > 2 && (
                          <Chip
                            label={`+${level.benefits.length - 2}개 더`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={level.isActive ? '활성' : '비활성'}
                        color={level.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(level)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(level.id)}
                          color="error"
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

      {/* 레벨 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLevel ? '레벨 수정' : '새 레벨 추가'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Box display="flex" gap={2}>
              <TextField
                label="레벨"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                fullWidth
              />
              <TextField
                label="레벨 명칭"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                placeholder="예: 신입시공자, 최고급시공자"
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="수수료율 (%)"
                type="number"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 100 }}
              />
              <TextField
                label="시급 배수"
                type="number"
                value={formData.hourlyRateMultiplier}
                onChange={(e) => setFormData({ ...formData, hourlyRateMultiplier: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0.1 }}
              />
            </Box>

            <Typography variant="h6">요구사항</Typography>
            <Box display="flex" gap={2}>
              <TextField
                label="최소 경력 (개월)"
                type="number"
                value={formData.requirements.minExperience}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: {
                    ...formData.requirements,
                    minExperience: parseInt(e.target.value)
                  }
                })}
                fullWidth
              />
              <TextField
                label="최소 완료 작업수"
                type="number"
                value={formData.requirements.minJobs}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: {
                    ...formData.requirements,
                    minJobs: parseInt(e.target.value)
                  }
                })}
                fullWidth
              />
              <TextField
                label="최소 평점"
                type="number"
                value={formData.requirements.minRating}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: {
                    ...formData.requirements,
                    minRating: parseFloat(e.target.value)
                  }
                })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 5 }}
              />
            </Box>

            <Typography variant="h6">혜택</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {formData.benefits.map((benefit, index) => (
                <Box key={index} display="flex" gap={1} alignItems="center">
                  <TextField
                    label={`혜택 ${index + 1}`}
                    value={benefit}
                    onChange={(e) => handleBenefitChange(index, e.target.value)}
                    fullWidth
                    placeholder="예: 우선 매칭, 수수료 할인"
                  />
                  {formData.benefits.length > 1 && (
                    <IconButton
                      onClick={() => removeBenefit(index)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={addBenefit}
                startIcon={<Add />}
                sx={{ alignSelf: 'flex-start' }}
              >
                혜택 추가
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="활성 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLevel ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default LevelManagement;
