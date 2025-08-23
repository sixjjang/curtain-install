import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ChatService } from '../../../shared/services/chatService';
import { CustomerService, CustomerInfo } from '../../../shared/services/customerService';
import { ConstructionJob } from '../../../types';

interface ChatAreaProps {
  selectedJob: ConstructionJob | null;
  onJobDetail?: (jobId: string) => void;
  isModal?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ selectedJob, onJobDetail, isModal = false }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [contractorInfo, setContractorInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 선택된 시공건이 변경될 때 메시지 불러오기
  useEffect(() => {
    if (selectedJob) {
      loadChatMessages(selectedJob.id);
      subscribeToChat(selectedJob.id);
      loadJobDetails(selectedJob.id);
    }
  }, [selectedJob]);

  // 작업 상세 정보 로드
  const loadJobDetails = async (jobId: string) => {
    if (!selectedJob) return;

    // 고객 정보 가져오기
    if (selectedJob.customerId) {
      try {
        const customer = await CustomerService.getCustomerInfo(selectedJob.customerId);
        setCustomerInfo(customer);
      } catch (error) {
        console.error('고객 정보 조회 실패:', error);
        setCustomerInfo(null);
      }
    } else {
      setCustomerInfo(null);
    }

    // 시공자 정보 가져오기
    if (selectedJob.contractorId) {
      try {
        const { AuthService } = await import('../../../shared/services/authService');
        const contractor = await AuthService.getUserById(selectedJob.contractorId);
        setContractorInfo(contractor);
      } catch (error) {
        console.error('시공자 정보 조회 실패:', error);
        setContractorInfo(null);
      }
    } else {
      setContractorInfo(null);
    }
  };

  // 채팅 메시지 불러오기
  const loadChatMessages = async (jobId: string) => {
    try {
      const chatMessages = await ChatService.getMessages(jobId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('채팅 메시지 로드 실패:', error);
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
        user.profileImage || ''
      );
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
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

  // 채팅 헤더용 제목 포맷팅
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

  if (!selectedJob) {
    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        sx={{ height: '100%' }}
      >
        <Box textAlign="center">
          <Typography variant="h6" color="textSecondary" gutterBottom>
            채팅할 시공건을 선택하세요
          </Typography>
          <Typography variant="body2" color="textSecondary">
            왼쪽에서 시공자와 채팅할 시공건을 선택하세요.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 채팅 헤더 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: isModal ? '0.9rem' : '1.25rem',
                lineHeight: 1.2
              }}
            >
              {formatChatHeaderTitle(selectedJob)}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: isModal ? '0.75rem' : '0.875rem',
                lineHeight: 1.2
              }}
            >
              {selectedJob.address}
              {customerInfo && ` (${customerInfo.phone})`}
            </Typography>
            {contractorInfo && (
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: isModal ? '0.7rem' : '0.875rem',
                  lineHeight: 1.2
                }}
              >
                시공자({contractorInfo.name || contractorInfo.email}, {contractorInfo.phone || '연락처 없음'})
              </Typography>
            )}
            <Chip 
              label={getStatusText(selectedJob.status)} 
              color={getStatusColor(selectedJob.status)} 
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
          {onJobDetail && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => onJobDetail(selectedJob.id)}
              sx={{ ml: 2, flexShrink: 0 }}
            >
              상세보기
            </Button>
          )}
        </Box>
      </Box>

      {/* 메시지 목록 */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2, 
        overflow: 'auto', 
        maxHeight: isModal ? 'calc(80vh - 200px)' : 'calc(100vh - 400px)',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
      }}>
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
                  backgroundColor: message.senderId === user?.id ? 'primary.main' : 'background.paper',
                  color: message.senderId === user?.id ? 'white' : 'text.primary',
                  borderRadius: 2,
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
    </Box>
  );
};

export default ChatArea;
