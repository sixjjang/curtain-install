import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
  Chip,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  CloudUpload,
  Description as DescriptionIcon,
  AttachFile,
  FileDownload,
  Delete,
  Payment,
  CreditCard,
  AccountBalanceWallet,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { JobService } from '../../../shared/services/jobService';
import { PricingService, PricingItem } from '../../../shared/services/pricingService';
import { SellerService } from '../../../shared/services/sellerService';
import { CustomerService } from '../../../shared/services/customerService';
import { PointService } from '../../../shared/services/pointService';
import { PaymentService } from '../../../shared/services/paymentService';
import { StorageService } from '../../../shared/services/storageService';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { JobItem, PricingOption, WorkInstruction } from '../../../types';
import AddressSearch from '../../../shared/components/AddressSearch';
import { formatPhoneInput } from '../../../shared/utils/phoneFormatter';

interface CreateJobDialogProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
  initialScheduledDate?: string;
  initialScheduledTime?: string;
}

const CreateJobDialog: React.FC<CreateJobDialogProps> = ({ 
  open, 
  onClose, 
  onJobCreated, 
  initialScheduledDate, 
  initialScheduledTime 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    budgetMin: '',
    budgetMax: '',
    scheduledDate: initialScheduledDate || '',
    scheduledTime: initialScheduledTime || '',
    isInternal: false
  });
  
  // 고객정보 상태 추가
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  
  // 픽업 정보 상태 추가
  const [pickupInfo, setPickupInfo] = useState({
    companyName: '',
    address: '',
    phone: '',
    scheduledDateTime: ''
  });

  // 저장된 픽업 정보 및 포인트 잔액 불러오기
  React.useEffect(() => {
    const loadSavedData = async () => {
      if (!user?.id || !open) return;
      
      try {
        // 픽업 정보 불러오기
        const savedPickupInfo = await SellerService.getPickupInfo(user.id);
        if (savedPickupInfo) {
          setPickupInfo(prev => ({
            ...prev,
            companyName: savedPickupInfo.companyName,
            phone: savedPickupInfo.phone,
            address: savedPickupInfo.address
          }));
        }

        // 포인트 잔액 불러오기
        const balance = await PointService.getPointBalance(user.id, 'seller');
        setPointBalance(balance);
      } catch (error) {
        console.error('저장된 데이터 불러오기 실패:', error);
      }
    };
    
    loadSavedData();
  }, [user?.id, open]);

  // 초기 시공일시 설정
  React.useEffect(() => {
    if (open && (initialScheduledDate || initialScheduledTime)) {
      setFormData(prev => ({
        ...prev,
        scheduledDate: initialScheduledDate || prev.scheduledDate,
        scheduledTime: initialScheduledTime || prev.scheduledTime
      }));
    }
  }, [open, initialScheduledDate, initialScheduledTime]);
  const [items, setItems] = useState<JobItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unitPrice: 0
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const [pointValidation, setPointValidation] = useState<{
    isValid: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortage: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  // 포인트 충전 관련 상태
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('simulation');
  const [tossPaymentMethod, setTossPaymentMethod] = useState('카드');
  
  // 작업지시서 파일 상태
  const [workInstructions, setWorkInstructions] = useState<WorkInstruction[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // 품목 목록 가져오기
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await PricingService.getAllItems();
        setPricingItems(items);
        
        // 기본출장비 가져오기
        const travelFee = await PricingService.getTravelFee();
        
        // 기본출장비를 자동으로 추가
        const travelFeeItem: JobItem = {
          name: '기본출장비',
          quantity: 1,
          unitPrice: travelFee,
          totalPrice: travelFee
        };
        
        setItems([travelFeeItem]);

        // 옵션 목록 가져오기
        const options = await PricingService.getAllOptions();
        setPricingOptions(options);
      } catch (error) {
        console.error('데이터 가져오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  // 30분 단위 시간 옵션 생성 (06:00 ~ 23:30)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 충전 금액 옵션
  const chargeOptions = [
    { amount: 10000, label: '10,000포인트 (10,000원)' },
    { amount: 30000, label: '30,000포인트 (30,000원)' },
    { amount: 50000, label: '50,000포인트 (50,000원)' },
    { amount: 100000, label: '100,000포인트 (100,000원)' },
    { amount: 300000, label: '300,000포인트 (300,000원)' },
    { amount: 500000, label: '500,000포인트 (500,000원)' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
    // 고객정보 주소도 동일하게 설정
    setCustomerInfo(prev => ({
      ...prev,
      address
    }));
  };



  // 고객정보 변경 핸들러
  const handleCustomerInfoChange = (field: string, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용
    if (field === 'phone') {
      const formattedValue = formatPhoneInput(value);
      setCustomerInfo(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // 고객 주소가 변경되면 시공 주소도 동일하게 설정
    if (field === 'address') {
      setFormData(prev => ({
        ...prev,
        address: value
      }));
    }
  };

  // 픽업 정보 변경 핸들러
  const handlePickupInfoChange = (field: string, value: string) => {
    // 전화번호 필드인 경우 포맷팅 적용
    if (field === 'phone') {
      const formattedValue = formatPhoneInput(value);
      setPickupInfo(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setPickupInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 품목 추가
  const handleAddItem = () => {
    if (!newItem.name || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      setError('품목명, 수량, 단가를 모두 입력해주세요.');
      return;
    }

    const basePrice = newItem.unitPrice;
    const optionsPrice = calculateSelectedOptionsPrice();
    const totalPrice = newItem.quantity * (basePrice + optionsPrice);
    
    const item: JobItem = {
      name: newItem.name,
      quantity: newItem.quantity,
      unitPrice: basePrice + optionsPrice,
      totalPrice,
      options: selectedOptions,
      optionPrices: optionsPrice
    };

    setItems(prev => [...prev, item]);
    setNewItem({ name: '', quantity: 1, unitPrice: 0 });
    setSelectedOptions([]);
    setError('');
    
    // 품목 추가 후 자동 제목 업데이트 및 포인트 검증
    setTimeout(() => {
      updateAutoTitle();
      validatePointBalance();
    }, 100);
  };

  // 카테고리 선택 핸들러
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setNewItem(prev => ({
      ...prev,
      name: '',
      unitPrice: 0
    }));
  };

  // 품목 선택 시 기본 단가 자동 설정
  const handleItemNameChange = (itemName: string) => {
    const selectedPricingItem = pricingItems.find(item => item.name === itemName);
    setNewItem(prev => ({
      ...prev,
      name: itemName,
      unitPrice: selectedPricingItem?.basePrice || 0
    }));
  };

  // 옵션 선택 핸들러
  const handleOptionChange = (optionId: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

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

      setWorkInstructions(prev => [...prev, ...uploadedFiles]);
      setError('');
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setError('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
    }
  };

  // 파일 삭제 핸들러
  const handleFileDelete = (fileId: string) => {
    setWorkInstructions(prev => prev.filter(file => file.id !== fileId));
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 선택된 옵션들의 총 가격 계산
  const calculateSelectedOptionsPrice = () => {
    return selectedOptions.reduce((total, optionId) => {
      const option = pricingOptions.find(opt => opt.id === optionId);
      return total + (option?.price || 0);
    }, 0);
  };

  // 총 금액 계산
  const calculateTotalPrice = () => {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 포인트 잔액 검증
  const validatePointBalance = async () => {
    if (!user?.id) return;
    
    const totalPrice = calculateTotalPrice();
    if (totalPrice > 0) {
      try {
        const validation = await PointService.validatePointBalance(user.id, totalPrice);
        setPointValidation(validation);
        return validation.isValid;
      } catch (error) {
        console.error('포인트 잔액 검증 실패:', error);
        setPointValidation(null);
        return false;
      }
    }
    return true;
  };

  // 자동 제목 생성
  const generateAutoTitle = () => {
    const parts: string[] = [];
    
    // 1. 일시 정보 (가장 먼저)
    if (formData.scheduledDate && formData.scheduledTime) {
      const date = new Date(formData.scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const time = formData.scheduledTime;
      parts.push(`${month}/${day} ${time}`);
    }
    
    // 2. 주소 정보 (시/군/구 + 도로명)
    if (formData.address) {
      const addressParts = formData.address.split(' ');
      if (addressParts.length >= 3) {
        // "충남 당진시 기지시2길" 형태로 추출
        parts.push(`${addressParts[0]} ${addressParts[1]} ${addressParts[2]}`);
      } else if (addressParts.length >= 2) {
        // "당진시 기지시2길" 형태로 추출
        parts.push(`${addressParts[0]} ${addressParts[1]}`);
      } else {
        parts.push(formData.address);
      }
    }
    
    // 3. 품목 정보 (기본출장비 제외, 모든 품목 표시)
    const nonTravelFeeItems = items.filter(item => item.name !== '기본출장비');
    if (nonTravelFeeItems.length > 0) {
      const itemSummary = nonTravelFeeItems.map(item => {
        const unit = item.name.includes('커튼') ? '조' : 
                    item.name.includes('블라인드') ? '창' : 
                    item.name.includes('IoT') ? '회' : '개';
        return `${item.name} ${item.quantity}${unit}`;
      }).join(',');
      parts.push(itemSummary);
    }
    
    // 4. 총 금액 (기본출장비 제외, 천 단위 콤마 포함)
    const totalAmountWithoutTravelFee = nonTravelFeeItems.reduce((sum, item) => sum + item.totalPrice, 0);
    if (totalAmountWithoutTravelFee > 0) {
      parts.push(`${totalAmountWithoutTravelFee.toLocaleString()}원`);
    }
    
    // 최소한의 정보가 없으면 기본 제목 생성
    if (parts.length === 0) {
      const defaultTitle = `새 작업 - ${new Date().toLocaleDateString()}`;
      console.log('🔍 자동 제목 생성 (기본):', defaultTitle);
      return defaultTitle;
    }
    
    const autoTitle = parts.join('-');
    console.log('🔍 자동 제목 생성:', {
      address: formData.address,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      items: items.map(item => ({ name: item.name, quantity: item.quantity })),
      nonTravelFeeItems: nonTravelFeeItems.map(item => ({ name: item.name, quantity: item.quantity })),
      totalAmount: totalAmountWithoutTravelFee,
      generatedTitle: autoTitle
    });
    
    return autoTitle;
  };

  // 자동 제목 업데이트
  const updateAutoTitle = () => {
    const autoTitle = generateAutoTitle();
    if (autoTitle) {
      setFormData(prev => ({
        ...prev,
        title: autoTitle
      }));
    }
  };

  // 주소, 일시, 품목 변경 시 자동 제목 업데이트
  React.useEffect(() => {
    updateAutoTitle();
  }, [formData.address, formData.scheduledDate, formData.scheduledTime, items]);

  // 품목 삭제
  const handleRemoveItem = (index: number) => {
    // 기본출장비는 삭제할 수 없음
    const itemToRemove = items[index];
    if (itemToRemove.name === '기본출장비') {
      setError('기본출장비는 삭제할 수 없습니다.');
      return;
    }
    
    setItems(prev => prev.filter((_, i) => i !== index));
    // 품목 삭제 후 자동 제목 업데이트 및 포인트 검증
    setTimeout(() => {
      updateAutoTitle();
      validatePointBalance();
    }, 100);
  };

  // 품목 수량/단가 변경
  const handleItemChange = (index: number, field: keyof JobItem, value: number) => {
    // 기본출장비는 수정할 수 없음
    const itemToUpdate = items[index];
    if (itemToUpdate.name === '기본출장비') {
      setError('기본출장비는 수정할 수 없습니다.');
      return;
    }
    
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
    // 품목 변경 후 자동 제목 업데이트 및 포인트 검증
    setTimeout(() => {
      updateAutoTitle();
      validatePointBalance();
    }, 100);
  };

  // 총 예산 계산
  const calculateTotalBudget = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.address) {
      setError('제목과 주소를 입력해주세요.');
      return;
    }

    if (!customerInfo.phone) {
      setError('고객 연락처를 입력해주세요.');
      return;
    }

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('시공일시를 선택해주세요.');
      return;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const totalBudget = calculateTotalBudget();
      
      // 시공일시 생성
      const [hours, minutes] = formData.scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(formData.scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // 1. 고객 정보 저장
      let customerId = 'temp-customer-id';
      if (customerInfo.phone) {
        try {
          customerId = await CustomerService.saveCustomerInfo({
            name: customerInfo.name || '미상',
            phone: customerInfo.phone,
            address: customerInfo.address || formData.address,
            rating: 0,
            totalJobs: 0
          });
          console.log('고객 정보 저장 성공:', customerId);
        } catch (error) {
          console.error('고객 정보 저장 실패:', error);
          // 고객 정보 저장에 실패해도 작업은 계속 진행
          customerId = `temp-${Date.now()}`;
        }
      }

      // 2. 작업 데이터 생성
      // undefined 값 제거를 위한 픽업 정보 정리
      const cleanedPickupInfo = {
        companyName: pickupInfo.companyName || '',
        address: pickupInfo.address || '',
        phone: pickupInfo.phone || '',
        scheduledDateTime: pickupInfo.scheduledDateTime || ''
      };

      // undefined 값 제거를 위한 안전한 데이터 생성
      // 작업지시서 파일 정보 생성
      const workInstructionFiles = workInstructions.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        uploadedBy: file.uploadedBy
      }));

      // 포인트 잔액 검증
      const isValidBalance = await validatePointBalance();
      if (!isValidBalance) {
        setError(`포인트 잔액이 부족합니다. 현재 잔액: ${pointBalance.toLocaleString()}포인트, 필요 금액: ${totalBudget.toLocaleString()}포인트`);
        setLoading(false);
        return;
      }

      const jobData = {
        sellerId: user.id,
        customerId: customerId,
        title: formData.title || '',
        description: formData.description || '',
        address: formData.address || '',
        coordinates: { lat: 37.5665, lng: 126.9780 }, // 서울 시청 좌표 (기본값)
        budget: {
          min: totalBudget,
          max: totalBudget + Math.round(totalBudget * 0.1) // 10% 여유
        },
        items: items || [],
        status: 'pending' as const,
        scheduledDate: scheduledDateTime,
        isInternal: formData.isInternal || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
        requirements: [],
        pickupInfo: cleanedPickupInfo, // 정리된 픽업 정보 추가
        workInstructions: workInstructionFiles // 작업지시서 파일 정보 추가
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
        scheduledTime: '',
        isInternal: false
      });
      setCustomerInfo({
        name: '',
        phone: '',
        address: ''
      });
      setPickupInfo({
        companyName: '',
        address: '',
        phone: '',
        scheduledDateTime: ''
      });
      setItems([]);
      setNewItem({ name: '', quantity: 1, unitPrice: 0 });
      setSelectedCategory('');
      setSelectedOptions([]);
      setWorkInstructions([]);
      
      // 기본출장비 재설정
      await resetTravelFee();
      
      onJobCreated();
      onClose();
    } catch (error: any) {
      setError(`작업 생성 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

       const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      address: '',
      budgetMin: '',
      budgetMax: '',
      scheduledDate: '',
      scheduledTime: '',
      isInternal: false
    });
    setCustomerInfo({
      name: '',
      phone: '',
      address: ''
    });
    setPickupInfo({
      companyName: '',
      address: '',
      phone: '',
      scheduledDateTime: ''
    });
    setItems([]);
    setNewItem({ name: '', quantity: 1, unitPrice: 0 });
    setSelectedCategory('');
    setSelectedOptions([]);
    setError('');
    onClose();
  };

  // 기본출장비 재설정 함수
  const resetTravelFee = async () => {
    try {
      const travelFee = await PricingService.getTravelFee();
      const travelFeeItem: JobItem = {
        name: '기본출장비',
        quantity: 1,
        unitPrice: travelFee,
        totalPrice: travelFee
      };
      setItems([travelFeeItem]);
    } catch (error) {
      console.error('기본출장비 재설정 실패:', error);
    }
  };

  // 작업 설명 예시 추가 함수
  const handleAddDescriptionExample = (content: string) => {
    const currentDescription = formData.description;
    const newDescription = currentDescription 
      ? `${currentDescription}\n${content}`
      : content;
    
    setFormData(prev => ({
      ...prev,
      description: newDescription
    }));
  };

  // 포인트 충전 관련 함수들
  const handleChargeDialogOpen = () => {
    setChargeDialogOpen(true);
    setChargeAmount('');
    setSelectedAmount(null);
    setError('');
  };

  const handleChargeDialogClose = () => {
    setChargeDialogOpen(false);
    setChargeAmount('');
    setSelectedAmount(null);
    setError('');
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setChargeAmount(amount.toString());
  };

  // 포인트 충전 처리
  const handleCharge = async () => {
    if (!user || !chargeAmount || parseInt(chargeAmount) <= 0) {
      setError('올바른 금액을 입력해주세요.');
      return;
    }

    const amount = parseInt(chargeAmount);
    
    try {
      setCharging(true);
      setError('');
      
      // 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${user.id}`;
      
      let paymentResult;
      
      // 결제 수단에 따른 처리
      switch (paymentMethod) {
        case 'toss_payments':
          paymentResult = await PaymentService.requestTossPayments({
            amount,
            orderId,
            itemName: `${amount.toLocaleString()}포인트 충전`,
            userId: user.id,
            userRole: 'seller'
          }, tossPaymentMethod);
          break;
          
        default: // simulation
          paymentResult = await PaymentService.requestPayment({
            amount,
            orderId,
            itemName: `${amount.toLocaleString()}포인트 충전`,
            userId: user.id,
            userRole: 'seller'
          });
          break;
      }
      
      if (paymentResult.success) {
        if (paymentResult.redirectUrl) {
          // 결제 페이지로 리다이렉트 (실제 결제)
          window.location.href = paymentResult.redirectUrl;
        } else {
          // 시뮬레이션 결제 완료
          // 포인트 잔액 새로고침
          const newBalance = await PointService.getPointBalance(user.id, 'seller');
          setPointBalance(newBalance);
          
          // 포인트 검증 다시 수행
          await validatePointBalance();
          
          // 충전 다이얼로그 닫기
          handleChargeDialogClose();
          
          setError('');
          // 성공 메시지는 포인트 검증 결과에서 표시됨
        }
      } else {
        throw new Error(paymentResult.error || '결제 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('포인트 충전 실패:', error);
      setError('포인트 충전에 실패했습니다.');
    } finally {
      setCharging(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">새 작업 등록</Typography>
          <TextField
            size="small"
            label="작업제목 (자동생성)"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            sx={{ width: 300 }}
            placeholder="작업제목을 입력하세요"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 작업 유형 선택 */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="h6">작업 유형</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Checkbox
                  checked={formData.isInternal}
                  onChange={(e) => setFormData(prev => ({ ...prev, isInternal: e.target.checked }))}
                  color="secondary"
                />
                <Typography variant="body2">
                  자사 직접 시공 (체크 시 시공의뢰가 아닌 자사가 직접 시공하는 작업으로 등록됩니다)
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 고객정보 섹션 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              고객정보
            </Typography>
            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="고객 이름 (선택사항)"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      placeholder="고객 이름을 입력하세요"
                    />
                  </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="연락처"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  required
                />
              </Grid>
                             <Grid item xs={12}>
                 <AddressSearch 
                   value={customerInfo.address}
                   onChange={(address) => handleCustomerInfoChange('address', address)}
                   placeholder="고객 주소 및 시공 주소를 입력하세요"
                 />
               </Grid>
            </Grid>
          </Grid>

          

          

          

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              시공일시
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="시공일"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0] // 오늘 이후만 선택 가능
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>시공시간</InputLabel>
                  <Select
                    value={formData.scheduledTime || ''}
                    label="시공시간"
                    onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                    required
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {formData.scheduledDate && formData.scheduledTime && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                선택된 시공일시: {formData.scheduledDate} {formData.scheduledTime}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              품목 및 단가
            </Typography>

                         {/* 품목 추가 폼 */}
             <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
               <Grid container spacing={2} alignItems="center">
                 <Grid item xs={12} sm={3}>
                   <FormControl fullWidth size="small">
                     <InputLabel>카테고리</InputLabel>
                     <Select
                       value={selectedCategory}
                       label="카테고리"
                       onChange={(e) => handleCategoryChange(e.target.value)}
                     >
                       <MenuItem value="">카테고리 선택</MenuItem>
                       {Array.from(new Set(pricingItems.map(item => item.category))).map((category) => (
                         <MenuItem key={category} value={category}>
                           {category}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} sm={3}>
                   <FormControl fullWidth size="small">
                     <InputLabel>품목명</InputLabel>
                     <Select
                       value={newItem.name || ''}
                       label="품목명"
                       onChange={(e) => handleItemNameChange(e.target.value)}
                       disabled={!selectedCategory}
                     >
                       <MenuItem value="">품목 선택</MenuItem>
                       {pricingItems
                         .filter(item => item.category === selectedCategory)
                         .map((item) => (
                           <MenuItem key={item.id} value={item.name}>
                             {item.name} ({item.basePrice.toLocaleString()}원)
                           </MenuItem>
                         ))}
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} sm={2}>
                   <TextField
                     fullWidth
                     size="small"
                     label="수량"
                     type="number"
                     value={newItem.quantity}
                     onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                   />
                 </Grid>
                 <Grid item xs={12} sm={2}>
                   <TextField
                     fullWidth
                     size="small"
                     label="단가 (원)"
                     type="number"
                     value={newItem.unitPrice + calculateSelectedOptionsPrice()}
                     InputProps={{
                       readOnly: true,
                       endAdornment: <Typography variant="caption">원</Typography>
                     }}
                   />
                 </Grid>
                 <Grid item xs={12} sm={2}>
                   <Button
                     fullWidth
                     variant="contained"
                     size="small"
                     onClick={handleAddItem}
                     startIcon={<AddIcon />}
                     sx={{
                       bgcolor: formData.isInternal ? 'grey.800' : 'primary.main',
                       '&:hover': {
                         bgcolor: formData.isInternal ? 'grey.900' : 'primary.dark'
                       }
                     }}
                   >
                     추가
                   </Button>
                 </Grid>
               </Grid>

               {/* 옵션 선택 */}
               {newItem.name && (
                 <Box sx={{ mt: 2 }}>
                   <Typography variant="subtitle2" gutterBottom>
                     옵션 선택 (선택사항)
                   </Typography>
                   <Grid container spacing={1}>
                     {pricingOptions.map((option) => (
                       <Grid item xs={12} sm={6} md={4} key={option.id}>
                         <Box
                           sx={{
                             display: 'flex',
                             alignItems: 'center',
                             p: 1,
                             border: selectedOptions.includes(option.id) 
                               ? `2px solid ${formData.isInternal ? '#424242' : '#1976d2'}` 
                               : '1px solid #e0e0e0',
                             borderRadius: 1,
                             backgroundColor: selectedOptions.includes(option.id) 
                               ? '#e3f2fd' 
                               : 'white',
                             cursor: 'pointer',
                             '&:hover': {
                               backgroundColor: selectedOptions.includes(option.id) 
                                 ? '#bbdefb' 
                                 : '#f5f5f5'
                             }
                           }}
                           onClick={() => handleOptionChange(option.id)}
                         >
                           <Checkbox
                             checked={selectedOptions.includes(option.id)}
                             onChange={() => handleOptionChange(option.id)}
                             size="small"
                           />
                           <Box sx={{ flex: 1 }}>
                             <Typography variant="body2" fontWeight="medium">
                               {option.name}
                             </Typography>
                             <Typography variant="caption" color="textSecondary">
                               +{option.price.toLocaleString()}원
                             </Typography>
                           </Box>
                         </Box>
                       </Grid>
                     ))}
                   </Grid>
                   {selectedOptions.length > 0 && (
                     <Box sx={{ mt: 1 }}>
                       <Typography 
                         variant="body2" 
                         color={formData.isInternal ? 'grey.800' : 'primary.main'}
                       >
                         선택된 옵션: {selectedOptions.map(id => {
                           const option = pricingOptions.find(opt => opt.id === id);
                           return `${option?.name} (+${option?.price.toLocaleString()}원)`;
                         }).join(', ')}
                       </Typography>
                     </Box>
                   )}
                 </Box>
               )}
             </Box>

            {/* 추가된 품목 목록 */}
            {items.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  추가된 품목
                </Typography>
                {items.map((item, index) => (
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
                      backgroundColor: item.name === '기본출장비' ? '#f5f5f5' : 'white'
                    }}
                  >
                                         <Box sx={{ flex: 1 }}>
                       <Typography variant="subtitle2" fontWeight="bold">
                         {item.name}
                         {item.name === '기본출장비' && (
                           <Chip 
                             label="자동추가" 
                             size="small" 
                             color="info" 
                             sx={{ ml: 1 }}
                           />
                         )}
                       </Typography>
                       {item.options && item.options.length > 0 && (
                         <Box sx={{ mt: 1 }}>
                           <Typography 
                             variant="caption" 
                             color={formData.isInternal ? 'grey.800' : 'primary.main'}
                           >
                             옵션: {item.options.map(optionId => {
                               const option = pricingOptions.find(opt => opt.id === optionId);
                               return option?.name;
                             }).join(', ')}
                           </Typography>
                         </Box>
                       )}
                       <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                         <TextField
                           size="small"
                           label="수량"
                           type="number"
                           value={item.quantity}
                           onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                           sx={{ width: 100 }}
                           disabled={item.name === '기본출장비'}
                         />
                         <TextField
                           size="small"
                           label="단가 (원)"
                           type="number"
                           value={item.unitPrice}
                           onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value) || 0)}
                           sx={{ width: 150 }}
                           disabled={item.name === '기본출장비'}
                         />
                       </Box>
                     </Box>
                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                      <Typography 
                        variant="h6" 
                        color={formData.isInternal ? 'grey.800' : 'primary.main'} 
                        fontWeight="bold"
                      >
                        {item.totalPrice.toLocaleString()}원
                      </Typography>
                    </Box>
                    {item.name !== '기본출장비' && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                
                {/* 총 예산 표시 */}
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: formData.isInternal ? 'grey.800' : 'primary.main', 
                  borderRadius: 1 
                }}>
                  <Typography 
                    variant="h6" 
                    color="white" 
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <CalculateIcon />
                    총 예산: {calculateTotalBudget().toLocaleString()}원
                    {formData.isInternal && (
                      <Chip 
                        label="자사시공" 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          bgcolor: 'grey.600', 
                          color: 'white',
                          fontSize: '0.75rem'
                        }} 
                      />
                    )}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 작업 설명 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                작업 설명
              </Typography>
                             <TextField
                 fullWidth
                 label="작업 설명"
                 multiline
                 rows={3}
                 value={formData.description}
                 onChange={(e) => handleInputChange('description', e.target.value)}
                 placeholder="작업에 대한 상세한 설명을 입력하세요 (선택사항)"
               />
              
              {/* 작업 설명 예시 */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  자주 사용하는 설명 예시 (클릭하여 추가):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { title: '꼼꼼시공', content: '고객분이 세심하게 시공해주시길 원하세요' },
                    { title: '바닥주의', content: '바닥에 흠집이 없게 주의해주세요' },
                    { title: '소파이동', content: '고객님께 소파이동에 대해 상의후 작업해주세요' },
                    { title: '침대보양', content: '침대를 밟는것에 대해 고객분과 상의후 비닐로 덮고 진행해주세요' },
                    { title: '아기주의', content: '이 댁에 아기가 있어요 소음에 신경써주세요' },
                    { title: '친절부탁', content: '최대한 고객님께 친절하게 시공 부탁드려요' }
                  ].map((example, index) => (
                    <Chip
                      key={index}
                      label={example.title}
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddDescriptionExample(example.content)}
                      sx={{
                        cursor: 'pointer',
                        borderColor: formData.isInternal ? 'grey.600' : 'primary.main',
                        color: formData.isInternal ? 'grey.700' : 'primary.main',
                        '&:hover': {
                          backgroundColor: formData.isInternal ? 'grey.600' : 'primary.light',
                          color: 'white'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* 작업지시서 파일 업로드 섹션 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                작업지시서 파일 첨부 (선택사항)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                작업지시서, 도면, 사진 등을 첨부할 수 있습니다. (JPG, PNG, GIF, PDF, DOC, DOCX, 최대 10MB)
              </Typography>
              
              {/* 파일 업로드 버튼 */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="work-instruction-file-upload"
                  multiple
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="work-instruction-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{
                      borderColor: formData.isInternal ? 'grey.600' : 'primary.main',
                      color: formData.isInternal ? 'grey.700' : 'primary.main',
                      '&:hover': {
                        borderColor: formData.isInternal ? 'grey.800' : 'primary.dark',
                        backgroundColor: formData.isInternal ? 'grey.100' : 'primary.50'
                      }
                    }}
                  >
                    파일 선택
                  </Button>
                </label>
              </Box>

              {/* 첨부된 파일 목록 */}
              {workInstructions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    첨부된 파일 ({workInstructions.length}개)
                  </Typography>
                  {workInstructions.map((file, index) => (
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
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {file.fileName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatFileSize(file.fileSize)} • {file.fileType}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleFileDelete(file.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* 포인트 잔액 검증 섹션 */}
            {pointValidation && (
              <Box sx={{ mt: 3 }}>
                <Alert 
                  severity={pointValidation.isValid ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      <strong>포인트 잔액 검증:</strong><br />
                      현재 잔액: {pointValidation.currentBalance.toLocaleString()}포인트<br />
                      필요 금액: {pointValidation.requiredAmount.toLocaleString()}포인트<br />
                      {!pointValidation.isValid && (
                        <span style={{ color: 'red' }}>
                          부족 금액: {pointValidation.shortage.toLocaleString()}포인트
                        </span>
                      )}
                    </Typography>
                    {!pointValidation.isValid && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Payment />}
                        onClick={handleChargeDialogOpen}
                        size="small"
                      >
                        포인트 충전
                      </Button>
                    )}
                  </Box>
                </Alert>
              </Box>
            )}

            {/* 픽업 정보 섹션 */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                픽업 정보 (시공자 확인용)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                프로필에 저장된 픽업 정보가 자동으로 입력됩니다. 필요시 수정하세요.
              </Typography>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="상호"
                      value={pickupInfo.companyName}
                      onChange={(e) => handlePickupInfoChange('companyName', e.target.value)}
                      placeholder="픽업할 업체명을 입력하세요"
                      InputProps={{
                        startAdornment: pickupInfo.companyName && (
                          <Chip 
                            label="자동입력" 
                            size="small" 
                            color="info" 
                            sx={{ mr: 1, fontSize: '0.7rem' }}
                          />
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="연락처"
                      value={pickupInfo.phone}
                      onChange={(e) => handlePickupInfoChange('phone', e.target.value)}
                      placeholder="010-0000-0000"
                      InputProps={{
                        startAdornment: pickupInfo.phone && (
                          <Chip 
                            label="자동입력" 
                            size="small" 
                            color="info" 
                            sx={{ mr: 1, fontSize: '0.7rem' }}
                          />
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <AddressSearch
                      value={pickupInfo.address}
                      onChange={(address) => handlePickupInfoChange('address', address)}
                      placeholder="픽업할 장소의 주소를 입력하세요"
                      label="픽업 주소"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="준비예정일"
                      type="date"
                      value={pickupInfo.scheduledDateTime ? pickupInfo.scheduledDateTime.split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const time = pickupInfo.scheduledDateTime ? pickupInfo.scheduledDateTime.split('T')[1] || '09:00' : '09:00';
                        handlePickupInfoChange('scheduledDateTime', `${date}T${time}`);
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0]
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>준비예정시간</InputLabel>
                      <Select
                        value={pickupInfo.scheduledDateTime ? pickupInfo.scheduledDateTime.split('T')[1] || '09:00' : '09:00'}
                        label="준비예정시간"
                        onChange={(e) => {
                          const date = pickupInfo.scheduledDateTime ? pickupInfo.scheduledDateTime.split('T')[0] : new Date().toISOString().split('T')[0];
                          const time = e.target.value;
                          handlePickupInfoChange('scheduledDateTime', `${date}T${time}`);
                        }}
                      >
                        {timeOptions.map((time) => (
                          <MenuItem key={time} value={time}>
                            {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                {pickupInfo.scheduledDateTime && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    픽업 준비예정일시: {pickupInfo.scheduledDateTime.split('T')[0]} {pickupInfo.scheduledDateTime.split('T')[1]}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: formData.isInternal ? 'grey.800' : 'primary.main',
            '&:hover': {
              bgcolor: formData.isInternal ? 'grey.900' : 'primary.dark'
            }
          }}
        >
          {loading ? '등록 중...' : '작업 등록'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* 포인트 충전 다이얼로그 */}
    <Dialog open={chargeDialogOpen} onClose={handleChargeDialogClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Payment color="primary" />
          포인트 충전
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" mb={3}>
          포인트 부족으로 작업을 등록할 수 없습니다. 충전 후 다시 시도해주세요.
        </Typography>
        
        {/* 충전 금액 옵션 */}
        <Grid container spacing={2} mb={3}>
          {chargeOptions.map((option) => (
            <Grid item xs={12} sm={6} key={option.amount}>
              <Button
                variant={selectedAmount === option.amount ? "contained" : "outlined"}
                fullWidth
                onClick={() => handleAmountSelect(option.amount)}
                sx={{ py: 2 }}
              >
                {option.label}
              </Button>
            </Grid>
          ))}
        </Grid>
        
        {/* 직접 입력 */}
        <TextField
          fullWidth
          label="직접 입력 (원)"
          type="number"
          value={chargeAmount}
          onChange={(e) => {
            setChargeAmount(e.target.value);
            setSelectedAmount(null);
          }}
          placeholder="충전할 포인트를 입력하세요"
          InputProps={{
            endAdornment: <Typography variant="caption">포인트</Typography>
          }}
          sx={{ mb: 3 }}
        />

        {/* 결제 수단 선택 */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            결제 수단
          </Typography>
          <RadioGroup
            row
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <FormControlLabel 
              value="simulation" 
              control={<Radio />} 
              label="시뮬레이션 (테스트용)" 
            />
            <FormControlLabel 
              value="toss_payments" 
              control={<Radio />} 
              label="토스페이먼츠" 
            />
          </RadioGroup>
        </FormControl>

        {/* 토스페이먼츠 결제 수단 선택 */}
        {paymentMethod === 'toss_payments' && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>결제 방법</InputLabel>
            <Select
              value={tossPaymentMethod}
              label="결제 방법"
              onChange={(e) => setTossPaymentMethod(e.target.value)}
            >
              <MenuItem value="카드">신용카드</MenuItem>
              <MenuItem value="가상계좌">가상계좌</MenuItem>
              <MenuItem value="계좌이체">계좌이체</MenuItem>
            </Select>
          </FormControl>
        )}
        
        {chargeAmount && (
          <Box mt={2} p={2} bgcolor="primary.light" borderRadius={1}>
            <Typography variant="body2" color="white">
              충전 예정: {parseInt(chargeAmount) || 0}포인트 ({(parseInt(chargeAmount) || 0).toLocaleString()}원)
            </Typography>
          </Box>
        )}
        
        <Alert severity="info" sx={{ mt: 2 }}>
          충전 완료 후 자동으로 포인트 잔액이 업데이트되며, 작업 등록을 계속 진행할 수 있습니다.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleChargeDialogClose}>
          취소
        </Button>
        <Button
          onClick={handleCharge}
          variant="contained"
          disabled={charging || !chargeAmount || parseInt(chargeAmount) <= 0}
          startIcon={charging ? <CircularProgress size={16} /> : <CheckCircle />}
        >
          {charging ? '충전 중...' : '충전하기'}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default CreateJobDialog;
