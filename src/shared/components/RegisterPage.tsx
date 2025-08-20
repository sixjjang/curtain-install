import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  SelectChangeEvent,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  PhotoCamera, 
  Add, 
  Delete, 
  Business, 
  Person,
  Upload,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { formatPhoneInput, extractPhoneNumbers } from '../utils/phoneFormatter';

// 시공 가능지역 데이터
const regionData = {
  '서울특별시': ['강남구', '서초구', '마포구', '송파구', '영등포구', '종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '강서구', '구로구', '금천구', '동작구', '관악구'],
  '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
  '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
  '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
  '세종특별자치시': ['세종특별자치시'],
  '경기도': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양군', '연천군', '가평군'],
  '강원도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  '충청북도': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  '충청남도': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  '전라북도': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  '경상북도': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  '경상남도': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  '제주특별자치도': ['제주특별자치도']
};

const steps = ['기본 정보', '역할 선택', '상세 정보', '승인 대기'];

const RegisterPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // 기본 정보
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: '' as UserRole,
    
    // 판매자 정보
    companyName: '',
    businessNumber: '',
    businessAddress: '',
    businessType: '',
    businessCategory: '',
    businessLicenseImage: null as File | null,
    
    // 픽업 정보
    pickupCompanyName: '',
    pickupPhone: '',
    pickupAddress: '',
    
    // 시공자 정보
    businessName: '', // 상호명
    contractorBusinessNumber: '', // 시공자 사업자등록번호
    contractorBusinessAddress: '', // 시공자 사업장주소
    contractorBusinessType: '', // 시공자 업태
    contractorBusinessCategory: '', // 시공자 종목
    contractorBusinessLicenseImage: null as File | null, // 시공자 사업자등록증
    profileImage: null as File | null,
    idCardImage: null as File | null, // 본인 반명함판 사진
    serviceAreas: [] as string[],
    experience: '',
    bankAccount: '',
    bankName: '',
    accountHolder: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [duplicateCheck, setDuplicateCheck] = useState({
    email: false,
    phone: false
  });
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  
  const { register } = useAuth();

  // 중복 체크 함수
  const checkDuplicate = async (type: 'email' | 'phone', value: string) => {
    if (!value.trim()) {
      setError(`${type === 'email' ? '이메일' : '전화번호'}을 입력해주세요.`);
      return false;
    }

    try {
      setCheckingDuplicate(true);
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      const usersRef = collection(db, 'users');
      
      // 전화번호인 경우 숫자만 추출하여 비교
      const searchValue = type === 'phone' ? extractPhoneNumbers(value) : value;
      
      // 전화번호 중복 확인 시 숫자만으로 검색
      if (type === 'phone') {
        const q = query(usersRef, where('phoneNumbers', '==', searchValue));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setError(`이미 사용 중인 전화번호입니다.`);
          setDuplicateCheck(prev => ({ ...prev, [type]: false }));
          return false;
        } else {
          setDuplicateCheck(prev => ({ ...prev, [type]: true }));
          setError('');
          return true;
        }
      } else {
        // 이메일 중복 확인
        const q = query(usersRef, where(type, '==', value));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setError(`이미 사용 중인 이메일입니다.`);
          setDuplicateCheck(prev => ({ ...prev, [type]: false }));
          return false;
        } else {
          setDuplicateCheck(prev => ({ ...prev, [type]: true }));
          setError('');
          return true;
        }
      }
    } catch (error) {
      console.error('중복 체크 실패:', error);
      setError('중복 체크 중 오류가 발생했습니다.');
      return false;
    } finally {
      setCheckingDuplicate(false);
    }
  };
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // 전화번호 필드인 경우 포맷팅 적용
    if (name === 'phone' || name === 'pickupPhone') {
      const formattedValue = formatPhoneInput(value as string);
      setFormData(prev => ({
        ...prev,
        [name as string]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name as string]: value
      }));
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'license' | 'idCard' | 'contractorLicense') => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 크기 최적화 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      if (type === 'profile') {
        setFormData(prev => ({ ...prev, profileImage: file }));
      } else if (type === 'license') {
        setFormData(prev => ({ ...prev, businessLicenseImage: file }));
      } else if (type === 'idCard') {
        setFormData(prev => ({ ...prev, idCardImage: file }));
      } else if (type === 'contractorLicense') {
        setFormData(prev => ({ ...prev, contractorBusinessLicenseImage: file }));
      }
    }
  };

  const handleServiceAreaChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFormData(prev => ({
      ...prev,
      serviceAreas: value
    }));
  };

  const handleRegionToggle = (region: string) => {
    setExpandedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleAreaSelect = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter(a => a !== area)
        : [...prev.serviceAreas, area]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // 기본 정보
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name || !formData.phone) {
          setError('모든 필드를 입력해주세요.');
          return false;
        }
        if (!duplicateCheck.email) {
          setError('이메일 중복 확인을 완료해주세요.');
          return false;
        }
        if (!duplicateCheck.phone) {
          setError('전화번호 중복 확인을 완료해주세요.');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return false;
        }
        if (formData.password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.');
          return false;
        }
        break;
      
      case 1: // 역할 선택
        if (!formData.role) {
          setError('역할을 선택해주세요.');
          return false;
        }
        break;
      
      case 2: // 상세 정보
                 if (formData.role === 'seller') {
           if (!formData.companyName || !formData.businessNumber || !formData.businessAddress || 
               !formData.businessType || !formData.businessCategory) {
             setError('판매자 정보를 모두 입력해주세요.');
             return false;
           }
         } else if (formData.role === 'contractor') {
          if (formData.serviceAreas.length === 0 || !formData.experience || 
              !formData.bankAccount || !formData.bankName || !formData.accountHolder || !formData.idCardImage) {
            setError('시공자 정보를 모두 입력해주세요. (본인 반명함판 사진 포함)');
            return false;
          }
        }
        break;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // 이메일 중복 확인 (선택사항 - Firebase Auth에서 자동으로 처리됨)
      console.log('📧 회원가입 시도:', formData.email);
      
      await register(
        formData.email, 
        formData.password, 
        formData.name, 
        formData.phone, // 포맷팅된 전화번호 (표시용)
        formData.role,
        formData.profileImage,
        formData.idCardImage,
        formData.serviceAreas,
        formData.experience,
        formData.bankAccount,
        formData.bankName,
        formData.accountHolder,
        // 시공자 사업 정보 (선택사항)
        formData.businessName,
        formData.contractorBusinessNumber,
        formData.contractorBusinessAddress,
        formData.contractorBusinessType,
        formData.contractorBusinessCategory,
        formData.contractorBusinessLicenseImage,
        // 판매자 추가 정보
        formData.companyName,
        formData.businessNumber,
        formData.businessAddress,
        formData.businessType,
        formData.businessCategory,
        formData.businessLicenseImage,
        // 픽업 정보
        formData.pickupCompanyName,
        formData.pickupPhone, // 포맷팅된 픽업 전화번호 (표시용)
        formData.pickupAddress
      );
      
      // 회원가입 성공 후 승인 대기 페이지로
      setActiveStep(3);
         } catch (error: any) {
       console.error('회원가입 오류:', error);
       // AuthService에서 전달된 사용자 친화적 메시지 사용
       setError(error.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
     } finally {
       setLoading(false);
     }
  };

  const renderBasicInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          기본 정보
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="이름"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="이메일 주소"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={duplicateCheck.email === false && formData.email !== ''}
          helperText={duplicateCheck.email === false && formData.email !== '' ? '중복 체크가 필요합니다.' : ''}
          InputProps={{
            endAdornment: (
              <Button
                variant="outlined"
                size="small"
                onClick={() => checkDuplicate('email', formData.email)}
                disabled={checkingDuplicate || !formData.email}
                sx={{ minWidth: '80px' }}
              >
                {checkingDuplicate ? '확인중' : duplicateCheck.email ? '확인됨' : '중복확인'}
              </Button>
            )
          }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="연락처"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          error={duplicateCheck.phone === false && formData.phone !== ''}
          helperText={duplicateCheck.phone === false && formData.phone !== '' ? '중복 체크가 필요합니다.' : ''}
          InputProps={{
            endAdornment: (
              <Button
                variant="outlined"
                size="small"
                onClick={() => checkDuplicate('phone', formData.phone)}
                disabled={checkingDuplicate || !formData.phone}
                sx={{ minWidth: '80px' }}
              >
                {checkingDuplicate ? '확인중' : duplicateCheck.phone ? '확인됨' : '중복확인'}
              </Button>
            )
          }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          name="password"
          label="비밀번호"
          type="password"
          value={formData.password}
          onChange={handleChange}
          helperText="6자 이상 입력해주세요"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          name="confirmPassword"
          label="비밀번호 확인"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  );

  const renderRoleSelection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          역할 선택
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          어떤 역할로 가입하시겠습니까?
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card 
          sx={{ 
            cursor: 'pointer', 
            border: formData.role === 'seller' ? 2 : 1,
            borderColor: formData.role === 'seller' ? 'primary.main' : 'divider',
            bgcolor: formData.role === 'seller' ? 'primary.50' : 'background.paper'
          }}
          onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
        >
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Business sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              판매자
            </Typography>
            <Typography variant="body2" color="textSecondary">
              커튼을 판매하고 고객과 연결하는 역할
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card 
          sx={{ 
            cursor: 'pointer', 
            border: formData.role === 'contractor' ? 2 : 1,
            borderColor: formData.role === 'contractor' ? 'primary.main' : 'divider',
            bgcolor: formData.role === 'contractor' ? 'primary.50' : 'background.paper'
          }}
          onClick={() => setFormData(prev => ({ ...prev, role: 'contractor' }))}
        >
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Person sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              시공자
            </Typography>
            <Typography variant="body2" color="textSecondary">
              실제 커튼 시공을 담당하는 역할
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSellerInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          판매자 정보
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="상호명"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="사업자등록번호"
          name="businessNumber"
          value={formData.businessNumber}
          onChange={handleChange}
          placeholder="000-00-00000"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="사업장 주소"
          name="businessAddress"
          value={formData.businessAddress}
          onChange={handleChange}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="업태"
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          placeholder="예: 도소매업"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="종목"
          name="businessCategory"
          value={formData.businessCategory}
          onChange={handleChange}
          placeholder="예: 커튼도소매"
        />
      </Grid>
      
             <Grid item xs={12}>
         <Typography variant="subtitle1" gutterBottom>
           사업자등록증 사본 (선택사항)
         </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="business-license-upload"
            type="file"
            onChange={(e) => handleImageChange(e, 'license')}
          />
          <label htmlFor="business-license-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Upload />}
            >
              사업자등록증 업로드
            </Button>
          </label>
          {formData.businessLicenseImage && (
            <Typography variant="body2" color="success.main">
              ✓ {formData.businessLicenseImage.name}
            </Typography>
          )}
        </Box>
                 <Alert severity="warning" sx={{ mt: 1 }}>
           <Typography variant="caption">
             <strong>⚠️ 이미지 업로드 주의사항:</strong><br />
             • 5MB 이하의 이미지 파일만 업로드 가능합니다<br />
             • 현재 Firebase Storage 연결 문제로 업로드가 실패할 수 있습니다<br />
             • 업로드 실패 시에도 회원가입은 정상적으로 진행됩니다<br />
             • 나중에 프로필에서 이미지를 추가할 수 있습니다<br />
             • 이미지 없이도 회원가입이 완료됩니다
           </Typography>
           <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
             <Button
               size="small"
               variant="outlined"
               onClick={() => window.location.href = '/storage-guide'}
               sx={{ fontSize: '0.75rem' }}
             >
               Storage 설정 가이드
             </Button>
             <Button
               size="small"
               variant="text"
               onClick={() => window.location.href = '/register'}
               sx={{ fontSize: '0.75rem' }}
             >
               이미지 없이 회원가입
             </Button>
           </Box>
         </Alert>
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          픽업 정보 (선택사항)
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="픽업 상호명"
          name="pickupCompanyName"
          value={formData.pickupCompanyName}
          onChange={handleChange}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="픽업 연락처"
          name="pickupPhone"
          value={formData.pickupPhone}
          onChange={handleChange}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="픽업 주소"
          name="pickupAddress"
          value={formData.pickupAddress}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  );

  const renderContractorInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          시공자 정보
        </Typography>
      </Grid>

      {/* 프로필 사진 */}
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{ width: 80, height: 80 }}
            src={formData.profileImage ? URL.createObjectURL(formData.profileImage) : undefined}
          >
            {formData.name ? formData.name.charAt(0) : <PhotoCamera />}
          </Avatar>
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-image-upload"
              type="file"
              onChange={(e) => handleImageChange(e, 'profile')}
            />
            <label htmlFor="profile-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
              >
                프로필 사진 업로드 (선택)
              </Button>
            </label>
            <Typography variant="caption" display="block" color="textSecondary">
              {formData.profileImage ? formData.profileImage.name : '사진을 선택해주세요'}
            </Typography>
          </Box>
        </Box>
      </Grid>

      {/* 시공자 사업 정보 (선택사항) */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          사업 정보 (선택사항)
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          사업자 정보는 선택사항입니다. 개인 시공자도 가입 가능합니다.
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="상호명"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="예: 홍길동 커튼"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="사업자등록번호"
          name="contractorBusinessNumber"
          value={formData.contractorBusinessNumber}
          onChange={handleChange}
          placeholder="000-00-00000"
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="사업장 주소"
          name="contractorBusinessAddress"
          value={formData.contractorBusinessAddress}
          onChange={handleChange}
          placeholder="사업장 주소를 입력하세요"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="업태"
          name="contractorBusinessType"
          value={formData.contractorBusinessType}
          onChange={handleChange}
          placeholder="예: 도소매업"
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="종목"
          name="contractorBusinessCategory"
          value={formData.contractorBusinessCategory}
          onChange={handleChange}
          placeholder="예: 커튼도소매"
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          사업자등록증 사본 (선택사항)
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="contractor-business-license-upload"
            type="file"
            onChange={(e) => handleImageChange(e, 'contractorLicense')}
          />
          <label htmlFor="contractor-business-license-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<Upload />}
            >
              사업자등록증 업로드
            </Button>
          </label>
          {formData.contractorBusinessLicenseImage && (
            <Typography variant="body2" color="success.main">
              ✓ {formData.contractorBusinessLicenseImage.name}
            </Typography>
          )}
        </Box>
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="caption">
            <strong>📋 사업자등록증 업로드 안내:</strong><br />
            • 사업자등록증 사본을 업로드해주세요 (선택사항)<br />
            • 5MB 이하의 이미지 파일만 업로드 가능합니다<br />
            • 개인 시공자의 경우 업로드하지 않아도 됩니다
          </Typography>
        </Alert>
      </Grid>

      {/* 본인 반명함판 사진 (필수) */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom color="error.main">
          본인 반명함판 사진 업로드 (필수)
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{ width: 80, height: 80, border: '2px solid #f44336' }}
            src={formData.idCardImage ? URL.createObjectURL(formData.idCardImage) : undefined}
          >
            {formData.idCardImage ? <CheckCircle color="success" /> : <Warning color="error" />}
          </Avatar>
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="id-card-image-upload"
              type="file"
              onChange={(e) => handleImageChange(e, 'idCard')}
            />
            <label htmlFor="id-card-image-upload">
              <Button
                variant="contained"
                color="error"
                component="span"
                startIcon={<Upload />}
              >
                본인 반명함판 사진 업로드
              </Button>
            </label>
            <Typography variant="caption" display="block" color="textSecondary">
              {formData.idCardImage ? formData.idCardImage.name : '본인 반명함판 사진을 업로드해주세요 (필수)'}
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                <strong>📋 본인 반명함판 사진 업로드 안내:</strong><br />
                • 본인 신분증의 반명함판 사진을 업로드해주세요<br />
                • 관리자 승인 시 본인 확인용으로 사용됩니다<br />
                • 5MB 이하의 이미지 파일만 업로드 가능합니다<br />
                • 개인정보 보호를 위해 승인 후 자동 삭제됩니다
              </Typography>
            </Alert>
          </Box>
        </Box>
      </Grid>

      {/* 시공 가능지역 */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          시공 가능지역 선택 ({formData.serviceAreas.length}개 선택됨)
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
          {Object.entries(regionData).map(([region, cities]) => (
            <Box key={region} sx={{ mb: 2 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => handleRegionToggle(region)}
                sx={{ 
                  justifyContent: 'space-between', 
                  width: '100%',
                  textAlign: 'left',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {region}
                {expandedRegions.includes(region) ? '▼' : '▶'}
              </Button>
              {expandedRegions.includes(region) && (
                <Box sx={{ ml: 2, mt: 1 }}>
                  <Grid container spacing={1}>
                    {cities.map((city) => (
                      <Grid item xs={6} sm={4} key={city}>
                        <Chip
                          label={city}
                          size="small"
                          color={formData.serviceAreas.includes(city) ? "primary" : "default"}
                          onClick={() => handleAreaSelect(city)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Grid>

      {/* 시공경력 */}
      <Grid item xs={12}>
        <TextField
          required
          fullWidth
          label="시공경력"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          placeholder="예: 5년, 3년 6개월"
        />
      </Grid>

      {/* 계좌정보 */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth required>
          <InputLabel>은행 선택</InputLabel>
          <Select
            name="bankName"
            value={formData.bankName}
            label="은행 선택"
            onChange={handleChange}
          >
            <MenuItem value="신한은행">신한은행</MenuItem>
            <MenuItem value="KB국민은행">KB국민은행</MenuItem>
            <MenuItem value="우리은행">우리은행</MenuItem>
            <MenuItem value="하나은행">하나은행</MenuItem>
            <MenuItem value="NH농협은행">NH농협은행</MenuItem>
            <MenuItem value="기업은행">기업은행</MenuItem>
            <MenuItem value="새마을금고">새마을금고</MenuItem>
            <MenuItem value="신협">신협</MenuItem>
            <MenuItem value="우체국">우체국</MenuItem>
            <MenuItem value="카카오뱅크">카카오뱅크</MenuItem>
            <MenuItem value="토스뱅크">토스뱅크</MenuItem>
            <MenuItem value="케이뱅크">케이뱅크</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="계좌번호"
          name="bankAccount"
          value={formData.bankAccount}
          onChange={handleChange}
          placeholder="계좌번호를 입력해주세요"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          label="예금주"
          name="accountHolder"
          value={formData.accountHolder}
          onChange={handleChange}
          placeholder="예금주명을 입력해주세요"
        />
      </Grid>
    </Grid>
  );

  const renderApprovalWaiting = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        회원가입 완료!
      </Typography>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        관리자 승인 대기 중
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        제출하신 정보를 검토한 후 승인해드리겠습니다.<br />
        승인 완료 시 이메일로 알려드립니다.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'info.50' }}>
        <Typography variant="h6" gutterBottom>
          제출된 정보
        </Typography>
        <Box sx={{ textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>이름:</strong> {formData.name}
          </Typography>
          <Typography variant="body2">
            <strong>이메일:</strong> {formData.email}
          </Typography>
          <Typography variant="body2">
            <strong>역할:</strong> {formData.role === 'seller' ? '판매자' : '시공자'}
          </Typography>
          {formData.role === 'seller' && (
            <>
              <Typography variant="body2">
                <strong>상호명:</strong> {formData.companyName}
              </Typography>
              <Typography variant="body2">
                <strong>사업자등록번호:</strong> {formData.businessNumber}
              </Typography>
            </>
          )}
          {formData.role === 'contractor' && (
            <>
              <Typography variant="body2">
                <strong>시공경력:</strong> {formData.experience}
              </Typography>
              <Typography variant="body2">
                <strong>시공가능지역:</strong> {formData.serviceAreas.length}개 지역
              </Typography>
            </>
          )}
        </Box>
      </Paper>
      
      <Button
        variant="contained"
        onClick={() => navigate('/login')}
        sx={{ mr: 2 }}
      >
        로그인 페이지로
      </Button>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderRoleSelection();
      case 2:
        return formData.role === 'seller' ? renderSellerInfo() : renderContractorInfo();
      case 3:
        return renderApprovalWaiting();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 800 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              회원가입
            </Typography>
            
            <Typography variant="body1" align="center" color="textSecondary" gutterBottom>
              전문가의 손길에 오신 것을 환영합니다
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {activeStep < 3 && (
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {getStepContent(activeStep)}
              
              {activeStep < 3 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                  >
                    이전
                  </Button>
                  <Box>
                    {activeStep === steps.length - 2 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? '처리 중...' : '회원가입 완료'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                      >
                        다음
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
            
            {activeStep < 3 && (
              <Box textAlign="center" sx={{ mt: 3 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    이미 계정이 있으신가요? 로그인
                  </Typography>
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default RegisterPage;
