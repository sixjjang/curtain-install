import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
import { ChatMessage, ChatRoom, ConstructionJob, Customer } from '../../../types';

const Chat: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<ConstructionJob | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoomId, setChatRoomId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chatType, setChatType] = useState<'seller' | 'customer'>('seller');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

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
        job.contractorId || 'contractor',
        'contractor',
        '시공자',
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!jobId || !customerInfo.name || !customerInfo.phone) return;
    
    try {
      const customerId = await ChatService.createCustomerForChat(
        customerInfo.name,
        customerInfo.phone,
        customerInfo.email,
        jobId
      );
      
      // 고객 정보 새로고침
      const customerData = await ChatService.getCustomer(customerId);
      setCustomer(customerData);
      
      // 채팅방 새로고침
      await loadJobAndChat();
      
      setShowCustomerDialog(false);
      setCustomerInfo({ name: '', phone: '', email: '' });
    } catch (error) {
      console.error('고객 생성 실패:', error);
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
      <Box>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box>
        <Typography>작업을 찾을 수 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 헤더 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => window.history.back()}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h6">{job.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {job.address}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1} mt={2}>
            <Chip
              label="판매자와 채팅"
              color={chatType === 'seller' ? 'primary' : 'default'}
              onClick={() => setChatType('seller')}
              icon={<Business />}
            />
            <Chip
              label="고객과 채팅"
              color={chatType === 'customer' ? 'primary' : 'default'}
              onClick={() => setChatType('customer')}
              icon={<Home />}
            />
            {!customer && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowCustomerDialog(true)}
              >
                고객 정보 등록
              </Button>
            )}
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
              {messages.map((message, index) => (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.senderType === 'contractor' ? 'flex-end' : 'flex-start',
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
                      bgcolor: message.senderType === 'contractor' ? 'primary.main' : 'grey.100',
                      color: message.senderType === 'contractor' ? 'white' : 'text.primary'
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

      {/* 고객 정보 등록 다이얼로그 */}
      <Dialog open={showCustomerDialog} onClose={() => setShowCustomerDialog(false)}>
        <DialogTitle>고객 정보 등록</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="고객 이름"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="전화번호"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="이메일 (선택사항)"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomerDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleCreateCustomer}
            disabled={!customerInfo.name || !customerInfo.phone}
            variant="contained"
          >
            등록
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
