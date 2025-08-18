import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Delete,
  Refresh,
  Person,
  Business
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';

interface TestAccount {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyName?: string;
}

const TestAccounts: React.FC = () => {
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [newAccount, setNewAccount] = useState<TestAccount>({
    email: '',
    password: '123456',
    name: '',
    role: 'seller'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { register } = useAuth();

  // 기본 테스트 계정들
  const defaultAccounts: TestAccount[] = [
    {
      email: 'seller1@test.com',
      password: '123456',
      name: '김판매',
      role: 'seller',
      companyName: '커튼하우스'
    },
    {
      email: 'seller2@test.com',
      password: '123456',
      name: '이판매',
      role: 'seller',
      companyName: '블라인드월드'
    },
    {
      email: 'contractor1@test.com',
      password: '123456',
      name: '박시공',
      role: 'contractor'
    },
    {
      email: 'contractor2@test.com',
      password: '123456',
      name: '최시공',
      role: 'contractor'
    }
  ];

  useEffect(() => {
    setTestAccounts(defaultAccounts);
  }, []);

  const handleCreateAccount = async (account: TestAccount) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      console.log('테스트 계정 생성 시도:', account.email);

      await register(
        account.email,
        account.password,
        account.name,
        '010-0000-0000',
        account.role,
        undefined, // profileImage
        undefined, // idCardImage
        [], // serviceAreas
        '5년', // experience
        '123-456789', // bankAccount
        '신한은행', // bankName
        account.name, // accountHolder (예금주는 이름과 동일하게 설정)
        // 판매자 정보
        account.companyName || '',
        '123-45-67890',
        '서울시 강남구',
        '도소매업',
        '커튼도소매',
        undefined, // businessLicenseImage
        // 픽업 정보
        '',
        '',
        ''
      );

      setMessage(`✅ 테스트 계정 생성 성공: ${account.email}`);
      console.log('테스트 계정 생성 완료:', account.email);
    } catch (error: any) {
      console.error('테스트 계정 생성 실패:', error);
      setError(`❌ 계정 생성 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllAccounts = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    for (const account of testAccounts) {
      try {
        await handleCreateAccount(account);
        // 각 계정 생성 사이에 약간의 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${account.email} 계정 생성 실패:`, error);
      }
    }

    setMessage('모든 테스트 계정 생성 완료');
    setLoading(false);
  };

  const handleAddAccount = () => {
    if (!newAccount.email || !newAccount.name) {
      setError('이메일과 이름을 입력해주세요.');
      return;
    }

    setTestAccounts(prev => [...prev, newAccount]);
    setNewAccount({
      email: '',
      password: '123456',
      name: '',
      role: 'seller'
    });
    setError('');
  };

  const handleRemoveAccount = (email: string) => {
    setTestAccounts(prev => prev.filter(account => account.email !== email));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        테스트 계정 관리
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        이 페이지는 개발 및 테스트를 위한 계정을 생성하는 도구입니다.
        실제 운영 환경에서는 사용하지 마세요.
      </Alert>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 새 계정 추가 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            새 테스트 계정 추가
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="이메일"
                value={newAccount.email}
                onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                placeholder="test@example.com"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="이름"
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="홍길동"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>역할</InputLabel>
                <Select
                  value={newAccount.role}
                  label="역할"
                  onChange={(e) => setNewAccount(prev => ({ ...prev, role: e.target.value as UserRole }))}
                >
                  <MenuItem value="seller">판매자</MenuItem>
                  <MenuItem value="contractor">시공자</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="상호명 (판매자용)"
                value={newAccount.companyName || ''}
                onChange={(e) => setNewAccount(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="회사명"
                disabled={newAccount.role === 'contractor'}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddAccount}
                startIcon={<Add />}
              >
                추가
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 계정 목록 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              테스트 계정 목록 ({testAccounts.length}개)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleCreateAllAccounts}
                disabled={loading}
                startIcon={<Refresh />}
              >
                {loading ? '생성 중...' : '모든 계정 생성'}
              </Button>
            </Box>
          </Box>
          
          <List>
            {testAccounts.map((account, index) => (
              <React.Fragment key={account.email}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {account.role === 'seller' ? <Business color="primary" /> : <Person color="secondary" />}
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ({account.role === 'seller' ? '판매자' : '시공자'})
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          이메일: {account.email}
                        </Typography>
                        <Typography variant="body2">
                          비밀번호: {account.password}
                        </Typography>
                        {account.companyName && (
                          <Typography variant="body2">
                            상호명: {account.companyName}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleCreateAccount(account)}
                        disabled={loading}
                      >
                        생성
                      </Button>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveAccount(account.email)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < testAccounts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/login'}
        >
          로그인 페이지로
        </Button>
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/register'}
        >
          회원가입 페이지로
        </Button>
      </Box>
    </Box>
  );
};

export default TestAccounts;
