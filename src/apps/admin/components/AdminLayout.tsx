import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Analytics as AnalyticsIcon,
  AdminPanelSettings as AdminIcon,
  ExitToApp as LogoutIcon,
  AttachMoney as PricingIcon,
  Star as LevelIcon,
  RateReview as SurveyIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Article as TemplateIcon,
  AccountBalanceWallet as WithdrawalIcon,
  Campaign as AdvertisementIcon,
  Forum as ForumIcon,
  Announcement as NoticeIcon,
  Chat as ChatIcon,
  Feedback as SuggestionIcon,
  AccountBalance
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { AdminNotificationData } from '../../../shared/services/adminNotificationService';

const drawerWidth = { xs: 280, sm: 240 };

interface AdminLayoutProps {
  children: React.ReactNode;
  notifications?: AdminNotificationData;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, notifications }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/admin' },
    { text: '사용자 관리', icon: <PeopleIcon />, path: '/admin/users' },
    { text: '작업 관리', icon: <WorkIcon />, path: '/admin/jobs' },
    { text: '포인트 관리', icon: <AccountBalance />, path: '/admin/points' },
    { text: '시공단가 관리', icon: <PricingIcon />, path: '/admin/pricing' },
    { text: '레벨 관리', icon: <LevelIcon />, path: '/admin/levels' },
    { text: '만족도 조사 관리', icon: <SurveyIcon />, path: '/admin/surveys' },
    { text: '템플릿 관리', icon: <TemplateIcon />, path: '/admin/templates' },
    { 
      text: '포인트 인출 관리', 
      icon: <WithdrawalIcon />, 
      path: '/admin/point-withdrawals',
      badge: notifications?.pointWithdrawals || 0
    },
    { 
      text: '수동 계좌이체 관리', 
      icon: <AccountBalance />, 
      path: '/admin/manual-charges',
      badge: notifications?.manualChargeRequests || 0
    },
    { text: '광고 관리', icon: <AdvertisementIcon />, path: '/admin/advertisements' },
    { text: '분석', icon: <AnalyticsIcon />, path: '/admin/analytics' },
    { text: '시스템 설정', icon: <SettingsIcon />, path: '/admin/settings' },
  ];

  const boardMenuItems = [
    { text: '공지사항 관리', icon: <NoticeIcon />, path: '/admin/notices' },
    { text: '관리자 채팅', icon: <ChatIcon />, path: '/admin/admin-chat' },
    { text: '건의사항 관리', icon: <SuggestionIcon />, path: '/admin/suggestions' },
  ];

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

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : '관리자 대시보드';
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          관리자 대시보드
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false); // 모바일에서 메뉴 클릭 시 드로어 닫기
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 'medium' : 'normal'
                  }
                }}
              />
              {(item as any).badge > 0 && (
                <Chip
                  label={(item as any).badge}
                  color="error"
                  size="small"
                  sx={{
                    minWidth: 20,
                    height: 20,
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {/* 게시판 메뉴 */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="primary" fontWeight="bold">
          게시판 관리
        </Typography>
      </Box>
      <List>
        {boardMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'primary.main' : 'inherit',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 'medium' : 'normal'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth.sm}px)` },
          ml: { sm: `${drawerWidth.sm}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
            {getCurrentPageTitle()}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="inherit" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.email}
            </Typography>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AdminIcon />
              </Avatar>
            </IconButton>
          </Box>
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
              borderRight: '1px solid rgba(0, 0, 0, 0.12)'
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
              borderRight: '1px solid rgba(0, 0, 0, 0.12)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth.sm}px)` },
          mt: 8,
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
