import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  People,
  AccountBalance,
  Person,
  Notifications as NotificationsIcon,
  Logout,
  Warning,
  Block,
  Chat
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { NotificationService } from '../../../shared/services/notificationService';

const drawerWidth = 240;

interface SellerLayoutProps {
  children: React.ReactNode;
}

const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: '대시보드', icon: <Dashboard />, path: '/seller' },
    { text: '시공 작업 관리', icon: <Work />, path: '/seller/jobs' },
    { text: '시공자 목록', icon: <People />, path: '/seller/contractors' },
    { text: '시공자와 채팅', icon: <Chat />, path: '/seller/contractor-chat' },
    { text: '포인트 충전', icon: <AccountBalance />, path: '/seller/points' },
    { text: '프로필', icon: <Person />, path: '/seller/profile' },
  ];

  // 디버깅용: 현재 경로와 메뉴 클릭 로그
  console.log('🔍 SellerLayout - 현재 경로:', location.pathname);
  console.log('🔍 SellerLayout - 메뉴 아이템들:', menuItems);

  // 알림 구독
  useEffect(() => {
    if (user?.id) {
      const unsubscribe = NotificationService.subscribeToUnreadCount(user.id, setUnreadCount);
      return unsubscribe;
    }
  }, [user?.id]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box>
          <Typography variant="h6" noWrap component="div">
            {user?.seller?.companyName || '판매자 대시보드'}
          </Typography>
          {user?.seller?.companyName && (
            <Typography variant="caption" color="textSecondary" noWrap>
              판매자 대시보드
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                console.log('🔍 메뉴 클릭:', item.text, '경로:', item.path);
                console.log('🔍 현재 사용자 승인 상태:', user?.approvalStatus);
                
                // 승인 대기 상태에서는 프로필 페이지만 접근 가능
                if (user?.approvalStatus === 'pending' && item.path !== '/seller/profile') {
                  alert('승인 대기 중입니다. 승인 완료 후 이용 가능한 기능입니다.');
                  return;
                }
                // 승인 거부 상태에서는 프로필 페이지만 접근 가능
                if (user?.approvalStatus === 'rejected' && item.path !== '/seller/profile') {
                  alert('승인이 거부되었습니다. 관리자에게 문의해주세요.');
                  return;
                }
                console.log('🔍 네비게이션 실행:', item.path);
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || '판매자 대시보드'}
          </Typography>
          
          {/* 알림 아이콘 */}
          <IconButton
            color="inherit"
            onClick={() => {
              if (user?.approvalStatus === 'pending') {
                alert('승인 대기 중입니다. 승인 완료 후 이용 가능한 기능입니다.');
                return;
              }
              if (user?.approvalStatus === 'rejected') {
                alert('승인이 거부되었습니다. 관리자에게 문의해주세요.');
                return;
              }
              navigate('/seller/notifications');
            }}
            sx={{ mr: 2 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* 사용자 프로필 메뉴 */}
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar 
              sx={{ 
                bgcolor: user?.profileImage ? 'transparent' : 'secondary.main',
                width: 32,
                height: 32
              }}
              src={user?.profileImage || undefined}
            >
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        
        {/* 승인 상태 경고 메시지 */}
        {user?.approvalStatus === 'pending' && (
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ mb: 2 }}
            action={
              <Chip 
                label="승인 대기 중" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            }
          >
            관리자 승인을 기다리고 있습니다. 승인 완료 후 모든 기능을 이용할 수 있습니다.
          </Alert>
        )}
        
        {user?.approvalStatus === 'rejected' && (
          <Alert 
            severity="error" 
            icon={<Block />}
            sx={{ mb: 2 }}
            action={
              <Chip 
                label="승인 거부됨" 
                size="small" 
                color="error" 
                variant="outlined"
              />
            }
          >
            승인이 거부되었습니다. 관리자에게 문의하거나 재신청을 진행해주세요.
          </Alert>
        )}
        
        {children}
      </Box>
      
      {/* 프로필 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/seller/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          프로필
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SellerLayout;
