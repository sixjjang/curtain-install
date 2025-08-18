import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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
  Avatar,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send,
  Person,
  Business,
  Home
} from '@mui/icons-material';
import { ChatService } from '../../shared/services/chatService';
import { JobService } from '../../shared/services/jobService';
import { ChatMessage, ConstructionJob, Customer } from '../../types';

const CustomerChat: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  
  const [job, setJob] = useState<ConstructionJob | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (jobId && customerId) {
      loadChat();
    } else {
      setError('잘못된 접근입니다.');
      setLoading(false);
    }
  }, [jobId, customerId]);

  const loadChat = async () => {
    try {
      setLoading(true);
      
      // 고객 정보 가져오기
      const customerData = await ChatService.getCustomer(customerId!);
      if (!customerData) {
        setError('고객 정보를 찾을 수 없습니다.');
        return;
      }
      setCustomer(customerData);
      
      // 작업 정보 가져오기
      const jobData = await JobService.getJobById(jobId!);
      if (!jobData) {
        setError('작업 정보를 찾을 수 없습니다.');
        return;
      }
      setJob(jobData);
      
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
        },
        {
          id: customerData.id,
          type: 'customer',
          name: customerData.name
        }
      ];
      
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
    if (!newMessage.trim() || !chatRoomId || !job || !customer) return;
    
    try {
      await ChatService.sendMessage(
        chatRoomId,
        job.id,
        customer.id,
        'customer',
        customer.name,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
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

  if (!job || !customer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">정보를 찾을 수 없습니다.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {/* 헤더 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            커튼 시공 채팅
          </Typography>
          <Typography variant="h6" color="primary">
            {job.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {job.address}
          </Typography>
          <Box display="flex" gap={1} mt={1}>
            <Chip label={`고객: ${customer.name}`} color="success" size="small" />
            <Chip label={`상태: ${job.status === 'assigned' ? '배정됨' : job.status}`} color="info" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* 채팅 영역 */}
      <Paper sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
        {/* 메시지 목록 */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">
                아직 메시지가 없습니다. 첫 메시지를 보내보세요!
              </Typography>
            </Box>
          ) : (
            <List>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.senderType === 'customer' ? 'flex-end' : 'flex-start',
                    px: 0
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: `${getSenderColor(message.senderType)}.main`
                      }}
                    >
                      {getSenderIcon(message.senderType)}
                    </Avatar>
                    <Typography variant="caption" color="textSecondary">
                      {message.senderName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      bgcolor: message.senderType === 'customer' ? 'success.main' : 'grey.100',
                      color: message.senderType === 'customer' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body2">
                      {message.content}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        
        <Divider />
        
        {/* 메시지 입력 */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs>
              <TextField
                fullWidth
                placeholder="메시지를 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                startIcon={<Send />}
              >
                전송
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* 안내 메시지 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            💡 <strong>채팅 이용 안내</strong><br/>
            • 시공자와 판매자와 실시간으로 소통할 수 있습니다.<br/>
            • 시공 일정, 현장 상황, 추가 요청사항 등을 문의하세요.<br/>
            • 이 페이지를 닫아도 메시지는 저장됩니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerChat;
