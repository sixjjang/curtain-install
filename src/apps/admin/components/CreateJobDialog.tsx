import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob, JobItem } from '../../../types';
import AddressSearch from '../../../shared/components/AddressSearch';

interface CreateJobDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateJobDialog: React.FC<CreateJobDialogProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    budgetMin: '',
    budgetMax: '',
    scheduledDate: '',
    requirements: [] as string[]
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [newRequirement, setNewRequirement] = useState('');
  const [items, setItems] = useState<JobItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unitPrice: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 기본 품목 목록
  const defaultItems = [
    '커튼',
    '블라인드',
    '전동커튼',
    '전동블라인드',
    '배터리전동 블라인드',
    '배터리전동 커튼',
    'IoT셋팅',
    '기타'
  ];

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (address: string, coords?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
    setCoordinates(coords);
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      handleChange('requirements', [...formData.requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (requirement: string) => {
    handleChange('requirements', formData.requirements.filter(r => r !== requirement));
  };

  // 품목 추가
  const handleAddItem = () => {
    if (newItem.name.trim() && newItem.quantity > 0 && newItem.unitPrice >= 0) {
      const totalPrice = newItem.quantity * newItem.unitPrice;
      const item: JobItem = {
        name: newItem.name.trim(),
        quantity: newItem.quantity,
        unitPrice: newItem.unitPrice,
        totalPrice
      };
      setItems([...items, item]);
      setNewItem({ name: '', quantity: 1, unitPrice: 0 });
    }
  };

  // 품목 삭제
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // 품목 수량/단가 변경
  const handleItemChange = (index: number, field: keyof JobItem, value: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      totalPrice: field === 'quantity' || field === 'unitPrice' 
        ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
          (field === 'unitPrice' ? value : updatedItems[index].unitPrice)
        : updatedItems[index].totalPrice
    };
    setItems(updatedItems);
  };

  // 총 예산 계산
  const calculateTotalBudget = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return itemsTotal;
  };

    const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.title || !formData.description || !formData.address || 
        !formData.budgetMin || !formData.budgetMax) {
      setError('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
      setError('최소 예산은 최대 예산보다 클 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const totalBudget = calculateTotalBudget();
      const jobData = {
        sellerId: 'seller1', // 기본값, 실제로는 선택 가능하도록 개선 필요
        customerId: 'customer1', // 기본값, 실제로는 선택 가능하도록 개선 필요
        title: formData.title,
        description: formData.description,
        address: formData.address,
        coordinates: coordinates || { lat: 37.5665, lng: 126.9780 }, // 선택된 좌표 또는 기본값
        budget: {
          min: parseInt(formData.budgetMin),
          max: parseInt(formData.budgetMax)
        },
        items: items,
        status: 'pending' as const,

        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
        images: [],
        requirements: formData.requirements
      };

      await JobService.createJob(jobData);
      
             // 폼 초기화
       setFormData({
         title: '',
         description: '',
         address: '',
         budgetMin: '',
         budgetMax: '',
         scheduledDate: '',
         requirements: []
       });
       setItems([]);
       setNewItem({ name: '', quantity: 1, unitPrice: 0 });
      
      onSuccess();
      onClose();
    } catch (error) {
      setError('작업 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        address: '',
        budgetMin: '',
        budgetMax: '',
        scheduledDate: '',
        requirements: []
      });
      setItems([]);
      setNewItem({ name: '', quantity: 1, unitPrice: 0 });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>새 작업 생성</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="작업 제목 *"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="작업 설명 *"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </Grid>

                     <Grid item xs={12}>
             <AddressSearch
               value={formData.address}
               onChange={handleAddressChange}
               placeholder="도로명, 지번, 건물명으로 검색하세요"
             />
           </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="최소 예산 (만원) *"
              type="number"
              value={formData.budgetMin}
              onChange={(e) => handleChange('budgetMin', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="최대 예산 (만원) *"
              type="number"
              value={formData.budgetMax}
              onChange={(e) => handleChange('budgetMax', e.target.value)}
              required
            />
          </Grid>



          <Grid item xs={6}>
            <TextField
              fullWidth
              label="예정일"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 품목 입력 섹션 */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="h6" color="primary">
                품목 및 단가
              </Typography>
            </Divider>
          </Grid>

          {/* 품목 추가 */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                품목 추가
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>품목 선택</InputLabel>
                    <Select
                      value={newItem.name || ''}
                      label="품목 선택"
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    >
                      {defaultItems.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="수량"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="단가 (원)"
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddItem}
                      disabled={!newItem.name || newItem.quantity <= 0 || newItem.unitPrice < 0}
                      startIcon={<AddIcon />}
                      sx={{ flexGrow: 1 }}
                    >
                      추가
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setNewItem({ name: '', quantity: 1, unitPrice: 0 })}
                    >
                      초기화
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* 품목 목록 */}
          {items.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  품목 목록
                </Typography>
                <Grid container spacing={1}>
                  {items.map((item, index) => (
                    <Grid item xs={12} key={index}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #f0f0f0', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.name}
                          </Typography>
                        </Box>
                        <TextField
                          size="small"
                          label="수량"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 1 }}
                        />
                        <TextField
                          size="small"
                          label="단가"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value) || 0)}
                          sx={{ width: 120 }}
                          inputProps={{ min: 0 }}
                        />
                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 100, textAlign: 'right' }}>
                          {item.totalPrice.toLocaleString()}원
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="white" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalculateIcon />
                    총 예산: {calculateTotalBudget().toLocaleString()}원
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              작업 요구사항
            </Typography>
            <Box display="flex" gap={1} mb={1}>
              <TextField
                size="small"
                placeholder="요구사항 추가"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddRequirement}
                disabled={!newRequirement.trim()}
              >
                추가
              </Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {formData.requirements.map((requirement, index) => (
                <Chip
                  key={index}
                  label={requirement}
                  onDelete={() => handleRemoveRequirement(requirement)}
                  size="small"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? '생성 중...' : '작업 생성'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateJobDialog;
