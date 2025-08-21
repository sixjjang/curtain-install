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
  Avatar
} from '@mui/material';
import { 
  Send as SendIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ChatService } from '../../../shared/services/chatService';
import { JobService } from '../../../shared/services/jobService';
import { ConstructionJob } from '../../../types';

const ContractorChat: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ConstructionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ConstructionJob | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 시공건 목록 불러오기
  useEffect(() => {
    const loadJobs = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const allJobs = await JobService.getAllJobs();
        // 판매자가 등록한 작업들만 필터링
        const myJobs = allJobs.filter(job => 
          job.sellerId === user.id && 
          ['pending', 'assigned', 'product_preparing', 'product_ready', 'pickup_completed', 'in_progress', 'completed'].includes(job.status)
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
        'seller',
        user.name || '판매자',
        newMessage.trim(),
        user.profileImage || undefined
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
        시공자와 채팅
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
                    primary="등록된 작업이 없습니다." 
                    secondary="새로운 시공 작업을 등록하면 시공자와 채팅할 수 있습니다."
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
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" noWrap>
                            {job.title}
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
                            예산: {job.budget?.min?.toLocaleString()}~{job.budget?.max?.toLocaleString()}원
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
                        시공자와 첫 메시지를 시작해보세요!
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
                      placeholder="시공자에게 메시지를 보내세요..."
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
                    왼쪽에서 시공자와 채팅할 시공건을 선택하세요.
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

export default ContractorChat;
