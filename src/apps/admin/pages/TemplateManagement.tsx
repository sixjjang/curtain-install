import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { TemplateService } from '../../../shared/services/templateService';
import { JobDescriptionTemplate, JobRequirementBadge } from '../../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TemplateManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [descriptionTemplates, setDescriptionTemplates] = useState<JobDescriptionTemplate[]>([]);
  const [requirementBadges, setRequirementBadges] = useState<JobRequirementBadge[]>([]);
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

  // 설명 템플릿 관련 상태
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<JobDescriptionTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    content: '',
    category: 'general' as JobDescriptionTemplate['category'],
    isActive: true
  });

  // 뱃지 관련 상태
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<JobRequirementBadge | null>(null);
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    description: '',
    color: 'primary' as JobRequirementBadge['color'],
    icon: '',
    isActive: true
  });

  // 만족도 조사 항목 관련 상태
  const [surveyItems, setSurveyItems] = useState<any[]>([]);
  const [surveyItemDialogOpen, setSurveyItemDialogOpen] = useState(false);
  const [editingSurveyItem, setEditingSurveyItem] = useState<any | null>(null);
  const [surveyItemForm, setSurveyItemForm] = useState({
    question: '',
    type: 'rating' as 'rating' | 'text' | 'choice',
    options: [''],
    isRequired: true,
    order: 1,
    isActive: true
  });

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templates, badges, surveyItemsData] = await Promise.all([
        TemplateService.getAllDescriptionTemplates(),
        TemplateService.getAllRequirementBadges(),
        TemplateService.getAllSurveyItems()
      ]);
      setDescriptionTemplates(templates);
      setRequirementBadges(badges);
      setSurveyItems(surveyItemsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setSnackbar({
        open: true,
        message: '데이터 로드에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 설명 템플릿 관련 핸들러
  const handleTemplateFormChange = (field: string, value: string | boolean) => {
    setTemplateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSubmit = async () => {
    try {
      setLoading(true);
      if (editingTemplate) {
        await TemplateService.updateDescriptionTemplate(editingTemplate.id, templateForm);
        setSnackbar({
          open: true,
          message: '설명 템플릿이 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await TemplateService.saveDescriptionTemplate(templateForm);
        setSnackbar({
          open: true,
          message: '설명 템플릿이 저장되었습니다.',
          severity: 'success'
        });
      }
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm({ title: '', content: '', category: 'general', isActive: true });
      loadData();
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '템플릿 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateEdit = (template: JobDescriptionTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      content: template.content,
      category: template.category,
      isActive: template.isActive
    });
    setTemplateDialogOpen(true);
  };

  const handleTemplateDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        await TemplateService.deleteDescriptionTemplate(id);
        setSnackbar({
          open: true,
          message: '설명 템플릿이 삭제되었습니다.',
          severity: 'success'
        });
        loadData();
      } catch (error) {
        console.error('템플릿 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '템플릿 삭제에 실패했습니다.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // 뱃지 관련 핸들러
  const handleBadgeFormChange = (field: string, value: string | boolean) => {
    setBadgeForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBadgeSubmit = async () => {
    try {
      setLoading(true);
      if (editingBadge) {
        await TemplateService.updateRequirementBadge(editingBadge.id, badgeForm);
        setSnackbar({
          open: true,
          message: '뱃지가 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await TemplateService.saveRequirementBadge(badgeForm);
        setSnackbar({
          open: true,
          message: '뱃지가 저장되었습니다.',
          severity: 'success'
        });
      }
      setBadgeDialogOpen(false);
      setEditingBadge(null);
      setBadgeForm({ name: '', description: '', color: 'primary', icon: '', isActive: true });
      loadData();
    } catch (error) {
      console.error('뱃지 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '뱃지 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeEdit = (badge: JobRequirementBadge) => {
    setEditingBadge(badge);
    setBadgeForm({
      name: badge.name,
      description: badge.description,
      color: badge.color,
      icon: badge.icon || '',
      isActive: badge.isActive
    });
    setBadgeDialogOpen(true);
  };

  const handleBadgeDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        await TemplateService.deleteRequirementBadge(id);
        setSnackbar({
          open: true,
          message: '뱃지가 삭제되었습니다.',
          severity: 'success'
        });
        loadData();
      } catch (error) {
        console.error('뱃지 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '뱃지 삭제에 실패했습니다.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // 만족도 조사 항목 관련 핸들러
  const handleSurveyItemFormChange = (field: string, value: any) => {
    setSurveyItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSurveyItemSubmit = async () => {
    try {
      setLoading(true);
      if (editingSurveyItem) {
        await TemplateService.updateSurveyItem(editingSurveyItem.id, surveyItemForm);
        setSnackbar({
          open: true,
          message: '만족도 조사 항목이 수정되었습니다.',
          severity: 'success'
        });
      } else {
        await TemplateService.saveSurveyItem(surveyItemForm);
        setSnackbar({
          open: true,
          message: '만족도 조사 항목이 저장되었습니다.',
          severity: 'success'
        });
      }
      setSurveyItemDialogOpen(false);
      setEditingSurveyItem(null);
      setSurveyItemForm({ 
        question: '', 
        type: 'rating', 
        options: [''], 
        isRequired: true, 
        order: 1, 
        isActive: true 
      });
      loadData();
    } catch (error) {
      console.error('만족도 조사 항목 저장 실패:', error);
      setSnackbar({
        open: true,
        message: '만족도 조사 항목 저장에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyItemEdit = (item: any) => {
    setEditingSurveyItem(item);
    setSurveyItemForm({
      question: item.question,
      type: item.type,
      options: item.options || [''],
      isRequired: item.isRequired,
      order: item.order,
      isActive: item.isActive
    });
    setSurveyItemDialogOpen(true);
  };

  const handleSurveyItemDelete = async (id: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        await TemplateService.deleteSurveyItem(id);
        setSnackbar({
          open: true,
          message: '만족도 조사 항목이 삭제되었습니다.',
          severity: 'success'
        });
        loadData();
      } catch (error) {
        console.error('만족도 조사 항목 삭제 실패:', error);
        setSnackbar({
          open: true,
          message: '만족도 조사 항목 삭제에 실패했습니다.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        템플릿 관리
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="설명 템플릿" />
            <Tab label="요구사항 뱃지" />
            <Tab label="만족도 조사 항목" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">자주 사용하는 설명 예시</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTemplateDialogOpen(true)}
            >
              템플릿 추가
            </Button>
          </Box>

          <List>
            {descriptionTemplates.map((template) => (
              <React.Fragment key={template.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">{template.title}</Typography>
                        <Chip 
                          label={template.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        {!template.isActive && (
                          <Chip label="비활성" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {template.content}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          생성일: {template.createdAt.toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleTemplateEdit(template)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleTemplateDelete(template.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">작업 요구사항 뱃지</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setBadgeDialogOpen(true)}
            >
              뱃지 추가
            </Button>
          </Box>

          <Grid container spacing={2}>
            {requirementBadges.map((badge) => (
              <Grid item xs={12} sm={6} md={4} key={badge.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Chip 
                          label={badge.name} 
                          color={badge.color} 
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          {badge.description}
                        </Typography>
                        {!badge.isActive && (
                          <Chip label="비활성" size="small" color="error" sx={{ mt: 1 }} />
                        )}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleBadgeEdit(badge)}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleBadgeDelete(badge.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">만족도 조사 항목 설정</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSurveyItemDialogOpen(true)}
            >
              항목 추가
            </Button>
          </Box>

          <List>
            {surveyItems.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">{item.question}</Typography>
                        <Chip 
                          label={item.type === 'rating' ? '평점' : item.type === 'text' ? '텍스트' : '선택'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                        {item.isRequired && (
                          <Chip label="필수" size="small" color="error" />
                        )}
                        {!item.isActive && (
                          <Chip label="비활성" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          순서: {item.order} | 타입: {item.type}
                        </Typography>
                        {item.options && item.options.length > 0 && item.options[0] !== '' && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            옵션: {item.options.join(', ')}
                          </Typography>
                        )}
                        <Typography variant="caption" color="textSecondary">
                          생성일: {item.createdAt?.toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleSurveyItemEdit(item)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleSurveyItemDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>
      </Card>

      {/* 설명 템플릿 다이얼로그 */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? '설명 템플릿 수정' : '설명 템플릿 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="제목"
                value={templateForm.title}
                onChange={(e) => handleTemplateFormChange('title', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={templateForm.category}
                  onChange={(e) => handleTemplateFormChange('category', e.target.value)}
                  label="카테고리"
                >
                  <MenuItem value="general">일반</MenuItem>
                  <MenuItem value="curtain">커튼</MenuItem>
                  <MenuItem value="blind">블라인드</MenuItem>
                  <MenuItem value="cleaning">청소</MenuItem>
                  <MenuItem value="installation">설치</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="내용"
                value={templateForm.content}
                onChange={(e) => handleTemplateFormChange('content', e.target.value)}
                margin="normal"
                multiline
                rows={4}
                placeholder="자주 사용하는 설명 내용을 입력하세요..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleTemplateSubmit}
            variant="contained"
            disabled={loading || !templateForm.title || !templateForm.content}
          >
            {loading ? '저장 중...' : (editingTemplate ? '수정' : '저장')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 뱃지 다이얼로그 */}
      <Dialog open={badgeDialogOpen} onClose={() => setBadgeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBadge ? '뱃지 수정' : '뱃지 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="뱃지명"
                value={badgeForm.name}
                onChange={(e) => handleBadgeFormChange('name', e.target.value)}
                margin="normal"
                placeholder="예: 꼼꼼시공"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                value={badgeForm.description}
                onChange={(e) => handleBadgeFormChange('description', e.target.value)}
                margin="normal"
                placeholder="예: 바닥 주의, 정리정돈 필수"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>색상</InputLabel>
                <Select
                  value={badgeForm.color}
                  onChange={(e) => handleBadgeFormChange('color', e.target.value)}
                  label="색상"
                >
                  <MenuItem value="primary">파란색</MenuItem>
                  <MenuItem value="secondary">보라색</MenuItem>
                  <MenuItem value="success">초록색</MenuItem>
                  <MenuItem value="warning">주황색</MenuItem>
                  <MenuItem value="error">빨간색</MenuItem>
                  <MenuItem value="info">하늘색</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="아이콘 (선택사항)"
                value={badgeForm.icon}
                onChange={(e) => handleBadgeFormChange('icon', e.target.value)}
                margin="normal"
                placeholder="예: warning, info, check"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBadgeDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleBadgeSubmit}
            variant="contained"
            disabled={loading || !badgeForm.name || !badgeForm.description}
          >
            {loading ? '저장 중...' : (editingBadge ? '수정' : '저장')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 만족도 조사 항목 다이얼로그 */}
      <Dialog open={surveyItemDialogOpen} onClose={() => setSurveyItemDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSurveyItem ? '만족도 조사 항목 수정' : '만족도 조사 항목 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="질문"
                value={surveyItemForm.question}
                onChange={(e) => handleSurveyItemFormChange('question', e.target.value)}
                margin="normal"
                placeholder="예: 시공 품질에 만족하십니까?"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>질문 타입</InputLabel>
                <Select
                  value={surveyItemForm.type}
                  onChange={(e) => handleSurveyItemFormChange('type', e.target.value)}
                  label="질문 타입"
                >
                  <MenuItem value="rating">평점 (1-5점)</MenuItem>
                  <MenuItem value="text">텍스트 입력</MenuItem>
                  <MenuItem value="choice">선택형</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="순서"
                type="number"
                value={surveyItemForm.order}
                onChange={(e) => handleSurveyItemFormChange('order', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1 }}
              />
            </Grid>
            {surveyItemForm.type === 'choice' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  선택 옵션
                </Typography>
                {surveyItemForm.options.map((option, index) => (
                  <Box key={index} display="flex" gap={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`옵션 ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...surveyItemForm.options];
                        newOptions[index] = e.target.value;
                        handleSurveyItemFormChange('options', newOptions);
                      }}
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        const newOptions = surveyItemForm.options.filter((_, i) => i !== index);
                        handleSurveyItemFormChange('options', newOptions);
                      }}
                      disabled={surveyItemForm.options.length <= 1}
                    >
                      삭제
                    </Button>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const newOptions = [...surveyItemForm.options, ''];
                    handleSurveyItemFormChange('options', newOptions);
                  }}
                >
                  옵션 추가
                </Button>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={surveyItemForm.isRequired}
                    onChange={(e) => handleSurveyItemFormChange('isRequired', e.target.checked)}
                  />
                }
                label="필수 항목"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={surveyItemForm.isActive}
                    onChange={(e) => handleSurveyItemFormChange('isActive', e.target.checked)}
                  />
                }
                label="활성화"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSurveyItemDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSurveyItemSubmit}
            variant="contained"
            disabled={loading || !surveyItemForm.question}
          >
            {loading ? '저장 중...' : (editingSurveyItem ? '수정' : '저장')}
          </Button>
        </DialogActions>
      </Dialog>

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

export default TemplateManagement;
