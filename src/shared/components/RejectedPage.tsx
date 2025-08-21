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
  Block,
  Person,
  Error,
  ArrowBack,
  ContactSupport
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const RejectedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              <Block sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                승인 거부됨
              </Typography>
              <Typography variant="h6" color="textSecondary">
                서류 검토 결과 승인이 거부되었습니다
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
                <Error sx={{ mr: 1, verticalAlign: 'middle' }} />
                승인 상태
              </Typography>
              <Chip
                icon={<Block />}
                label="승인 거부됨"
                color="error"
                variant="outlined"
                sx={{ fontSize: '1rem', py: 1 }}
              />
              {user.rejectionReason && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1, textAlign: 'left' }}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    거부 사유:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.rejectionReason}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* 안내 메시지 */}
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>현재 상황:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
                <li>서비스 이용이 제한됩니다</li>
                <li>프로필 정보만 확인 가능합니다</li>
                <li>재신청을 통해 승인을 다시 받을 수 있습니다</li>
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>다음 단계:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
                <li>거부 사유를 확인하고 문제를 해결하세요</li>
                <li>필요한 경우 추가 서류를 준비하세요</li>
                <li>관리자에게 문의하거나 재신청을 진행하세요</li>
              </Typography>
            </Alert>

            {/* 액션 버튼 */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<ContactSupport />}
                onClick={() => {
                  // 관리자 문의 페이지로 이동하거나 이메일 클라이언트 열기
                  window.open('mailto:admin@example.com?subject=승인 거부 문의', '_blank');
                }}
                sx={{ minWidth: 150 }}
              >
                관리자 문의
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
                승인 거부에 대한 자세한 설명이나 재신청 방법에 대해 궁금한 점이 있으시면 관리자에게 문의해주세요.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default RejectedPage;
