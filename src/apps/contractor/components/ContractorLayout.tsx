import React, { useState, useEffect } from 'react';
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
  Badge,
  Chip,
  Divider,
  Alert,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  Assignment,
  Chat,
  AccountBalance,
  Person,
  Notifications as NotificationsIcon,
  Logout,
  Warning,
  Block,
  Brightness4,
  Brightness7,
  Forum as ForumIcon,
  Announcement as NoticeIcon,
  Feedback as SuggestionIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../../shared/contexts/ThemeContext';
import { ContractorInfo } from '../../../types';

const drawerWidth = { xs: 280, sm: 240 };

interface ContractorLayoutProps {
  children: React.ReactNode;
}

const ContractorLayout: React.FC<ContractorLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [boardMenuExpanded, setBoardMenuExpanded] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useCustomTheme();

  // user가 null일 수 있으므로 안전하게 접근
  const contractor = user?.contractor;

  const menuItems = [
    { text: '대시보드', icon: <Dashboard />, path: '/contractor' },
    { text: '시공건 찾기', icon: <Work />, path: '/contractor/jobs' },
    { text: '내 시공건', icon: <Assignment />, path: '/contractor/my-jobs' },
    { text: '판매자와 채팅', icon: <Chat />, path: '/contractor/seller-chat' },
    { text: '포인트 관리', icon: <AccountBalance />, path: '/contractor/points' },
    { text: '프로필', icon: <Person />, path: '/contractor/profile' },
  ];

  const boardMenuItems = [
    { text: '공지사항', icon: <NoticeIcon />, path: '/contractor/notices' },
    { text: '관리자와 채팅', icon: <Chat />, path: '/contractor/admin-chat' },
    { text: '건의하기', icon: <SuggestionIcon />, path: '/contractor/suggestions' },
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

  const drawer = (
    <Box>
             <Box sx={{ p: 2, textAlign: 'center' }}>
         <Typography variant="h6" color="primary">
           {user?.name || '시공자'}님의 공간
         </Typography>
                   <Typography variant="caption" color="textSecondary">
            {contractor?.businessName || '개인시공자'}
          </Typography>
        {contractor && (
          <Box sx={{ mt: 2 }}>
            <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }}>
              {contractor.name.charAt(0)}
            </Avatar>
            <Typography variant="subtitle1">{contractor.name}</Typography>
            <Chip 
              label={`Lv. ${contractor.level || 1}`}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                // 승인 대기 상태에서는 프로필 페이지만 접근 가능
                if (user?.approvalStatus === 'pending' && item.path !== '/contractor/profile') {
                  alert('승인 대기 중입니다. 승인 완료 후 이용 가능한 기능입니다.');
                  return;
                }
                // 승인 거부 상태에서는 프로필 페이지만 접근 가능
                if (user?.approvalStatus === 'rejected' && item.path !== '/contractor/profile') {
                  alert('승인이 거부되었습니다. 관리자에게 문의해주세요.');
                  return;
                }
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
                onClick={() => {
                  console.log('🔍 ContractorLayout - 게시판 메뉴 클릭:', item.text, item.path);
                  console.log('🔍 ContractorLayout - 사용자 승인 상태:', user?.approvalStatus);
                  
                  // 승인 대기 상태에서는 공지사항만 접근 가능
                  if (user?.approvalStatus === 'pending' && item.path !== '/contractor/notices') {
                    alert('승인 대기 중입니다. 승인 완료 후 이용 가능한 기능입니다.');
                    return;
                  }
                  // 승인 거부 상태에서는 공지사항만 접근 가능
                  if (user?.approvalStatus === 'rejected' && item.path !== '/contractor/notices') {
                    alert('승인이 거부되었습니다. 관리자에게 문의해주세요.');
                    return;
                  }
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  pl: 4,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
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
            {(() => {
              // 현재 경로에 따라 제목 결정
              if (location.pathname === '/contractor' || location.pathname === '/contractor/') {
                return contractor?.businessName ? `${contractor.businessName} 대시보드` : '전문가의 손길';
              }
              if (location.pathname === '/contractor/jobs') {
                return '시공건 찾기';
              }
              if (location.pathname.startsWith('/contractor/jobs/') && location.pathname !== '/contractor/jobs') {
                return '시공건 상세';
              }
              if (location.pathname === '/contractor/my-jobs') {
                return '내 시공건';
              }
              if (location.pathname === '/contractor/chat') {
                return '고객과 채팅';
              }
              if (location.pathname === '/contractor/seller-chat') {
                return '판매자와 채팅';
              }
              if (location.pathname.startsWith('/contractor/chat/')) {
                return '고객과 채팅';
              }
              if (location.pathname === '/contractor/points') {
                return '포인트 관리';
              }
              if (location.pathname === '/contractor/profile') {
                return '프로필';
              }
              // 게시판 메뉴들
              if (location.pathname === '/contractor/notices') {
                return '공지사항';
              }
              if (location.pathname === '/contractor/admin-chat') {
                return '관리자와 채팅';
              }
              if (location.pathname === '/contractor/suggestions') {
                return '건의하기';
              }
              // 기본값
              return contractor?.businessName ? `${contractor.businessName} 대시보드` : '전문가의 손길';
            })()}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 테마 토글 버튼 */}
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              aria-label="테마 변경"
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
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
                navigate('/contractor/notifications');
              }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: user?.profileImage ? 'transparent' : 'primary.main'
                }}
                src={user?.profileImage || undefined}
              >
                {contractor?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
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
             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth.xs },
           }}
         >
           {drawer}
         </Drawer>
         <Drawer
           variant="permanent"
           sx={{
             display: { xs: 'none', sm: 'block' },
             '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth.sm },
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
      >
        <MenuItem onClick={() => navigate('/contractor/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          프로필
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
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
         }}
       >
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
    </Box>
  );
};

export default ContractorLayout;
