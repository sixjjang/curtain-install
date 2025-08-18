import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import { 
  Storage, 
  CheckCircle, 
  Error, 
  Info, 
  Warning,
  Link as LinkIcon
} from '@mui/icons-material';

const FirebaseStorageGuide: React.FC = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Storage 설정 가이드
      </Typography>
      
             <Alert severity="error" sx={{ mb: 3 }}>
         <Typography variant="body1">
           <strong>🚨 Firebase Storage CORS 오류가 지속적으로 발생하고 있습니다.</strong><br />
           이는 Firebase Storage가 제대로 설정되지 않았거나 CORS 설정에 문제가 있을 때 발생합니다.<br />
           <strong>해결책:</strong> 이미지 없이 회원가입을 진행하거나, Firebase Console에서 Storage 설정을 확인하세요.
         </Typography>
       </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 Firebase Storage 설정 방법
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Info color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="1. Firebase Console에서 Storage 활성화"
                secondary="Firebase Console → Storage → '시작하기' 클릭"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Info color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="2. Storage 규칙 설정"
                secondary="Firebase Console → Storage → Rules 탭에서 규칙 확인"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Info color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="3. CORS 설정 확인"
                secondary="Firebase Console → Storage → Settings에서 CORS 설정 확인"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 현재 상황
          </Typography>
          
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>CORS 오류:</strong> Firebase Storage에 접근할 수 없습니다.
            </Typography>
          </Alert>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>임시 해결책:</strong> 이미지 없이 회원가입이 가능합니다.
            </Typography>
          </Alert>
          
          <Alert severity="success">
            <Typography variant="body2">
              <strong>회원가입:</strong> 이미지 업로드 실패 시에도 회원가입은 정상적으로 진행됩니다.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🛠️ 해결 방법
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="방법 1: Firebase Console에서 Storage 활성화"
                secondary="Firebase Console에서 Storage 서비스를 활성화하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="방법 2: Storage 규칙 수정"
                secondary="Storage 규칙을 임시로 모든 사용자에게 권한을 부여하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="방법 3: 이미지 없이 회원가입"
                secondary="현재 이미지 없이도 회원가입이 가능합니다."
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔗 유용한 링크
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <LinkIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Firebase Console"
                secondary="https://console.firebase.google.com"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <LinkIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Firebase Storage 문서"
                secondary="https://firebase.google.com/docs/storage"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <LinkIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="CORS 설정 가이드"
                secondary="https://firebase.google.com/docs/storage/web/download-files#cors_configuration"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/register'}
          startIcon={<Storage />}
        >
          회원가입 시도 (이미지 없이)
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/storage-test'}
          startIcon={<CheckCircle />}
        >
          Storage 연결 테스트
        </Button>
      </Box>
    </Box>
  );
};

export default FirebaseStorageGuide;
