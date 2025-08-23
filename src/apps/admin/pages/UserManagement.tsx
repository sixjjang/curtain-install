import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Block,
  CheckCircle,
  Person,
  Business,
  Engineering,
  Check,
  Close,
  Warning,
  Delete
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { User, UserRole, ContractorInfo, ApprovalStatus } from '../../../types';
import { migratePhoneNumbers } from '../../../shared/utils/phoneMigration';

interface UserWithStatus extends Omit<User, 'createdAt'> {
  isActive: boolean;
  createdAt?: Timestamp | Date;
  companyName?: string; // 판매자 상호명
  businessName?: string; // 시공자 상호명
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithStatus | null>(null);
  const [migrating, setMigrating] = useState(false);

  // 사용자 데이터 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
             const usersData: UserWithStatus[] = querySnapshot.docs.map(doc => {
         const data = doc.data();
         return {
           ...data,
           id: doc.id,
           isActive: data.isActive !== false, // 기본값은 활성
           createdAt: data.createdAt || null
         } as UserWithStatus;
       });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = users;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
    }

    // 역할 필터링
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    // 승인 상태 필터링
    if (approvalFilter !== 'all') {
      filtered = filtered.filter(user => user.approvalStatus === approvalFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter, approvalFilter]);

  // 사용자 상태 변경
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      setUpdateLoading(true);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isActive });
      
      // 로컬 상태 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
      
      // 선택된 사용자 정보도 업데이트
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, isActive } : null);
      }
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // 승인 처리
  const handleApproval = async (userId: string, approvalStatus: ApprovalStatus, rejectionReason?: string) => {
    try {
      setUpdateLoading(true);
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        approvalStatus,
        updatedAt: new Date()
      };

      if (approvalStatus === 'approved') {
        updateData.approvalDate = new Date();
        updateData.approvedBy = 'admin'; // 실제로는 현재 관리자 ID
      } else if (approvalStatus === 'rejected') {
        updateData.rejectionReason = rejectionReason || '';
      }

      await updateDoc(userRef, updateData);
      
      // 로컬 상태 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updateData } : user
      ));
      
      // 선택된 사용자 정보도 업데이트
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, ...updateData } : null);
      }

      setRejectionDialogOpen(false);
      setRejectionReason('');
    } catch (error) {
      console.error('승인 처리 실패:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setUpdateLoading(true);
      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);
      
      // 로컬 상태에서 사용자 제거
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      
      // 선택된 사용자가 삭제된 사용자인 경우 다이얼로그 닫기
      if (selectedUser?.id === userToDelete.id) {
        setDetailDialogOpen(false);
        setSelectedUser(null);
      }
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('사용자 삭제 실패:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // 전화번호 마이그레이션
  const handlePhoneMigration = async () => {
    try {
      setMigrating(true);
      const result = await migratePhoneNumbers();
      alert(`마이그레이션 완료: ${result.updatedCount}개 업데이트, ${result.errorCount}개 오류`);
      // 사용자 목록 새로고침
      loadUsers();
    } catch (error) {
      console.error('전화번호 마이그레이션 실패:', error);
      alert('마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setMigrating(false);
    }
  };

  // 통계 계산
  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    const sellers = users.filter(user => user.role === 'seller');
    const contractors = users.filter(user => user.role === 'contractor');
    const customers = users.filter(user => user.role === 'customer');
    
    const pendingUsers = users.filter(user => user.approvalStatus === 'pending').length;
    const approvedUsers = users.filter(user => user.approvalStatus === 'approved').length;
    const rejectedUsers = users.filter(user => user.approvalStatus === 'rejected').length;
    
    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      sellers: sellers.length,
      contractors: contractors.length,
      customers: customers.length,
      activeSellers: sellers.filter(user => user.isActive).length,
      activeContractors: contractors.filter(user => user.isActive).length,
      pendingUsers,
      approvedUsers,
      rejectedUsers
    };
  };

  const stats = getStats();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'seller': return <Business />;
      case 'contractor': return <Engineering />;
      case 'customer': return <Person />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'seller': return 'primary';
      case 'contractor': return 'secondary';
      case 'customer': return 'default';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'seller': return '판매자';
      case 'contractor': return '시공자';
      case 'customer': return '고객';
      default: return '사용자';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                전체 사용자
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.total}명
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={`활성: ${stats.active}명`} color="success" size="small" sx={{ mr: 1 }} />
                <Chip label={`비활성: ${stats.inactive}명`} color="error" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                승인 대기
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pendingUsers}명
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label="검토 필요" color="warning" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                승인 완료
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.approvedUsers}명
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label="활성 사용자" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                판매자
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.sellers}명
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={`활성: ${stats.activeSellers}명`} color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                시공자
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.contractors}명
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={`활성: ${stats.activeContractors}명`} color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                고객
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.customers}명
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                placeholder="이름, 이메일, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>역할</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="역할"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="seller">판매자</MenuItem>
                  <MenuItem value="contractor">시공자</MenuItem>
                  <MenuItem value="customer">고객</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>승인 상태</InputLabel>
                <Select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value)}
                  label="승인 상태"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="pending">승인 대기 ({stats.pendingUsers}명)</MenuItem>
                  <MenuItem value="approved">승인 완료</MenuItem>
                  <MenuItem value="rejected">승인 거부</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>활성 상태</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="활성 상태"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="active">활성</MenuItem>
                  <MenuItem value="inactive">비활성</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5.5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Warning />}
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setApprovalFilter('pending');
                  }}
                  sx={{ flex: 1 }}
                >
                  승인대기
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setApprovalFilter('all');
                  }}
                >
                  초기화
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={handlePhoneMigration}
                  disabled={migrating}
                  startIcon={migrating ? <CircularProgress size={16} /> : <Warning />}
                >
                  {migrating ? '마이그레이션 중...' : '전화번호 포맷팅'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 사용자 목록 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            사용자 목록 ({filteredUsers.length}명)
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>사용자</TableCell>
                  <TableCell>역할</TableCell>
                  <TableCell>상호명</TableCell>
                  <TableCell>연락처</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>승인 상태</TableCell>
                  <TableCell>활성 상태</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{
                      backgroundColor: user.approvalStatus === 'pending' ? 
                        (theme) => theme.palette.mode === 'light' ? '#fff3e0' : '#2d2b1b' : 'inherit',
                      '&:hover': {
                        backgroundColor: user.approvalStatus === 'pending' ? 
                          (theme) => theme.palette.mode === 'light' ? '#ffe0b2' : '#3d2b1b' : 
                          (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                      }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                          {user.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{user.name}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.role === 'seller' && user.companyName ? user.companyName : 
                       user.role === 'contractor' && user.businessName ? user.businessName : 
                       '-'}
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                                         <TableCell>
                       {user.createdAt 
                         ? (user.createdAt instanceof Timestamp 
                             ? user.createdAt.toDate().toLocaleDateString('ko-KR')
                             : user.createdAt instanceof Date 
                             ? user.createdAt.toLocaleDateString('ko-KR')
                             : '날짜 없음')
                         : '날짜 없음'
                       }
                     </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          label={
                            user.approvalStatus === 'pending' ? '승인 대기' :
                            user.approvalStatus === 'approved' ? '승인 완료' :
                            user.approvalStatus === 'rejected' ? '승인 거부' : '알 수 없음'
                          }
                          color={
                            user.approvalStatus === 'pending' ? 'warning' :
                            user.approvalStatus === 'approved' ? 'success' :
                            user.approvalStatus === 'rejected' ? 'error' : 'default'
                          }
                          size="small"
                          sx={{ mb: 0.5 }}
                        />
                        {user.approvalStatus === 'pending' && (
                          <Typography variant="caption" color="warning.main" display="block">
                            검토 필요
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? '활성' : '비활성'}
                        color={user.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {/* 승인 대기 중인 사용자만 승인/거부 버튼 표시 */}
                        {user.approvalStatus === 'pending' && (
                          <>
                            <Tooltip title="승인">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApproval(user.id, 'approved')}
                                disabled={updateLoading}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="거부">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRejectionDialogOpen(true);
                                }}
                                disabled={updateLoading}
                              >
                                <Close />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip title={user.isActive ? '비활성화' : '활성화'}>
                          <IconButton
                            size="small"
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => handleStatusChange(user.id, !user.isActive)}
                            disabled={updateLoading}
                          >
                            {user.isActive ? <Block /> : <CheckCircle />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="사용자 삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={updateLoading}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 사용자 상세 정보 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          사용자 상세 정보
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">이름</Typography>
                <Typography variant="body1">{selectedUser.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">이메일</Typography>
                <Typography variant="body1">{selectedUser.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">전화번호</Typography>
                <Typography variant="body1">{selectedUser.phone}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">역할</Typography>
                <Chip
                  icon={getRoleIcon(selectedUser.role)}
                  label={getRoleLabel(selectedUser.role)}
                  color={getRoleColor(selectedUser.role)}
                />
              </Grid>
                             <Grid item xs={12} md={6}>
                 <Typography variant="subtitle2" color="textSecondary">가입일</Typography>
                 <Typography variant="body1">
                   {selectedUser.createdAt 
                     ? (selectedUser.createdAt instanceof Timestamp 
                         ? selectedUser.createdAt.toDate().toLocaleDateString('ko-KR')
                         : selectedUser.createdAt instanceof Date 
                         ? selectedUser.createdAt.toLocaleDateString('ko-KR')
                         : '날짜 없음')
                     : '날짜 없음'
                   }
                 </Typography>
               </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">승인 상태</Typography>
                <Chip
                  label={
                    selectedUser.approvalStatus === 'pending' ? '승인 대기' :
                    selectedUser.approvalStatus === 'approved' ? '승인 완료' :
                    selectedUser.approvalStatus === 'rejected' ? '승인 거부' : '알 수 없음'
                  }
                  color={
                    selectedUser.approvalStatus === 'pending' ? 'warning' :
                    selectedUser.approvalStatus === 'approved' ? 'success' :
                    selectedUser.approvalStatus === 'rejected' ? 'error' : 'default'
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">활성 상태</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedUser.isActive}
                      onChange={(e) => handleStatusChange(selectedUser.id, e.target.checked)}
                      disabled={updateLoading}
                    />
                  }
                  label={selectedUser.isActive ? '활성' : '비활성'}
                />
              </Grid>
              
              {/* 승인 대기 중인 사용자만 승인/거부 버튼 표시 */}
              {selectedUser.approvalStatus === 'pending' && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      onClick={() => handleApproval(selectedUser.id, 'approved')}
                      disabled={updateLoading}
                    >
                      승인
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Close />}
                      onClick={() => setRejectionDialogOpen(true)}
                      disabled={updateLoading}
                    >
                      거부
                    </Button>
                  </Box>
                </Grid>
              )}
              
              {/* 거부 사유 표시 */}
              {selectedUser.approvalStatus === 'rejected' && selectedUser.rejectionReason && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">거부 사유</Typography>
                  <Typography variant="body1" color="error.main">
                    {selectedUser.rejectionReason}
                  </Typography>
                </Grid>
              )}
              
                             {/* 시공자 전용 정보 */}
              {selectedUser.role === 'contractor' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                      시공자 상세 정보
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">상호명</Typography>
                    <Typography variant="body1">{selectedUser.businessName || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">레벨</Typography>
                    <Typography variant="body1">Lv. {selectedUser.contractor?.level || 1}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">총 시공 건수</Typography>
                    <Typography variant="body1">{selectedUser.contractor?.completedJobs || 0}건</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">평균 평점</Typography>
                    <Typography variant="body1">{Number(selectedUser.contractor?.rating || 0).toFixed(1)}/5.0</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">시공 가능지역</Typography>
                    <Typography variant="body1">
                      {selectedUser.contractor?.serviceAreas?.length || 0}개 지역
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">경력</Typography>
                    <Typography variant="body1">{selectedUser.contractor?.experience || '경력 정보 없음'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">은행명</Typography>
                    <Typography variant="body1">{selectedUser.contractor?.bankName || '미입력'}</Typography>
                  </Grid>
                                     <Grid item xs={12} md={6}>
                     <Typography variant="subtitle2" color="textSecondary">계좌번호</Typography>
                     <Typography variant="body1">{selectedUser.contractor?.bankAccount || '미입력'}</Typography>
                   </Grid>
                                     <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">예금주</Typography>
                    <Typography variant="body1">{selectedUser.contractor?.accountHolder || '미입력'}</Typography>
                  </Grid>
                  
                  {/* 시공자 사업 정보 */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                      사업 정보
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">사업자등록번호</Typography>
                    <Typography variant="body1">{selectedUser.businessNumber || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">사업장주소</Typography>
                    <Typography variant="body1">{selectedUser.businessAddress || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">업태</Typography>
                    <Typography variant="body1">{selectedUser.businessType || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">종목</Typography>
                    <Typography variant="body1">{selectedUser.businessCategory || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">활성 상태</Typography>
                    <Typography variant="body1">
                      {selectedUser.isActive ? '활성' : '비활성'}
                    </Typography>
                  </Grid>
                  
                                     {/* 시공자 서류 확인 */}
                   <Grid item xs={12}>
                     <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                       서류 확인
                     </Typography>
                   </Grid>
                   <Grid item xs={12} md={6}>
                     <Typography variant="subtitle2" color="textSecondary">프로필 이미지</Typography>
                     {selectedUser.profileImage ? (
                       <Box sx={{ mt: 1 }}>
                         <img 
                           src={selectedUser.profileImage} 
                           alt="프로필 이미지" 
                           style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                         />
                       </Box>
                     ) : (
                       <Typography variant="body2" color="textSecondary">프로필 이미지 없음</Typography>
                     )}
                   </Grid>
                   <Grid item xs={12} md={6}>
                     <Typography variant="subtitle2" color="textSecondary">본인 반명함판 사진</Typography>
                     {selectedUser.contractor?.idCardImage ? (
                       <Box sx={{ mt: 1 }}>
                         <img 
                           src={selectedUser.contractor.idCardImage} 
                           alt="본인 반명함판 사진" 
                           style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                         />
                         <Button 
                           variant="outlined" 
                           size="small" 
                           sx={{ mt: 1 }}
                           onClick={() => window.open(selectedUser.contractor?.idCardImage, '_blank')}
                         >
                           새 창에서 보기
                         </Button>
                       </Box>
                     ) : (
                       <Typography variant="body2" color="error.main">본인 반명함판 사진 미첨부</Typography>
                     )}
                   </Grid>
                   <Grid item xs={12} md={6}>
                     <Typography variant="subtitle2" color="textSecondary">사업자등록증</Typography>
                     {selectedUser.businessLicenseImage ? (
                       <Box sx={{ mt: 1 }}>
                         <img 
                           src={selectedUser.businessLicenseImage} 
                           alt="사업자등록증" 
                           style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                         />
                         <Button 
                           variant="outlined" 
                           size="small" 
                           sx={{ mt: 1 }}
                           onClick={() => window.open(selectedUser.businessLicenseImage, '_blank')}
                         >
                           새 창에서 보기
                         </Button>
                       </Box>
                     ) : (
                       <Typography variant="body2" color="textSecondary">사업자등록증 미첨부 (선택사항)</Typography>
                     )}
                   </Grid>
                  
                  {/* 시공 가능 지역 상세 */}
                  {selectedUser.contractor?.serviceAreas && selectedUser.contractor.serviceAreas.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="textSecondary">시공 가능 지역 상세</Typography>
                      <Box sx={{ mt: 1 }}>
                        {selectedUser.contractor.serviceAreas.map((area: string, index: number) => (
                          <Chip key={index} label={area} size="small" sx={{ mr: 1, mb: 1 }} />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </>
              )}

              {/* 판매자 전용 정보 */}
              {selectedUser.role === 'seller' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                      판매자 상세 정보
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">회사명</Typography>
                    <Typography variant="body1">{(selectedUser as any).companyName || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">사업자등록번호</Typography>
                    <Typography variant="body1">{(selectedUser as any).businessNumber || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">사업장 주소</Typography>
                    <Typography variant="body1">{(selectedUser as any).businessAddress || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">업종</Typography>
                    <Typography variant="body1">{(selectedUser as any).businessType || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">업태</Typography>
                    <Typography variant="body1">{(selectedUser as any).businessCategory || '미입력'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">총 매출</Typography>
                    <Typography variant="body1">{(selectedUser as any).totalSales || 0}원</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">평점</Typography>
                    <Typography variant="body1">{Number((selectedUser as any).rating || 0).toFixed(1)}/5.0</Typography>
                  </Grid>
                  
                  {/* 판매자 서류 확인 */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                      서류 확인
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">사업자등록증</Typography>
                    {(selectedUser as any).businessLicenseImage ? (
                      <Box sx={{ mt: 1 }}>
                        <img 
                          src={(selectedUser as any).businessLicenseImage} 
                          alt="사업자등록증" 
                          style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                          onClick={() => window.open((selectedUser as any).businessLicenseImage, '_blank')}
                        >
                          새 창에서 보기
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="error.main">사업자등록증 미첨부</Typography>
                    )}
                  </Grid>
                  
                  {/* 픽업 정보 */}
                  {(selectedUser as any).pickupInfo && (
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                        픽업 정보
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="textSecondary">픽업 회사명</Typography>
                          <Typography variant="body1">{(selectedUser as any).pickupInfo.companyName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="textSecondary">픽업 연락처</Typography>
                          <Typography variant="body1">{(selectedUser as any).pickupInfo.phone}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="textSecondary">픽업 주소</Typography>
                          <Typography variant="body1">{(selectedUser as any).pickupInfo.address}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 거부 사유 입력 다이얼로그 */}
      <Dialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          회원가입 거부
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedUser?.name}님의 회원가입을 거부하시겠습니까?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="거부 사유"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="거부 사유를 입력해주세요..."
            helperText="거부 사유는 사용자에게 전달됩니다."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (selectedUser) {
                handleApproval(selectedUser.id, 'rejected', rejectionReason);
              }
            }}
            disabled={!rejectionReason.trim() || updateLoading}
          >
            거부
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          사용자 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>{userToDelete?.name}</strong>님을 완전히 삭제하시겠습니까?
            </Typography>
            <Typography variant="body2">
              이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 영구적으로 삭제됩니다.
            </Typography>
          </Alert>
          <Typography variant="body2" color="textSecondary">
            삭제될 데이터:
          </Typography>
          <ul>
            <li>사용자 계정 정보</li>
            <li>프로필 데이터</li>
            <li>관련된 모든 기록</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={updateLoading}
            startIcon={<Delete />}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
