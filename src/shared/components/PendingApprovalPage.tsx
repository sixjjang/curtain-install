import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  Warning,
  Person,
  Schedule,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    if (user?.role === 'seller') {
      navigate('/seller/profile');
    } else if (user?.role === 'contractor') {
      navigate('/contractor/profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh'
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 600 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3 }}>
              <Warning sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                승인 대기 중
              </Typography>
              <Typography variant="h6" color="textSecondary">
                관리자 승인을 기다리고 있습니다
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 사용자 정보 */}
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                사용자 정보
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body1">
                  <strong>이름:</strong> {user.name}
                </Typography>
                <Typography variant="body1">
                  <strong>이메일:</strong> {user.email}
                </Typography>
                <Typography variant="body1">
                  <strong>역할:</strong> 
                  <Chip 
                    label={user.role === 'seller' ? '판매자' : user.role === 'contractor' ? '시공자' : user.role}
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                {user.companyName && (
                  <Typography variant="body1">
                    <strong>상호명:</strong> {user.companyName}
                  </Typography>
                )}
                {user.businessName && (
                  <Typography variant="body1">
                    <strong>상호명:</strong> {user.businessName}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 승인 상태 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                승인 상태
              </Typography>
              <Chip
                icon={<Schedule />}
                label="승인 대기 중"
                color="warning"
                variant="outlined"
                sx={{ fontSize: '1rem', py: 1 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                관리자가 서류를 검토한 후 승인 여부를 결정합니다.
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 안내 메시지 */}
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>현재 접근 가능한 기능:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
                <li>프로필 정보 확인 및 수정</li>
                <li>로그아웃</li>
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>승인 후 사용 가능한 기능:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
                {user.role === 'seller' && (
                  <>
                    <li>작업 관리 및 등록</li>
                    <li>시공자 검색 및 채팅</li>
                    <li>결제 및 포인트 관리</li>
                  </>
                )}
                {user.role === 'contractor' && (
                  <>
                    <li>작업 목록 확인</li>
                    <li>판매자와의 채팅</li>
                    <li>작업 진행 및 완료</li>
                  </>
                )}
              </Typography>
            </Alert>

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Person />}
                onClick={handleGoToProfile}
                sx={{ minWidth: 150 }}
              >
                프로필 확인
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleLogout}
                sx={{ minWidth: 150 }}
              >
                로그아웃
              </Button>
            </Box>

            {/* 추가 안내 */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                승인 과정에 대해 궁금한 점이 있으시면 관리자에게 문의해주세요.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PendingApprovalPage;
