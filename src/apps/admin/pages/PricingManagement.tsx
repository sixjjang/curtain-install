import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { PricingService, PricingItem } from '../../../shared/services/pricingService';
import { EmergencyJobSettings, PricingOption } from '../../../types';

const PricingManagement: React.FC = () => {
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PricingItem>>({
    name: '',
    basePrice: 0,
    unit: '개',
    description: '',
    category: '기본',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [travelFee, setTravelFee] = useState(17000);
  const [isTravelFeeEditing, setIsTravelFeeEditing] = useState(false);
  const [emergencySettings, setEmergencySettings] = useState<EmergencyJobSettings[]>([]);
  const [editingEmergencySetting, setEditingEmergencySetting] = useState<EmergencyJobSettings | null>(null);
  const [isEmergencyAddDialogOpen, setIsEmergencyAddDialogOpen] = useState(false);
  const [newEmergencySetting, setNewEmergencySetting] = useState<Partial<EmergencyJobSettings>>({
    hoursWithin: 24,
    additionalPercentage: 20,
    additionalAmount: 20000,
    isActive: true
  });

  // 카테고리 관리 상태
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');

  // 옵션 관리 상태
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([]);
  const [editingOption, setEditingOption] = useState<PricingOption | null>(null);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [newOption, setNewOption] = useState<Partial<PricingOption>>({
    name: '',
    price: 0,
    category: '기타시공',
    isActive: true
  });

  // 정렬 관련 상태
  const [sortField, setSortField] = useState<'name' | 'category' | 'basePrice'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [categories, setCategories] = useState(['기본', '전동', '배터리전동', 'IoT세팅', '높이추가', '콘크리트추가', '석고추가', '철거추가', '폐기추가', '기타시공']);
  const units = ['개', '회', '세트', 'm²', 'm', '조', '창'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const items = await PricingService.getAllItems();
        setPricingItems(items);
        
        // 품목이 없으면 기본 데이터 초기화
        if (items.length === 0) {
          await PricingService.initializeDefaultItems();
          const updatedItems = await PricingService.getAllItems();
          setPricingItems(updatedItems);
        }

        // 기본출장비 가져오기
        const currentTravelFee = await PricingService.getTravelFee();
        setTravelFee(currentTravelFee);

        // 긴급시공건 설정 가져오기
        const emergencySettingsData = await PricingService.getAllEmergencySettings();
        setEmergencySettings(emergencySettingsData);
        
        // 긴급시공건 설정이 없으면 기본 데이터 초기화
        if (emergencySettingsData.length === 0) {
          await PricingService.initializeDefaultEmergencySettings();
          const updatedEmergencySettings = await PricingService.getAllEmergencySettings();
          setEmergencySettings(updatedEmergencySettings);
        }

        // 옵션 목록 가져오기
        const optionsData = await PricingService.getAllOptions();
        setPricingOptions(optionsData);
        
        // 옵션이 없으면 기본 데이터 초기화
        if (optionsData.length === 0) {
          await PricingService.initializeDefaultOptions();
          const updatedOptions = await PricingService.getAllOptions();
          setPricingOptions(updatedOptions);
        }
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
        setMessage({ type: 'error', text: '데이터를 가져오는데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (item: PricingItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setLoading(true);
      await PricingService.updateItem(editingItem.id, editingItem);
      
      setPricingItems(prev => 
        prev.map(item => 
          item.id === editingItem.id ? editingItem : item
        )
      );
      setEditingItem(null);
      setMessage({ type: 'success', text: '단가가 수정되었습니다.' });
    } catch (error) {
      console.error('품목 수정 실패:', error);
      setMessage({ type: 'error', text: '품목 수정에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await PricingService.deleteItem(id);
      
      setPricingItems(prev => prev.filter(item => item.id !== id));
      setMessage({ type: 'success', text: '품목이 삭제되었습니다.' });
    } catch (error) {
      console.error('품목 삭제 실패:', error);
      setMessage({ type: 'error', text: '품목 삭제에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.basePrice) {
      setMessage({ type: 'error', text: '품목명과 기본단가를 입력해주세요.' });
      return;
    }

    try {
      setLoading(true);
      const itemData = {
        name: newItem.name,
        basePrice: newItem.basePrice,
        unit: newItem.unit || '개',
        description: newItem.description || '',
        category: newItem.category || '기타',
        isActive: true
      };

      const newId = await PricingService.addItem(itemData);
      
      const newItemWithId: PricingItem = {
        id: newId,
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setPricingItems(prev => [...prev, newItemWithId]);
      setNewItem({
        name: '',
        basePrice: 0,
        unit: '개',
        description: '',
        category: '기본',
        isActive: true
      });
      setIsAddDialogOpen(false);
      setMessage({ type: 'success', text: '새 품목이 추가되었습니다.' });
    } catch (error) {
      console.error('품목 추가 실패:', error);
      setMessage({ type: 'error', text: '품목 추가에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' } = {
      '기본': 'primary',
      '전동': 'secondary',
      '배터리전동': 'success',
      'IoT세팅': 'warning',
      '높이추가': 'error',
      '콘크리트추가': 'info',
      '석고추가': 'primary',
      '철거추가': 'secondary',
      '폐기추가': 'success',
      '기타시공': 'warning'
    };
    return colors[category] || 'default';
  };

  const handleTravelFeeSave = async () => {
    try {
      setLoading(true);
      // 기본출장비를 Firestore에 저장
      await PricingService.updateTravelFee(travelFee);
      setIsTravelFeeEditing(false);
      setMessage({ type: 'success', text: '기본출장비가 수정되었습니다.' });
    } catch (error) {
      console.error('기본출장비 수정 실패:', error);
      setMessage({ type: 'error', text: '기본출장비 수정에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTravelFeeCancel = () => {
    setTravelFee(17000); // 기본값으로 되돌리기
    setIsTravelFeeEditing(false);
  };

  // 긴급시공건 설정 관련 함수들
  const handleEmergencyEdit = (setting: EmergencyJobSettings) => {
    setEditingEmergencySetting(setting);
  };

  const handleEmergencySaveEdit = async () => {
    if (!editingEmergencySetting) return;

    try {
      setLoading(true);
      // 추가금액을 500원 단위로 재계산 (전체 시공비 기준)
      const totalConstructionCost = pricingItems.reduce((sum, item) => sum + item.basePrice, 0);
      const recalculatedAmount = PricingService.calculateAdditionalAmount(
        totalConstructionCost, // 전체 시공비를 기준으로 계산
        editingEmergencySetting.additionalPercentage
      );
      
      const updatedSetting = {
        ...editingEmergencySetting,
        additionalAmount: recalculatedAmount
      };

      await PricingService.updateEmergencySetting(editingEmergencySetting.id, updatedSetting);
      
      setEmergencySettings(prev => 
        prev.map(setting => 
          setting.id === editingEmergencySetting.id ? updatedSetting : setting
        )
      );
      setEditingEmergencySetting(null);
      setMessage({ type: 'success', text: '긴급시공건 설정이 수정되었습니다.' });
    } catch (error) {
      console.error('긴급시공건 설정 수정 실패:', error);
      setMessage({ type: 'error', text: '긴급시공건 설정 수정에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCancelEdit = () => {
    setEditingEmergencySetting(null);
  };

  const handleEmergencyDelete = async (id: string) => {
    try {
      setLoading(true);
      await PricingService.deleteEmergencySetting(id);
      
      setEmergencySettings(prev => prev.filter(setting => setting.id !== id));
      setMessage({ type: 'success', text: '긴급시공건 설정이 삭제되었습니다.' });
    } catch (error) {
      console.error('긴급시공건 설정 삭제 실패:', error);
      setMessage({ type: 'error', text: '긴급시공건 설정 삭제에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAdd = async () => {
    if (!newEmergencySetting.hoursWithin || !newEmergencySetting.additionalPercentage) {
      setMessage({ type: 'error', text: '시간과 추가금액 퍼센트를 입력해주세요.' });
      return;
    }

    try {
      setLoading(true);
      // 추가금액을 500원 단위로 계산 (전체 시공비 기준)
      const totalConstructionCost = pricingItems.reduce((sum, item) => sum + item.basePrice, 0);
      const calculatedAmount = PricingService.calculateAdditionalAmount(
        totalConstructionCost, // 전체 시공비를 기준으로 계산
        newEmergencySetting.additionalPercentage
      );

      const settingData = {
        hoursWithin: newEmergencySetting.hoursWithin,
        additionalPercentage: newEmergencySetting.additionalPercentage,
        additionalAmount: calculatedAmount,
        isActive: newEmergencySetting.isActive || true
      };

      const newId = await PricingService.addEmergencySetting(settingData);
      
      const newSettingWithId: EmergencyJobSettings = {
        id: newId,
        ...settingData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setEmergencySettings(prev => [...prev, newSettingWithId]);
      setNewEmergencySetting({
        hoursWithin: 24,
        additionalPercentage: 20,
        additionalAmount: 20000,
        isActive: true
      });
      setIsEmergencyAddDialogOpen(false);
      setMessage({ type: 'success', text: '새 긴급시공건 설정이 추가되었습니다.' });
    } catch (error) {
      console.error('긴급시공건 설정 추가 실패:', error);
      setMessage({ type: 'error', text: '긴급시공건 설정 추가에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (percentage: number) => {
    const totalConstructionCost = pricingItems.reduce((sum, item) => sum + item.basePrice, 0);
    const calculatedAmount = PricingService.calculateAdditionalAmount(totalConstructionCost, percentage);
    setNewEmergencySetting(prev => ({
      ...prev,
      additionalPercentage: percentage,
      additionalAmount: calculatedAmount
    }));
  };

  // 카테고리 관리 함수들
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      setMessage({ type: 'error', text: '카테고리명을 입력해주세요.' });
      return;
    }
    
    if (categories.includes(newCategory.trim())) {
      setMessage({ type: 'error', text: '이미 존재하는 카테고리입니다.' });
      return;
    }
    
    setCategories(prev => [...prev, newCategory.trim()]);
    setNewCategory('');
    setMessage({ type: 'success', text: '카테고리가 추가되었습니다.' });
  };

  const handleEditCategory = () => {
    if (!editingCategory.trim()) {
      setMessage({ type: 'error', text: '카테고리명을 입력해주세요.' });
      return;
    }
    
    if (categories.includes(editingCategory.trim()) && editingCategory !== newCategory) {
      setMessage({ type: 'error', text: '이미 존재하는 카테고리입니다.' });
      return;
    }
    
    // 품목들의 카테고리도 함께 업데이트
    const updatedItems = pricingItems.map(item => 
      item.category === newCategory ? { ...item, category: editingCategory.trim() } : item
    );
    setPricingItems(updatedItems);
    
    setCategories(prev => prev.map(cat => cat === newCategory ? editingCategory.trim() : cat));
    setEditingCategory('');
    setNewCategory('');
    setIsCategoryDialogOpen(false);
    setMessage({ type: 'success', text: '카테고리가 수정되었습니다.' });
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    // 해당 카테고리를 사용하는 품목이 있는지 확인
    const itemsUsingCategory = pricingItems.filter(item => item.category === categoryToDelete);
    if (itemsUsingCategory.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `'${categoryToDelete}' 카테고리를 사용하는 품목이 ${itemsUsingCategory.length}개 있습니다. 먼저 해당 품목들의 카테고리를 변경해주세요.` 
      });
      return;
    }
    
    setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
    setMessage({ type: 'success', text: '카테고리가 삭제되었습니다.' });
  };

  // 옵션 관리 함수들
  const handleOptionEdit = (option: PricingOption) => {
    setEditingOption(option);
  };

  const handleOptionSaveEdit = async () => {
    if (!editingOption) return;

    try {
      setLoading(true);
      await PricingService.updateOption(editingOption.id, editingOption);
      
      setPricingOptions(prev => 
        prev.map(option => 
          option.id === editingOption.id ? editingOption : option
        )
      );
      setEditingOption(null);
      setMessage({ type: 'success', text: '옵션이 수정되었습니다.' });
    } catch (error) {
      console.error('옵션 수정 실패:', error);
      setMessage({ type: 'error', text: '옵션 수정에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionCancelEdit = () => {
    setEditingOption(null);
  };

  const handleOptionDelete = async (id: string) => {
    try {
      setLoading(true);
      await PricingService.deleteOption(id);
      
      setPricingOptions(prev => prev.filter(option => option.id !== id));
      setMessage({ type: 'success', text: '옵션이 삭제되었습니다.' });
    } catch (error) {
      console.error('옵션 삭제 실패:', error);
      setMessage({ type: 'error', text: '옵션 삭제에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionAdd = async () => {
    if (!newOption.name || !newOption.price) {
      setMessage({ type: 'error', text: '옵션명과 가격을 입력해주세요.' });
      return;
    }

    try {
      setLoading(true);
      const optionData = {
        name: newOption.name,
        price: newOption.price,
        category: newOption.category || '기타시공',
        isActive: true
      };

      const newId = await PricingService.addOption(optionData);
      
      const newOptionWithId: PricingOption = {
        id: newId,
        ...optionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setPricingOptions(prev => [...prev, newOptionWithId]);
      setNewOption({
        name: '',
        price: 0,
        category: '기타시공',
        isActive: true
      });
      setIsOptionDialogOpen(false);
      setMessage({ type: 'success', text: '새 옵션이 추가되었습니다.' });
    } catch (error) {
      console.error('옵션 추가 실패:', error);
      setMessage({ type: 'error', text: '옵션 추가에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 정렬 함수
  const handleSort = (field: 'name' | 'category' | 'basePrice') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 품목 목록
  const sortedPricingItems = [...pricingItems].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      case 'basePrice':
        aValue = a.basePrice;
        bValue = b.basePrice;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'ko-KR')
        : bValue.localeCompare(aValue, 'ko-KR');
    } else {
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  return (
    <Box>
             <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
         <Typography variant="h4">
           시공단가 관리
         </Typography>
       </Box>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* 기본출장비 설정 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            기본출장비 설정
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {isTravelFeeEditing ? (
              <>
                <TextField
                  type="number"
                  label="기본출장비 (원)"
                  value={travelFee}
                  onChange={(e) => setTravelFee(parseInt(e.target.value) || 0)}
                  sx={{ width: 200 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleTravelFeeSave}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  저장
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleTravelFeeCancel}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                >
                  취소
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1">
                  현재 기본출장비: <strong>{travelFee.toLocaleString()}원</strong>
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsTravelFeeEditing(true)}
                  startIcon={<EditIcon />}
                >
                  수정
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 긴급시공건 설정 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              긴급시공건 설정
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setIsEmergencyAddDialogOpen(true)}
            >
              새 설정 추가
            </Button>
          </Box>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>시간 이내</TableCell>
                  <TableCell>추가 금액 (%)</TableCell>
                  <TableCell>추가 금액 (원)</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emergencySettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      {editingEmergencySetting?.id === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editingEmergencySetting.hoursWithin}
                          onChange={(e) => setEditingEmergencySetting({ 
                            ...editingEmergencySetting, 
                            hoursWithin: parseInt(e.target.value) || 0 
                          })}
                          InputProps={{
                            endAdornment: <Typography variant="caption">시간</Typography>
                          }}
                        />
                      ) : (
                        <Typography variant="body2">
                          {setting.hoursWithin}시간 이내
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingEmergencySetting?.id === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editingEmergencySetting.additionalPercentage}
                                                     onChange={(e) => {
                             const percentage = parseInt(e.target.value) || 0;
                             const totalConstructionCost = pricingItems.reduce((sum, item) => sum + item.basePrice, 0);
                             const calculatedAmount = PricingService.calculateAdditionalAmount(totalConstructionCost, percentage);
                             setEditingEmergencySetting({ 
                               ...editingEmergencySetting, 
                               additionalPercentage: percentage,
                               additionalAmount: calculatedAmount
                             });
                           }}
                          InputProps={{
                            endAdornment: <Typography variant="caption">%</Typography>
                          }}
                        />
                      ) : (
                        <Typography variant="body2">
                          {setting.additionalPercentage}%
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        +{setting.additionalAmount.toLocaleString()}원
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={setting.isActive ? '활성' : '비활성'} 
                        color={setting.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {editingEmergencySetting?.id === setting.id ? (
                        <Box>
                          <IconButton size="small" onClick={handleEmergencySaveEdit} color="primary">
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleEmergencyCancelEdit} color="error">
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton size="small" onClick={() => handleEmergencyEdit(setting)} color="primary">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleEmergencyDelete(setting.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                총 품목 수
              </Typography>
              <Typography variant="h4">
                {pricingItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                활성 품목
              </Typography>
              <Typography variant="h4">
                {pricingItems.filter(item => item.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                평균 단가
              </Typography>
              <Typography variant="h4">
                {Math.round(pricingItems.reduce((sum, item) => sum + item.basePrice, 0) / pricingItems.length).toLocaleString()}원
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                카테고리 수
              </Typography>
              <Typography variant="h4">
                {new Set(pricingItems.map(item => item.category)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

             {/* 단가 테이블 */}
               <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              카테고리 관리
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsOptionDialogOpen(true)}
            >
              옵션 관리
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddDialogOpen(true)}
          >
            새 품목 추가
          </Button>
        </Box>
               <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSort('name')}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    userSelect: 'none'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    품목명
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('category')}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    userSelect: 'none'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    카테고리
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('basePrice')}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    userSelect: 'none'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    기본단가
                    {sortField === 'basePrice' && (
                      sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>단위</TableCell>
                <TableCell>설명</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
           <TableBody>
             {sortedPricingItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <TextField
                      size="small"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  ) : (
                    <Typography variant="subtitle2">{item.name}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={editingItem.category || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip 
                      label={item.category} 
                      color={getCategoryColor(item.category)}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <TextField
                      size="small"
                      type="number"
                      value={editingItem.basePrice}
                      onChange={(e) => setEditingItem({ ...editingItem, basePrice: parseInt(e.target.value) || 0 })}
                      InputProps={{
                        endAdornment: <Typography variant="caption">원</Typography>
                      }}
                    />
                  ) : (
                    <Typography variant="subtitle2">
                      {item.basePrice.toLocaleString()}원
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={editingItem.unit || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      >
                        {units.map((unit) => (
                          <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2">{item.unit}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <TextField
                      size="small"
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      {item.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.isActive ? '활성' : '비활성'} 
                    color={item.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {editingItem?.id === item.id ? (
                    <Box>
                      <IconButton size="small" onClick={handleSaveEdit} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelEdit} color="error">
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box>
                      <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 새 품목 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 품목 추가</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="품목명"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={newItem.category}
                  label="카테고리"
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="기본단가"
                type="number"
                value={newItem.basePrice}
                onChange={(e) => setNewItem({ ...newItem, basePrice: parseInt(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <Typography variant="caption">원</Typography>
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>단위</InputLabel>
                <Select
                  value={newItem.unit}
                  label="단위"
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                multiline
                rows={2}
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>취소</Button>
          <Button onClick={handleAddItem} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>

      {/* 긴급시공건 설정 추가 다이얼로그 */}
      <Dialog open={isEmergencyAddDialogOpen} onClose={() => setIsEmergencyAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 긴급시공건 설정 추가</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="시간 이내"
                type="number"
                value={newEmergencySetting.hoursWithin}
                onChange={(e) => setNewEmergencySetting({ 
                  ...newEmergencySetting, 
                  hoursWithin: parseInt(e.target.value) || 0 
                })}
                InputProps={{
                  endAdornment: <Typography variant="caption">시간</Typography>
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="추가 금액 (%)"
                type="number"
                value={newEmergencySetting.additionalPercentage}
                onChange={(e) => handlePercentageChange(parseInt(e.target.value) || 0)}
                InputProps={{
                  endAdornment: <Typography variant="caption">%</Typography>
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                계산된 추가 금액: <strong>+{newEmergencySetting.additionalAmount?.toLocaleString()}원</strong>
              </Typography>
                             <Typography variant="caption" color="textSecondary">
                 * 추가 금액은 전체 시공비({pricingItems.reduce((sum, item) => sum + item.basePrice, 0).toLocaleString()}원) 기준으로 500원 단위로 자동 계산됩니다.
               </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEmergencyAddDialogOpen(false)}>취소</Button>
          <Button onClick={handleEmergencyAdd} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>

      {/* 카테고리 관리 다이얼로그 */}
      <Dialog open={isCategoryDialogOpen} onClose={() => setIsCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>카테고리 관리</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>새 카테고리 추가</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="카테고리명"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="새 카테고리명을 입력하세요"
              />
              <Button
                variant="contained"
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                추가
              </Button>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>기존 카테고리 관리</Typography>
            {categories.map((category, index) => (
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
                  backgroundColor: 'white'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  {editingCategory === category ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="새 카테고리명"
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleEditCategory}
                        disabled={!newCategory.trim()}
                      >
                        저장
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingCategory('');
                          setNewCategory('');
                        }}
                      >
                        취소
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="body1">{category}</Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {editingCategory !== category && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingCategory(category);
                          setNewCategory(category);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCategoryDialogOpen(false)}>닫기</Button>
                 </DialogActions>
       </Dialog>

       {/* 옵션 관리 다이얼로그 */}
       <Dialog open={isOptionDialogOpen} onClose={() => setIsOptionDialogOpen(false)} maxWidth="md" fullWidth>
         <DialogTitle>옵션 관리</DialogTitle>
         <DialogContent>
           <Box sx={{ mb: 3 }}>
             <Typography variant="h6" gutterBottom>새 옵션 추가</Typography>
             <Grid container spacing={2}>
               <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label="옵션명"
                   value={newOption.name}
                   onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                   required
                 />
               </Grid>
               <Grid item xs={12} sm={3}>
                 <TextField
                   fullWidth
                   label="가격"
                   type="number"
                   value={newOption.price}
                   onChange={(e) => setNewOption({ ...newOption, price: parseInt(e.target.value) || 0 })}
                   InputProps={{
                     endAdornment: <Typography variant="caption">원</Typography>
                   }}
                   required
                 />
               </Grid>
               <Grid item xs={12} sm={3}>
                 <FormControl fullWidth>
                   <InputLabel>카테고리</InputLabel>
                   <Select
                     value={newOption.category}
                     label="카테고리"
                     onChange={(e) => setNewOption({ ...newOption, category: e.target.value })}
                   >
                     {categories.map((category) => (
                       <MenuItem key={category} value={category}>{category}</MenuItem>
                     ))}
                   </Select>
                 </FormControl>
               </Grid>
               <Grid item xs={12}>
                 <Button
                   variant="contained"
                   onClick={handleOptionAdd}
                   disabled={!newOption.name || !newOption.price}
                 >
                   옵션 추가
                 </Button>
               </Grid>
             </Grid>
           </Box>

           <Box>
             <Typography variant="h6" gutterBottom>기존 옵션 관리</Typography>
             <TableContainer component={Paper} variant="outlined">
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell>옵션명</TableCell>
                     <TableCell>가격</TableCell>
                     <TableCell>카테고리</TableCell>
                     <TableCell>상태</TableCell>
                     <TableCell>작업</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {pricingOptions.map((option) => (
                     <TableRow key={option.id}>
                       <TableCell>
                         {editingOption?.id === option.id ? (
                           <TextField
                             size="small"
                             value={editingOption.name}
                             onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                           />
                         ) : (
                           <Typography variant="body2">{option.name}</Typography>
                         )}
                       </TableCell>
                       <TableCell>
                         {editingOption?.id === option.id ? (
                           <TextField
                             size="small"
                             type="number"
                             value={editingOption.price}
                             onChange={(e) => setEditingOption({ ...editingOption, price: parseInt(e.target.value) || 0 })}
                             InputProps={{
                               endAdornment: <Typography variant="caption">원</Typography>
                             }}
                           />
                         ) : (
                           <Typography variant="body2">
                             {option.price.toLocaleString()}원
                           </Typography>
                         )}
                       </TableCell>
                       <TableCell>
                         {editingOption?.id === option.id ? (
                           <FormControl size="small" sx={{ minWidth: 120 }}>
                             <Select
                               value={editingOption.category}
                               onChange={(e) => setEditingOption({ ...editingOption, category: e.target.value })}
                             >
                               {categories.map((category) => (
                                 <MenuItem key={category} value={category}>{category}</MenuItem>
                               ))}
                             </Select>
                           </FormControl>
                         ) : (
                           <Chip 
                             label={option.category} 
                             color={getCategoryColor(option.category)}
                             size="small"
                           />
                         )}
                       </TableCell>
                       <TableCell>
                         <Chip 
                           label={option.isActive ? '활성' : '비활성'} 
                           color={option.isActive ? 'success' : 'default'}
                           size="small"
                         />
                       </TableCell>
                       <TableCell>
                         {editingOption?.id === option.id ? (
                           <Box>
                             <IconButton size="small" onClick={handleOptionSaveEdit} color="primary">
                               <SaveIcon />
                             </IconButton>
                             <IconButton size="small" onClick={handleOptionCancelEdit} color="error">
                               <CancelIcon />
                             </IconButton>
                           </Box>
                         ) : (
                           <Box>
                             <IconButton size="small" onClick={() => handleOptionEdit(option)} color="primary">
                               <EditIcon />
                             </IconButton>
                             <IconButton size="small" onClick={() => handleOptionDelete(option.id)} color="error">
                               <DeleteIcon />
                             </IconButton>
                           </Box>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           </Box>
         </DialogContent>
         <DialogActions>
           <Button onClick={() => setIsOptionDialogOpen(false)}>닫기</Button>
         </DialogActions>
       </Dialog>
     </Box>
   );
 };

export default PricingManagement;
