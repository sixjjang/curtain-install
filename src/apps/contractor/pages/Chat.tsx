import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { Send, Chat as ChatIcon, List as ListIcon, ArrowBack, VisibilityOff, Visibility as VisibilityOn, LocationOn, AttachMoney, Work } from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ChatService } from '../../../shared/services/chatService';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const Chat: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // 총 예산 계산 함수
  const calculateTotalBudget = (job: ConstructionJob): number => {
    if (job.items && job.items.length > 0) {
      return job.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return 0;
  };

  // 시공일시-주소 포맷팅 함수
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
  
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false); // 모바일에서 채팅창 표시 여부
  const [hideCompleted, setHideCompleted] = useState(true); // 완료된 작업 숨김 여부

  useEffect(() => {
    loadMyJobs();
  }, [user, hideCompleted]);

  useEffect(() => {
    if (selectedJob) {
      loadChatMessages(selectedJob.id);
      subscribeToChat(selectedJob.id);
      if (isMobile) {
        setShowChat(true); // 모바일에서 작업 선택 시 채팅창 표시
      }
    }
  }, [selectedJob, isMobile]);

  const loadMyJobs = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const allJobs = await JobService.getAllJobs();
      const myJobs = allJobs.filter(job => 
        job.contractorId === user.id && 
        ['assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
      );
      setJobs(myJobs);
      
      // URL 파라미터로 전달된 jobId가 있으면 해당 작업을 자동 선택
      if (jobId) {
        const targetJob = myJobs.find(job => job.id === jobId);
        if (targetJob) {
          setSelectedJob(targetJob);
        }
      } else if (myJobs.length > 0 && !selectedJob) {
        // 첫 번째 작업을 자동 선택 (완료된 작업이 숨겨져 있다면 완료되지 않은 첫 번째 작업 선택)
        const availableJobs = hideCompleted ? myJobs.filter(job => job.status !== 'completed') : myJobs;
        if (availableJobs.length > 0) {
          setSelectedJob(availableJobs[0]);
        } else if (myJobs.length > 0) {
          setSelectedJob(myJobs[0]);
        }
      }
    } catch (error) {
      console.error('작업 목록 로드 실패:', error);
      setError('작업 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (jobId: string) => {
    try {
      const chatMessages = await ChatService.getMessages(jobId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('채팅 메시지 로드 실패:', error);
      setError('채팅 메시지를 불러오는데 실패했습니다.');
    }
  };

  const subscribeToChat = (jobId: string) => {
    return ChatService.subscribeToMessages(jobId, (newMessages: any[]) => {
      setMessages(newMessages);
    });
  };

  const handleSendMessage = async () => {
    if (!selectedJob || !newMessage.trim() || !user) return;

    try {
      await ChatService.sendMessage(
        selectedJob.id,
        selectedJob.id,
        user.id,
        'contractor',
        user.name || user.email || '시공자',
        newMessage.trim(),
        user.profileImage
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setError('메시지 전송에 실패했습니다.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const handleJobSelect = (job: ConstructionJob) => {
    setSelectedJob(job);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  // 완료된 작업 필터링
  const filteredJobs = hideCompleted ? jobs.filter(job => job.status !== 'completed') : jobs;

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {[1, 2, 3].map((index) => (
          <Card key={index} sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Box>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="40%" height={20} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // 모바일에서 채팅창 표시
  if (isMobile && showChat && selectedJob) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 채팅 헤더 */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 10,
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <IconButton 
            onClick={handleBackToList}
            sx={{ flexShrink: 0 }}
            aria-label="목록으로 돌아가기"
          >
            <ArrowBack />
          </IconButton>
                     <Box sx={{ flexGrow: 1, minWidth: 0 }}>
             <Typography 
               variant="subtitle1" 
               sx={{ 
                 overflow: 'hidden', 
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
                 fontWeight: 600,
                 fontSize: '0.9rem',
                 lineHeight: 1.2
               }}
             >
               {selectedJob.title || formatJobTitle(selectedJob)}
             </Typography>
             <Typography 
               variant="caption" 
               color="textSecondary" 
               sx={{ 
                 overflow: 'hidden', 
                 textOverflow: 'ellipsis',
                 whiteSpace: 'nowrap',
                 display: 'block',
                 mt: 0.5,
                 fontSize: '0.75rem',
                 lineHeight: 1.2
               }}
             >
               {selectedJob.address.length > 30 
                 ? `${selectedJob.address.substring(0, 30)}...` 
                 : selectedJob.address
               }
             </Typography>
           </Box>
          <Chip 
            label={getStatusText(selectedJob.status)} 
            color={getStatusColor(selectedJob.status)} 
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* 메시지 목록 */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflow: 'auto',
          bgcolor: 'grey.50'
        }}>
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
                    backgroundColor: message.senderId === user?.id ? 'primary.main' : 'white',
                    color: message.senderId === user?.id ? 'white' : 'text.primary',
                    boxShadow: 1
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
                    {formatTime(message.createdAt)}
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
        </Box>

        {/* 메시지 입력 */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
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
              <Send />
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // 모바일에서 작업 목록 표시
  if (isMobile) {
    return (
      <Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, mx: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              내 시공 작업
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={hideCompleted ? <VisibilityOff /> : <VisibilityOn />}
              onClick={() => setHideCompleted(!hideCompleted)}
            >
              {hideCompleted ? '완료된 작업 표시' : '완료된 작업 숨김'}
            </Button>
          </Box>
          <List>
            {filteredJobs.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8, 
                px: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}>
                  <ChatIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                </Box>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  배정된 작업이 없습니다
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                  판매자로부터 작업을 배정받으면 채팅할 수 있습니다.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/contractor/jobs')}
                  startIcon={<Work />}
                >
                  시공건 찾기
                </Button>
              </Box>
            ) : (
                             filteredJobs.map((job) => (
                 <Card 
                   key={job.id}
                   sx={{ 
                     mb: 2, 
                     cursor: 'pointer',
                     borderRadius: 2,
                     boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                     '&:hover': { 
                       transform: 'translateY(-2px)',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                       transition: 'all 0.2s ease'
                     }
                   }}
                   onClick={() => handleJobSelect(job)}
                 >
                   <CardContent sx={{ p: 2 }}>
                     <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                       <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                         {formatJobTitle(job)}
                       </Typography>
                       <Chip 
                         label={getStatusText(job.status)} 
                         color={getStatusColor(job.status)} 
                         size="small"
                         sx={{ ml: 1, flexShrink: 0 }}
                       />
                     </Box>
                     
                     <Box display="flex" alignItems="center" gap={1} mb={1}>
                       <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                       <Typography variant="body2" color="textSecondary" sx={{ flex: 1 }}>
                         {job.address}
                       </Typography>
                     </Box>
                     
                     <Box display="flex" alignItems="center" gap={1}>
                       <AttachMoney sx={{ fontSize: 16, color: 'primary.main' }} />
                       <Typography variant="body2" color="primary.main" fontWeight={600}>
                         {job.finalAmount 
                           ? `${job.finalAmount.toLocaleString()}원` 
                           : calculateTotalBudget(job) > 0 
                             ? `${calculateTotalBudget(job).toLocaleString()}원`
                             : '예산 미정'
                         }
                       </Typography>
                     </Box>
                   </CardContent>
                 </Card>
               ))
            )}
          </List>
        </Box>
      </Box>
    );
  }

  // 데스크톱 레이아웃 (기존과 동일)
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} sx={{ height: 'calc(100vh - 200px)' }}>
        {/* 작업 목록 */}
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                내 시공 작업
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={hideCompleted ? <VisibilityOff /> : <VisibilityOn />}
                onClick={() => setHideCompleted(!hideCompleted)}
              >
                {hideCompleted ? '완료된 작업 표시' : '완료된 작업 숨김'}
              </Button>
            </Box>
            <List sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
              {filteredJobs.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="배정된 작업이 없습니다." 
                    secondary="판매자로부터 작업을 배정받으면 채팅할 수 있습니다."
                  />
                </ListItem>
              ) : (
                filteredJobs.map((job) => (
                  <ListItem 
                    key={job.id}
                    button
                    selected={selectedJob?.id === job.id}
                    onClick={() => setSelectedJob(job)}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" noWrap>
                            {formatJobTitle(job)}
                          </Typography>
                          <Chip 
                            label={getStatusText(job.status)} 
                            color={getStatusColor(job.status)} 
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {job.address}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            총금액: {job.finalAmount 
                              ? `${job.finalAmount.toLocaleString()}원` 
                              : calculateTotalBudget(job) > 0 
                                ? `${calculateTotalBudget(job).toLocaleString()}원`
                                : '예산 미정'
                            }
                          </Typography>
                        </Box>
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
                  <Typography variant="h6">
                    {selectedJob.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedJob.address}
                  </Typography>
                  <Chip 
                    label={getStatusText(selectedJob.status)} 
                    color={getStatusColor(selectedJob.status)} 
                    size="small"
                    sx={{ mt: 1 }}
                  />
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
                            color: message.senderId === user?.id ? 'white' : 'text.primary'
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
                            {formatTime(message.createdAt)}
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
                      <Send />
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
                    채팅할 작업을 선택하세요
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    왼쪽에서 판매자와 채팅할 작업을 선택하세요.
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Chat;
