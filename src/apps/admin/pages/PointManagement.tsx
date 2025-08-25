import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Divider,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Person,
  Business,
  Engineering,
  Visibility,
  DateRange,
  FilterList,
  ExpandMore,
  Download,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { PointService } from '../../../shared/services/pointService';

interface PointTransaction {
  id: string;
  userId: string;
  userName?: string;
  userRole: string;
  type: 'charge' | 'escrow' | 'release' | 'withdraw' | 'refund' | 'compensation' | 'deduction' | 'payment';
  amount: number;
  description: string;
  createdAt: Date;
  jobId?: string;
  jobTitle?: string;
  balance?: number;
  status?: string;
  completedAt?: Date;
  adminId?: string;
  notes?: string;
  bankInfo?: any;
  relatedTransactionId?: string;
}

interface UserPointSummary {
  userId: string;
  userName: string;
  userRole: string;
  totalEarned: number;
  totalSpent: number;
  totalWithdrawn: number;
  totalCharged: number;
  currentBalance: number;
  transactionCount: number;
}

const PointManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserPointSummary[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'quarter' | 'year'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'seller' | 'contractor'>('all');
  const [selectedUser, setSelectedUser] = useState<UserPointSummary | null>(null);
  const [userDetailDialogOpen, setUserDetailDialogOpen] = useState(false);
  const [userTransactions, setUserTransactions] = useState<PointTransaction[]>([]);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 PointManagement - 데이터 로드 시작');
      
      // PointService에서 실제 데이터 가져오기
      const [transactionsData, summariesData] = await Promise.all([
        PointService.getAllPointTransactions(dateRange, userRoleFilter),
        PointService.getUserPointSummaries(dateRange, userRoleFilter)
      ]);

      // 거래 데이터 변환 (사용자 이름은 이미 PointService에서 조회됨)
      const convertedTransactions: PointTransaction[] = transactionsData.map((t: any) => ({
        id: t.id,
        userId: t.userId,
        userName: t.userName,
        userRole: t.userRole,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
        jobId: t.jobId,
        jobTitle: t.jobId ? `작업: ${t.jobId}` : undefined,
        balance: t.balance,
        status: t.status,
        completedAt: t.completedAt,
        adminId: t.adminId,
        notes: t.notes,
        bankInfo: t.bankInfo,
        relatedTransactionId: t.relatedTransactionId
      }));

      setTransactions(convertedTransactions);
      setUserSummaries(summariesData);

      console.log('🔍 PointManagement - 데이터 로드 완료');
    } catch (error) {
      console.error('포인트 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };





  // 사용자 상세 보기
  const handleViewUserDetail = (userSummary: UserPointSummary) => {
    setSelectedUser(userSummary);
    const userTransactions = transactions.filter(t => t.userId === userSummary.userId);
    setUserTransactions(userTransactions);
    setUserDetailDialogOpen(true);
  };

  // 탭 변경
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // 데이터 새로고침
  const handleRefresh = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [dateRange, userRoleFilter]);

  const filteredTransactions = transactions;
  const filteredSummaries = userSummaries;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          포인트 관리
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => alert('엑셀 다운로드 기능은 추후 구현 예정입니다.')}
          >
            엑셀 다운로드
          </Button>
        </Box>
      </Box>

      {/* 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>기간</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  label="기간"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="week">최근 1주</MenuItem>
                  <MenuItem value="month">이번 달</MenuItem>
                  <MenuItem value="quarter">이번 분기</MenuItem>
                  <MenuItem value="year">이번 년도</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>사용자 유형</InputLabel>
                <Select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  label="사용자 유형"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="seller">판매자</MenuItem>
                  <MenuItem value="contractor">시공자</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                총 {filteredTransactions.length}건의 거래, {filteredSummaries.length}명의 사용자
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 탭 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="사용자별 요약" />
          <Tab label="거래 내역" />
        </Tabs>
      </Box>

      {/* 사용자별 요약 탭 */}
      {selectedTab === 0 && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>사용자</TableCell>
                    <TableCell>유형</TableCell>
                    <TableCell align="right">총 적립</TableCell>
                    <TableCell align="right">총 사용</TableCell>
                    <TableCell align="right">총 인출</TableCell>
                    <TableCell align="right">총 충전</TableCell>
                    <TableCell align="right">현재 잔액</TableCell>
                    <TableCell align="right">거래 수</TableCell>
                    <TableCell>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSummaries.map((userSummary) => (
                    <TableRow key={userSummary.userId}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                                                     <Avatar sx={{ width: 32, height: 32 }}>
                             {userSummary.userName?.charAt(0) || '?'}
                           </Avatar>
                           <Box>
                             <Typography variant="body2" fontWeight="bold">
                               {userSummary.userName || '알 수 없음'}
                             </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {userSummary.userRole === 'seller' ? '판매자' : '시공자'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={userSummary.userRole === 'seller' ? <Business /> : <Engineering />}
                          label={userSummary.userRole === 'seller' ? '판매자' : '시공자'}
                          color={userSummary.userRole === 'seller' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="success.main" fontWeight="bold">
                          +{userSummary.totalEarned.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="error.main" fontWeight="bold">
                          -{userSummary.totalSpent.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="warning.main" fontWeight="bold">
                          -{userSummary.totalWithdrawn.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="info.main" fontWeight="bold">
                          +{userSummary.totalCharged.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="h6" 
                          color={userSummary.currentBalance >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {userSummary.currentBalance.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={userSummary.transactionCount} size="small" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="상세 보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewUserDetail(userSummary)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 거래 내역 탭 */}
      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>날짜</TableCell>
                    <TableCell>사용자</TableCell>
                    <TableCell>유형</TableCell>
                    <TableCell>내용</TableCell>
                    <TableCell align="right">금액</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.createdAt.toLocaleDateString('ko-KR')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {transaction.createdAt.toLocaleTimeString('ko-KR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                                                 <Box display="flex" alignItems="center" gap={1}>
                           <Avatar sx={{ width: 24, height: 24 }}>
                             {transaction.userName?.charAt(0) || '?'}
                           </Avatar>
                           <Box>
                             <Typography variant="body2" fontWeight="bold">
                               {transaction.userName || '알 수 없음'}
                             </Typography>
                            <Chip
                              label={transaction.userRole === 'seller' ? '판매자' : '시공자'}
                              size="small"
                              color={transaction.userRole === 'seller' ? 'primary' : 'secondary'}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                                                 <Chip
                           icon={transaction.amount > 0 ? <TrendingUp /> : <TrendingDown />}
                           label={
                             transaction.type === 'charge' ? '충전' :
                             transaction.type === 'escrow' ? '사용' :
                             transaction.type === 'release' ? '적립' :
                             transaction.type === 'withdraw' ? '인출' :
                             transaction.type === 'refund' ? '환불' :
                             transaction.type === 'compensation' ? '보상' :
                             transaction.type === 'deduction' ? '차감' : transaction.type
                           }
                           color={
                             transaction.amount > 0 ? 'success' :
                             transaction.type === 'withdraw' ? 'warning' : 'error'
                           }
                           size="small"
                         />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description}
                        </Typography>
                        {transaction.jobTitle && (
                          <Typography variant="caption" color="textSecondary">
                            {transaction.jobTitle}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={
                            transaction.amount > 0 ? 'success.main' : 'error.main'
                          }
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="작업 상세">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* 사용자 상세 대화상자 */}
      <Dialog
        open={userDetailDialogOpen}
        onClose={() => setUserDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
                 <DialogTitle>
           <Box display="flex" alignItems="center" gap={1}>
             <Avatar>
               {selectedUser?.userName?.charAt(0) || '?'}
             </Avatar>
             <Box>
               <Typography variant="h6">
                 {selectedUser?.userName || '알 수 없음'} 포인트 상세
               </Typography>
              <Chip
                label={selectedUser?.userRole === 'seller' ? '판매자' : '시공자'}
                color={selectedUser?.userRole === 'seller' ? 'primary' : 'secondary'}
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              {/* 요약 정보 */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        +{selectedUser.totalEarned.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">총 적립</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="error.main">
                        -{selectedUser.totalSpent.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">총 사용</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="warning.main">
                        -{selectedUser.totalWithdrawn.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">총 인출</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="h6" 
                        color={selectedUser.currentBalance >= 0 ? 'success.main' : 'error.main'}
                      >
                        {selectedUser.currentBalance.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">현재 잔액</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 거래 내역 */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                거래 내역 ({userTransactions.length}건)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>날짜</TableCell>
                      <TableCell>유형</TableCell>
                      <TableCell>내용</TableCell>
                      <TableCell align="right">금액</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.createdAt.toLocaleDateString('ko-KR')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                                                     <Chip
                             label={
                               transaction.type === 'charge' ? '충전' :
                               transaction.type === 'escrow' ? '사용' :
                               transaction.type === 'release' ? '적립' :
                               transaction.type === 'withdraw' ? '인출' :
                               transaction.type === 'refund' ? '환불' :
                               transaction.type === 'compensation' ? '보상' :
                               transaction.type === 'deduction' ? '차감' : transaction.type
                             }
                             color={
                               transaction.amount > 0 ? 'success' :
                               transaction.type === 'withdraw' ? 'warning' : 'error'
                             }
                             size="small"
                           />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={
                              transaction.amount > 0 ? 'success.main' : 'error.main'
                            }
                          >
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PointManagement;
