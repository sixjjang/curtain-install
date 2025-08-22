import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Send as SendIcon,
  Chat as ChatIcon,
  Schedule,
  LocationOn,
  Person,
  AccountBalance,
  ListAlt,
  LocalShipping,
  Description,
  Visibility,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ChatService } from '../../../shared/services/chatService';
import { JobService } from '../../../shared/services/jobService';
import { CustomerService, CustomerInfo } from '../../../shared/services/customerService';
import { ConstructionJob } from '../../../types';

const SellerChat: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 상세보기 다이얼로그 관련 상태
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<ConstructionJob | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  // 시공건 목록 불러오기
  useEffect(() => {
    const loadJobs = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const allJobs = await JobService.getAllJobs();
        // 시공자가 배정된 작업들만 필터링
        const myJobs = allJobs.filter(job => 
          job.contractorId === user.id && 
          ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
        );
        setJobs(myJobs);
        
        // 첫 번째 작업을 자동 선택
        if (myJobs.length > 0 && !selectedJob) {
          setSelectedJob(myJobs[0]);
        }
      } catch (error) {
        console.error('시공건 목록 불러오기 실패:', error);
        setError('시공건 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user]);

  // 선택된 시공건이 변경될 때 메시지 불러오기
  useEffect(() => {
    if (selectedJob) {
      loadChatMessages(selectedJob.id);
      subscribeToChat(selectedJob.id);
      loadJobDetails(selectedJob.id);
    }
  }, [selectedJob]);

  // 메시지 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅 메시지 불러오기
  const loadChatMessages = async (jobId: string) => {
    try {
      const chatMessages = await ChatService.getMessages(jobId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('채팅 메시지 로드 실패:', error);
      setError('채팅 메시지를 불러올 수 없습니다.');
    }
  };

  // 실시간 채팅 구독
  const subscribeToChat = (jobId: string) => {
    return ChatService.subscribeToMessages(jobId, (newMessages: any[]) => {
      setMessages(newMessages);
    });
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!selectedJob || !newMessage.trim() || !user?.id) return;

    try {
      await ChatService.sendMessage(
        selectedJob.id,
        selectedJob.id,
        user.id,
        'contractor',
        user.name || '시공자',
        newMessage.trim(),
user.profileImage || ''
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setError('메시지 전송에 실패했습니다.');
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // 상세보기 처리
  const handleJobDetail = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setDetailJob(job);
      setDetailDialogOpen(true);
      
      // 고객 정보 가져오기
      if (job.customerId) {
        try {
          const customer = await CustomerService.getCustomerInfo(job.customerId);
          setCustomerInfo(customer);
        } catch (error) {
          console.error('고객 정보 조회 실패:', error);
          setCustomerInfo(null);
        }
      } else {
        setCustomerInfo(null);
      }
    }
  };

  // 작업 상세 정보 로드
  const loadJobDetails = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      // 고객 정보 가져오기
      if (job.customerId) {
        try {
          const customer = await CustomerService.getCustomerInfo(job.customerId);
          setCustomerInfo(customer);
        } catch (error) {
          console.error('고객 정보 조회 실패:', error);
          setCustomerInfo(null);
        }
      } else {
        setCustomerInfo(null);
      }

      // 판매자 정보 가져오기
      if (job.sellerId) {
        try {
          const { AuthService } = await import('../../../shared/services/authService');
          const seller = await AuthService.getUserById(job.sellerId);
          setSellerInfo({
            id: job.sellerId,
            name: seller?.name || job.sellerName || '판매자',
            phone: seller?.phone || '연락처 없음'
          });
        } catch (error) {
          console.error('판매자 정보 조회 실패:', error);
          setSellerInfo({
            id: job.sellerId,
            name: job.sellerName || '판매자',
            phone: '연락처 없음'
          });
        }
      } else {
        setSellerInfo(null);
      }
    }
  };

  // 총 금액 계산
  const calculateTotalPrice = (job: ConstructionJob) => {
    if (!job.items || job.items.length === 0) {
      return 0;
    }
    return job.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 시공일시-주소 포맷팅 함수 (금액 제거)
  const formatJobTitle = (job: ConstructionJob): string => {
    if (job.scheduledDate) {
      const date = new Date(job.scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // 주소에서 시/도 부분만 추출 (예: "경기도 시흥시 소래포구" -> "경기도 시흥시")
      const addressParts = job.address.split(' ');
      const cityPart = addressParts.slice(0, 2).join(' '); // 시/도 부분
      
      return `${month}/${day} ${timeStr}-${cityPart}`;
    }
    return job.title;
  };

  // 채팅 헤더용 제목 포맷팅 (금액 포함)
  const formatChatHeaderTitle = (job: ConstructionJob): string => {
    if (job.scheduledDate) {
      const date = new Date(job.scheduledDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // 주소에서 시/도 부분만 추출
      const addressParts = job.address.split(' ');
      const cityPart = addressParts.slice(0, 2).join(' ');
      
      // 작업 내용 추가 (아이템 정보가 있다면)
      let jobDetails = '';
      if (job.items && job.items.length > 0) {
        const itemDescriptions = job.items.map(item => {
          // name 속성을 기반으로 작업 내용 판단
          if (item.name.toLowerCase().includes('블라인드')) {
            return `블라인드 ${item.quantity}창`;
          } else if (item.name.toLowerCase().includes('커튼')) {
            return `커튼 ${item.quantity}조`;
          }
          return `${item.name} ${item.quantity}개`;
        });
        jobDetails = `-${itemDescriptions.join(', ')}`;
      }
      
      return `${month}/${day} ${timeStr}-${cityPart}${jobDetails}`;
    }
    return job.title;
  };

  // 날짜 포맷팅
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태 텍스트 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'product_preparing': return '자재준비';
      case 'product_ready': return '자재완료';
      case 'pickup_completed': return '픽업완료';
      case 'in_progress': return '시공중';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  // 상태 색상 변환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'assigned': return 'primary';
      case 'product_preparing': return 'warning';
      case 'product_ready': return 'info';
      case 'pickup_completed': return 'secondary';
      case 'in_progress': return 'success';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChatIcon />
        판매자와 채팅
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* 시공건 목록 */}
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              내 시공 작업
            </Typography>
            <List sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              {jobs.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="배정된 작업이 없습니다." 
                    secondary="판매자로부터 작업을 배정받으면 채팅할 수 있습니다."
                  />
                </ListItem>
              ) : (
                jobs.map((job) => (
                  <ListItem 
                    key={job.id}
                    button
                    selected={selectedJob?.id === job.id}
                    onClick={() => setSelectedJob(job)}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <>
                          <Typography variant="subtitle2" noWrap component="span">
                            {formatJobTitle(job)}
                          </Typography>
                          <Chip 
                            label={getStatusText(job.status)} 
                            color={getStatusColor(job.status)} 
                            size="small"
                            sx={{ float: 'right' }}
                          />
                        </>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary" noWrap component="span">
                            {job.address}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" component="span" display="block">
                            총금액: {job.finalAmount 
                              ? `${job.finalAmount.toLocaleString()}원` 
                              : calculateTotalPrice(job) > 0 
                                ? `${calculateTotalPrice(job).toLocaleString()}원`
                                : '예산 미정'
                            }
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>

        {/* 채팅 영역 */}
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
            {selectedJob ? (
              <>
                {/* 채팅 헤더 */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">
                        {formatChatHeaderTitle(selectedJob)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedJob.address}
                        {customerInfo && (
                          <span> ({customerInfo.phone})</span>
                        )}
                      </Typography>
                      {sellerInfo && (
                        <Typography variant="body2" color="textSecondary">
                          판매자 ({sellerInfo.phone})
                        </Typography>
                      )}
                      <Chip 
                        label={getStatusText(selectedJob.status)} 
                        color={getStatusColor(selectedJob.status)} 
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleJobDetail(selectedJob.id)}
                    >
                      상세보기
                    </Button>
                  </Box>
                </Box>

                {/* 메시지 목록 */}
                <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
                  {messages.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography color="textSecondary">
                        아직 메시지가 없습니다.
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        판매자와 첫 메시지를 시작해보세요!
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((message, index) => (
                      <Box
                        key={message.id || index}
                        sx={{
                          display: 'flex',
                          justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                          mb: 2,
                          alignItems: 'flex-end',
                          gap: 1
                        }}
                      >
                        {message.senderId !== user?.id && (
                          <Avatar
                            sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                            src={message.senderProfileImage || undefined}
                          >
                            {message.senderName?.charAt(0) || 'U'}
                          </Avatar>
                        )}
                        
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            backgroundColor: message.senderId === user?.id ? 'primary.main' : 'grey.100',
                            color: message.senderId === user?.id ? 'white' : 'text.primary',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {message.content}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              mt: 0.5,
                              opacity: 0.7
                            }}
                          >
                            {formatTime(message.timestamp || message.createdAt)}
                          </Typography>
                        </Paper>
                        
                        {message.senderId === user?.id && (
                          <Avatar
                            sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                            src={user?.profileImage || undefined}
                          >
                            {user?.name?.charAt(0) || 'U'}
                          </Avatar>
                        )}
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* 메시지 입력 */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={3}
                      placeholder="판매자에게 메시지를 보내세요..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      <SendIcon />
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                sx={{ height: '100%' }}
              >
                <Box textAlign="center">
                  <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    채팅할 시공건을 선택하세요
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    왼쪽에서 판매자와 채팅할 시공건을 선택하세요.
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 상세보기 다이얼로그 */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => {
          setDetailDialogOpen(false);
          setCustomerInfo(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">작업 상세 정보</Typography>
            <Button onClick={() => {
              setDetailDialogOpen(false);
              setCustomerInfo(null);
            }}>
              닫기
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailJob && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {detailJob.title.replace(/-\d{1,3}(,\d{3})*원$/, '')}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Chip 
                  label={getStatusText(detailJob.status)} 
                  color={getStatusColor(detailJob.status)} 
                  size="medium"
                />
              </Box>

              {/* 고객 정보 */}
              {customerInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    고객 정보
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>이름:</strong> {customerInfo.name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>연락처:</strong> {customerInfo.phone}
                    </Typography>
                    {customerInfo.address && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>주소:</strong> {customerInfo.address}
                      </Typography>
                    )}
                    {customerInfo.email && (
                      <Typography variant="body2">
                        <strong>이메일:</strong> {customerInfo.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* 시공일시 */}
              {detailJob.scheduledDate && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="action" />
                    시공일시
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {formatDateTime(detailJob.scheduledDate)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* 준비일시 */}
              {detailJob.pickupInfo && detailJob.pickupInfo.scheduledDateTime && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="action" />
                    준비일시
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {formatDateTime(new Date(detailJob.pickupInfo.scheduledDateTime))}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* 총 금액 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance color="action" />
                  총 금액
                </Typography>
                <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {calculateTotalPrice(detailJob).toLocaleString()}원
                  </Typography>
                </Box>
              </Box>

              {/* 품목 및 단가 */}
              {detailJob.items && detailJob.items.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListAlt color="action" />
                    품목 및 단가
                  </Typography>
                  <Box sx={{ ml: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <List dense>
                      {detailJob.items.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <>
                                <Typography variant="body2" component="span">
                                  {item.name} × {item.quantity}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" component="span" sx={{ float: 'right' }}>
                                  {item.totalPrice.toLocaleString()}원
                                </Typography>
                              </>
                            }
                            secondary={
                              <Typography variant="caption" color="textSecondary" component="span">
                                단가: {item.unitPrice.toLocaleString()}원
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              )}

              {/* 픽업 정보 */}
              {detailJob.pickupInfo && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping color="action" />
                    픽업 정보
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {detailJob.pickupInfo.companyName && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>상호:</strong> {detailJob.pickupInfo.companyName}
                      </Typography>
                    )}
                    {detailJob.pickupInfo.phone && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>연락처:</strong> {detailJob.pickupInfo.phone}
                      </Typography>
                    )}
                    {detailJob.pickupInfo.address && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>픽업주소:</strong> {detailJob.pickupInfo.address}
                      </Typography>
                    )}
                    {detailJob.pickupInfo.scheduledDateTime && (
                      <Typography variant="body2">
                        <strong>픽업일시:</strong> {formatDateTime(new Date(detailJob.pickupInfo.scheduledDateTime))}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* 작업지시서 파일 */}
              {detailJob.workInstructions && detailJob.workInstructions.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description color="action" />
                    작업지시서 파일
                  </Typography>
                  <Box sx={{ ml: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {detailJob.workInstructions.map((file, index) => (
                      <Box key={file.id} sx={{ p: 2, borderBottom: index < detailJob.workInstructions!.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>파일명:</strong> {file.fileName}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>파일 크기:</strong> {(file.fileSize / 1024).toFixed(1)} KB
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>파일 타입:</strong> {file.fileType}
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => window.open(file.fileUrl, '_blank')}
                        >
                          파일 미리보기
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 작업 설명 */}
              {detailJob.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="action" />
                    작업 설명
                  </Typography>
                  <Box sx={{ ml: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      {detailJob.description}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SellerChat;
