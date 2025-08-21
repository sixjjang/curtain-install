import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send,
  Person,
  Business,
  Home,
  ArrowBack
} from '@mui/icons-material';
import { ChatService } from '../../../shared/services/chatService';
import { JobService } from '../../../shared/services/jobService';
import { ChatMessage, ConstructionJob, Customer } from '../../../types';
import { useAuth } from '../../../shared/contexts/AuthContext';

const Chat: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<ConstructionJob | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (jobId) {
      loadJobAndChat();
    }
  }, [jobId]);

  const loadJobAndChat = async () => {
    try {
      setLoading(true);
      
      // 작업 정보 가져오기
      const jobData = await JobService.getJobById(jobId!);
      if (!jobData) {
        setError('작업 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 판매자 본인의 작업인지 확인
      if (jobData.sellerId !== user?.id) {
        setError('접근 권한이 없습니다.');
        return;
      }
      
      setJob(jobData);
      
      // 고객 정보 가져오기
      const customerData = await ChatService.getCustomerByJobId(jobId!);
      setCustomer(customerData);
      
      // 채팅방 생성 또는 가져오기
      const participants: {
        id: string;
        type: 'contractor' | 'seller' | 'customer';
        name: string;
      }[] = [
        {
          id: jobData.contractorId || 'contractor',
          type: 'contractor',
          name: '시공자'
        },
        {
          id: jobData.sellerId,
          type: 'seller',
          name: '판매자'
        }
      ];
      
      if (customerData) {
        participants.push({
          id: customerData.id,
          type: 'customer',
          name: customerData.name
        });
      }
      
      const roomId = await ChatService.getOrCreateChatRoom(jobId!, participants);
      setChatRoomId(roomId);
      
      // 메시지 구독
      const unsubscribe = ChatService.subscribeToMessages(roomId, (messages) => {
        setMessages(messages);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('채팅 로드 실패:', error);
      setError('채팅을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !job) return;
    
    try {
      await ChatService.sendMessage(
        chatRoomId,
        job.id,
        user?.id || 'seller',
        'seller',
        user?.name || '판매자',
        newMessage.trim(),
        user?.profileImage
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'contractor':
        return <Person />;
      case 'seller':
        return <Business />;
      case 'customer':
        return <Home />;
      default:
        return <Person />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'contractor':
        return 'primary';
      case 'seller':
        return 'secondary';
      case 'customer':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">작업 정보를 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/seller/jobs')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">
          채팅
        </Typography>
      </Box>

      {/* 작업 정보 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {job.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            주소: {job.address}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            상태: {job.status}
          </Typography>
          {customer && (
            <Typography variant="body2" color="textSecondary">
              고객: {customer.name}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 채팅 메시지 영역 */}
      <Card sx={{ mb: 3, height: 400, overflow: 'hidden' }}>
        <CardContent sx={{ height: '100%', p: 0 }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* 메시지 목록 */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="textSecondary">
                    아직 메시지가 없습니다.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {messages.map((message, index) => (
                    <ListItem
                      key={message.id}
                      sx={{
                        flexDirection: 'column',
                        alignItems: message.senderType === 'seller' ? 'flex-end' : 'flex-start',
                        p: 0,
                        mb: 1
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          maxWidth: '70%',
                          flexDirection: message.senderType === 'seller' ? 'row-reverse' : 'row'
                        }}
                      >
                        {message.senderType !== 'seller' && (
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: `${getSenderColor(message.senderType)}.main`
                            }}
                            src={message.senderProfileImage || undefined}
                          >
                            {message.senderName?.charAt(0) || getSenderIcon(message.senderType)}
                          </Avatar>
                        )}
                        
                        <Box>
                          <Box
                            sx={{
                              bgcolor: message.senderType === 'seller' ? 'primary.main' : 'grey.100',
                              color: message.senderType === 'seller' ? 'white' : 'text.primary',
                              p: 1.5,
                              borderRadius: 2,
                              maxWidth: '100%',
                              wordBreak: 'break-word'
                            }}
                          >
                            <Typography variant="body2">
                              {message.content}
                            </Typography>
                          </Box>
                          
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 0.5,
                              justifyContent: message.senderType === 'seller' ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <Typography variant="caption" color="textSecondary">
                              {message.senderName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {message.senderType === 'seller' && (
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: `${getSenderColor(message.senderType)}.main`
                            }}
                            src={user?.profileImage || undefined}
                          >
                            {user?.name?.charAt(0) || getSenderIcon(message.senderType)}
                          </Avatar>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 메시지 입력 */}
      <Card>
        <CardContent>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              sx={{ minWidth: 60 }}
            >
              <Send />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Chat;
