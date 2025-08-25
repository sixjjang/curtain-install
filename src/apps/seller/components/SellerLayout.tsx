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
  Chip,
  Collapse
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
  Chat,
  Brightness4,
  Brightness7,
  Forum as ForumIcon,
  Announcement as NoticeIcon,
  Feedback as SuggestionIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../../shared/contexts/ThemeContext';
import { NotificationService } from '../../../shared/services/notificationService';
import { PointService } from '../../../shared/services/pointService';
import AdvertisementBanner from '../../../shared/components/AdvertisementBanner';

const drawerWidth = { xs: 280, sm: 240 };

interface SellerLayoutProps {
  children: React.ReactNode;
}

const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pointBalance, setPointBalance] = useState(0);
  const [boardMenuExpanded, setBoardMenuExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useCustomTheme();

  const menuItems = [
    { text: '대시보드', icon: <Dashboard />, path: '/seller' },
    { text: '시공 작업 관리', icon: <Work />, path: '/seller/jobs' },
    { text: '시공자와 채팅', icon: <Chat />, path: '/seller/contractor-chat' },
    { text: '포인트 관리', icon: <AccountBalance />, path: '/seller/points' },
    { text: '프로필', icon: <Person />, path: '/seller/profile' },
  ];

  const boardMenuItems = [
    { text: '공지사항', icon: <NoticeIcon />, path: '/seller/notices' },
    { text: '관리자와 채팅', icon: <Chat />, path: '/seller/admin-chat' },
    { text: '건의하기', icon: <SuggestionIcon />, path: '/seller/suggestions' },
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

  // 포인트 잔액 조회
  useEffect(() => {
    const loadPointBalance = async () => {
      if (user?.id) {
        try {
          const balance = await PointService.getPointBalance(user.id, 'seller');
          setPointBalance(balance);
        } catch (error) {
          console.error('포인트 잔액 조회 실패:', error);
          setPointBalance(0);
        }
      }
    };

    loadPointBalance();
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ minHeight: 'auto', p: 0, overflow: 'hidden' }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ 
            textAlign: 'center',
            position: 'relative',
            background: user?.profileImage 
              ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${user.profileImage})`
              : 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: '100%',
            p: 1.5,
            m: 0
          }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                mb: 0.5
              }}
            >
              {user?.name || '판매자'}님의 공간
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 0.2,
                color: 'white',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              잔여 : {pointBalance.toLocaleString()} p
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                mt: 0.2, 
                fontWeight: 'medium',
                color: '#90caf9',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}
            >
              {user?.companyName || '상호명'}
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
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
      
      {/* 게시판 메뉴 */}
      <Divider />
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => setBoardMenuExpanded(!boardMenuExpanded)}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ForumIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              게시판
            </Typography>
          </Box>
          {boardMenuExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>
      <Collapse in={boardMenuExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {boardMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  console.log('🔍 게시판 메뉴 클릭:', item.text, '경로:', item.path);
                  console.log('🔍 현재 사용자 승인 상태:', user?.approvalStatus);
                  
                  // 승인 대기 상태에서는 공지사항만 접근 가능
                  if (user?.approvalStatus === 'pending' && item.path !== '/seller/notices') {
                    alert('승인 대기 중입니다. 승인 완료 후 이용 가능한 기능입니다.');
                    return;
                  }
                  // 승인 거부 상태에서는 공지사항만 접근 가능
                  if (user?.approvalStatus === 'rejected' && item.path !== '/seller/notices') {
                    alert('승인이 거부되었습니다. 관리자에게 문의해주세요.');
                    return;
                  }
                  console.log('🔍 게시판 네비게이션 실행:', item.path);
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{ pl: 4 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
      
      {/* 사이드바 광고 영역 */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        <AdvertisementBanner 
          position="sidebar" 
          maxCount={3} 
          height={120}
          showTitle={false}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth.sm}px)` },
          ml: { sm: `${drawerWidth.sm}px` },
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
            {menuItems.find(item => location.pathname.startsWith(item.path))?.text || 
             (user?.seller?.companyName ? `${user.seller.companyName} 대시보드` : '판매자 대시보드')}
          </Typography>
          
          {/* 테마 토글 버튼 */}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 1 }}
            aria-label="테마 변경"
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
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
        sx={{ width: { sm: drawerWidth.sm }, flexShrink: { sm: 0 } }}
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth.xs,
              padding: 0,
              margin: 0
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth.sm,
              padding: 0,
              margin: 0
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, width: { sm: `calc(100% - ${drawerWidth.sm}px)` } }}
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
