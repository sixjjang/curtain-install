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
  Divider,
  Collapse
} from '@mui/material';
import { Add, Edit, Delete, Star, Settings, Warning, ExpandMore, ExpandLess } from '@mui/icons-material';
import { LevelService } from '../../../shared/services/levelService';
import { RatingPolicyService } from '../../../shared/services/ratingPolicyService';
import { ContractorLevel, RatingBasedCommissionPolicy, RatingBasedSuspensionPolicy } from '../../../types';

const LevelManagement: React.FC = () => {
  const [levels, setLevels] = useState<ContractorLevel[]>([]);
  const [commissionPolicies, setCommissionPolicies] = useState<RatingBasedCommissionPolicy[]>([]);
  const [suspensionPolicies, setSuspensionPolicies] = useState<RatingBasedSuspensionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ContractorLevel | null>(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [suspensionDialogOpen, setSuspensionDialogOpen] = useState(false);
  const [editingCommissionPolicy, setEditingCommissionPolicy] = useState<RatingBasedCommissionPolicy | null>(null);
  const [editingSuspensionPolicy, setEditingSuspensionPolicy] = useState<RatingBasedSuspensionPolicy | null>(null);
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
    completedJobsCount: 0,
    benefits: [''],
    isActive: true
  });

  // 평점 기반 수수료율 정책 폼 상태
  const [commissionFormData, setCommissionFormData] = useState({
    minRating: 0,
    maxRating: 5.0,
    commissionRate: 3,
    description: '',
    isActive: true
  });

  // 평점 기반 정지 정책 폼 상태
  const [suspensionFormData, setSuspensionFormData] = useState({
    minRating: 0,
    maxRating: 5.0,
    suspensionDays: 0,
    description: '',
    isActive: true
  });

  // 접기/펴기 상태 관리
  const [levelsExpanded, setLevelsExpanded] = useState(true);
  const [commissionPoliciesExpanded, setCommissionPoliciesExpanded] = useState(true);
  const [suspensionPoliciesExpanded, setSuspensionPoliciesExpanded] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const [levelsData, commissionPoliciesData, suspensionPoliciesData] = await Promise.all([
        LevelService.getAllLevels(),
        RatingPolicyService.getCommissionPolicies(),
        RatingPolicyService.getSuspensionPolicies()
      ]);
      setLevels(levelsData);
      setCommissionPolicies(commissionPoliciesData);
      setSuspensionPolicies(suspensionPoliciesData);
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      setSnackbar({
        open: true,
        message: '데이터를 가져오는데 실패했습니다.',
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
        completedJobsCount: level.completedJobsCount,
        benefits: [...level.benefits],
        isActive: level.isActive
      });
    } else {
      setEditingLevel(null);
      setFormData({
        level: 1,
        name: '',
        completedJobsCount: 0,
        benefits: [''],
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

  // 평점 기반 수수료율 정책 관리
  const handleOpenCommissionDialog = (policy?: RatingBasedCommissionPolicy) => {
    if (policy) {
      setEditingCommissionPolicy(policy);
      setCommissionFormData({
        minRating: policy.minRating,
        maxRating: policy.maxRating || 5.0,
        commissionRate: policy.commissionRate,
        description: policy.description,
        isActive: policy.isActive
      });
    } else {
      setEditingCommissionPolicy(null);
      setCommissionFormData({
        minRating: 0,
        maxRating: 5.0,
        commissionRate: 3,
        description: '',
        isActive: true
      });
    }
    setCommissionDialogOpen(true);
  };

  const handleSaveCommissionPolicy = async () => {
    try {
      if (editingCommissionPolicy) {
        await RatingPolicyService.updateCommissionPolicy(editingCommissionPolicy.id, commissionFormData);
        setSnackbar({
          open: true,
          message: '수수료율 정책이 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await RatingPolicyService.createCommissionPolicy(commissionFormData);
        setSnackbar({
          open: true,
          message: '수수료율 정책이 생성되었습니다.',
          severity: 'success'
        });
      }
      setCommissionDialogOpen(false);
      fetchLevels();
    } catch (error) {
      console.error('수수료율 정책 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '수수료율 정책 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDeleteCommissionPolicy = async (id: string) => {
    if (window.confirm('이 수수료율 정책을 삭제하시겠습니까?')) {
      try {
        await RatingPolicyService.deleteCommissionPolicy(id);
        setSnackbar({
          open: true,
          message: '수수료율 정책이 삭제되었습니다.',
          severity: 'success'
        });
        fetchLevels();
      } catch (error) {
        console.error('수수료율 정책 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '수수료율 정책 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  // 평점 기반 정지 정책 관리
  const handleOpenSuspensionDialog = (policy?: RatingBasedSuspensionPolicy) => {
    if (policy) {
      setEditingSuspensionPolicy(policy);
      setSuspensionFormData({
        minRating: policy.minRating,
        maxRating: policy.maxRating || 5.0,
        suspensionDays: policy.suspensionDays,
        description: policy.description,
        isActive: policy.isActive
      });
    } else {
      setEditingSuspensionPolicy(null);
      setSuspensionFormData({
        minRating: 0,
        maxRating: 5.0,
        suspensionDays: 0,
        description: '',
        isActive: true
      });
    }
    setSuspensionDialogOpen(true);
  };

  const handleSaveSuspensionPolicy = async () => {
    try {
      if (editingSuspensionPolicy) {
        await RatingPolicyService.updateSuspensionPolicy(editingSuspensionPolicy.id, suspensionFormData);
        setSnackbar({
          open: true,
          message: '정지 정책이 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await RatingPolicyService.createSuspensionPolicy(suspensionFormData);
        setSnackbar({
          open: true,
          message: '정지 정책이 생성되었습니다.',
          severity: 'success'
        });
      }
      setSuspensionDialogOpen(false);
      fetchLevels();
    } catch (error) {
      console.error('정지 정책 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '정지 정책 저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const handleDeleteSuspensionPolicy = async (id: string) => {
    if (window.confirm('이 정지 정책을 삭제하시겠습니까?')) {
      try {
        await RatingPolicyService.deleteSuspensionPolicy(id);
        setSnackbar({
          open: true,
          message: '정지 정책이 삭제되었습니다.',
          severity: 'success'
        });
        fetchLevels();
      } catch (error) {
        console.error('정지 정책 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '정지 정책 삭제에 실패했습니다.',
          severity: 'error'
        });
      }
    }
  };

  // 기본 정책 초기화
  const handleInitializeDefaultPolicies = async () => {
    if (window.confirm('기본 정책으로 초기화하시겠습니까? 기존 정책이 모두 삭제됩니다.')) {
      try {
        await RatingPolicyService.initializeDefaultPolicies();
        setSnackbar({
          open: true,
          message: '기본 정책이 초기화되었습니다.',
          severity: 'success'
        });
        fetchLevels();
      } catch (error) {
        console.error('기본 정책 초기화 실패:', error);
        setSnackbar({
          open: true,
          message: '기본 정책 초기화에 실패했습니다.',
          severity: 'error'
        });
      }
    }
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
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="primary" />
              레벨 관리
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setLevelsExpanded(!levelsExpanded)}
                startIcon={levelsExpanded ? <ExpandLess /> : <ExpandMore />}
              >
                {levelsExpanded ? '접기' : '펴기'}
              </Button>
            </Box>
          </Box>
          
          <Collapse in={levelsExpanded}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>레벨</TableCell>
                    <TableCell>명칭</TableCell>
                    <TableCell>완료 시공건 수</TableCell>
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
                        <Typography variant="body2">
                          {level.completedJobsCount}건
                        </Typography>
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
          </Collapse>
        </CardContent>
      </Card>

      {/* 평점 기반 정책 관리 섹션 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          평점 기반 정책 관리
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={handleInitializeDefaultPolicies}
              color="warning"
            >
              기본 정책 초기화
            </Button>
          </Box>
        </Box>

        {/* 평점 기반 수수료율 정책 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                평점 기반 수수료율 정책
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCommissionPoliciesExpanded(!commissionPoliciesExpanded)}
                  startIcon={commissionPoliciesExpanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {commissionPoliciesExpanded ? '접기' : '펴기'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenCommissionDialog()}
                  size="small"
                >
                  정책 추가
                </Button>
              </Box>
            </Box>
            
            <Collapse in={commissionPoliciesExpanded}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>평점 범위</TableCell>
                      <TableCell>수수료율</TableCell>
                      <TableCell>설명</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commissionPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {policy.minRating}점 ~ {policy.maxRating}점
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${policy.commissionRate}%`} 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {policy.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={policy.isActive ? '활성' : '비활성'}
                            color={policy.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenCommissionDialog(policy)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCommissionPolicy(policy.id)}
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
            </Collapse>
          </CardContent>
        </Card>

        {/* 평점 기반 정지 정책 */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                평점 기반 정지 정책
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSuspensionPoliciesExpanded(!suspensionPoliciesExpanded)}
                  startIcon={suspensionPoliciesExpanded ? <ExpandLess /> : <ExpandMore />}
                >
                  {suspensionPoliciesExpanded ? '접기' : '펴기'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenSuspensionDialog()}
                  size="small"
                >
                  정책 추가
                </Button>
              </Box>
            </Box>
            
            <Collapse in={suspensionPoliciesExpanded}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>평점 범위</TableCell>
                      <TableCell>정지 일수</TableCell>
                      <TableCell>설명</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suspensionPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {policy.minRating}점 ~ {policy.maxRating}점
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={policy.suspensionDays === -1 ? '영구정지' : `${policy.suspensionDays}일`} 
                            color={policy.suspensionDays === -1 ? 'error' : 'warning'} 
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {policy.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={policy.isActive ? '활성' : '비활성'}
                            color={policy.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenSuspensionDialog(policy)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSuspensionPolicy(policy.id)}
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
            </Collapse>
          </CardContent>
        </Card>
      </Box>

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

            <TextField
              label="완료 시공건 수"
              type="number"
              value={formData.completedJobsCount}
              onChange={(e) => setFormData({ ...formData, completedJobsCount: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="이 레벨로 업그레이드되기 위해 필요한 완료 시공건 수를 입력하세요"
            />

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

      {/* 평점 기반 수수료율 정책 다이얼로그 */}
      <Dialog open={commissionDialogOpen} onClose={() => setCommissionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCommissionPolicy ? '수수료율 정책 수정' : '새 수수료율 정책 추가'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Box display="flex" gap={2}>
              <TextField
                label="최소 평점"
                type="number"
                value={commissionFormData.minRating}
                onChange={(e) => setCommissionFormData({ ...commissionFormData, minRating: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 5 }}
              />
              <TextField
                label="최대 평점"
                type="number"
                value={commissionFormData.maxRating}
                onChange={(e) => setCommissionFormData({ ...commissionFormData, maxRating: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 5 }}
              />
            </Box>
            
            <TextField
              label="수수료율 (%)"
              type="number"
              value={commissionFormData.commissionRate}
              onChange={(e) => setCommissionFormData({ ...commissionFormData, commissionRate: parseFloat(e.target.value) })}
              fullWidth
              inputProps={{ step: 0.1, min: 0, max: 100 }}
            />
            
            <TextField
              label="설명"
              value={commissionFormData.description}
              onChange={(e) => setCommissionFormData({ ...commissionFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="예: 평점 4.5점 이상 - 수수료율 0%"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={commissionFormData.isActive}
                  onChange={(e) => setCommissionFormData({ ...commissionFormData, isActive: e.target.checked })}
                />
              }
              label="활성 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommissionDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveCommissionPolicy} variant="contained">
            {editingCommissionPolicy ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 평점 기반 정지 정책 다이얼로그 */}
      <Dialog open={suspensionDialogOpen} onClose={() => setSuspensionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSuspensionPolicy ? '정지 정책 수정' : '새 정지 정책 추가'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Box display="flex" gap={2}>
              <TextField
                label="최소 평점"
                type="number"
                value={suspensionFormData.minRating}
                onChange={(e) => setSuspensionFormData({ ...suspensionFormData, minRating: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 5 }}
              />
              <TextField
                label="최대 평점"
                type="number"
                value={suspensionFormData.maxRating}
                onChange={(e) => setSuspensionFormData({ ...suspensionFormData, maxRating: parseFloat(e.target.value) })}
                fullWidth
                inputProps={{ step: 0.1, min: 0, max: 5 }}
              />
            </Box>
            
            <TextField
              label="정지 일수"
              type="number"
              value={suspensionFormData.suspensionDays}
              onChange={(e) => setSuspensionFormData({ ...suspensionFormData, suspensionDays: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: -1 }}
              helperText="-1: 영구정지, 0: 정지 없음, 양수: 정지 일수"
            />
            
            <TextField
              label="설명"
              value={suspensionFormData.description}
              onChange={(e) => setSuspensionFormData({ ...suspensionFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="예: 평점 3.5점 미만 - 신규 시공건 수락 정지 2일"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={suspensionFormData.isActive}
                  onChange={(e) => setSuspensionFormData({ ...suspensionFormData, isActive: e.target.checked })}
                />
              }
              label="활성 상태"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspensionDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveSuspensionPolicy} variant="contained">
            {editingSuspensionPolicy ? '수정' : '추가'}
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
