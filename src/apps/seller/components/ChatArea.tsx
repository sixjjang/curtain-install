import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon,
  Image as ImageIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { ChatService } from '../../../shared/services/chatService';
import { CustomerService, CustomerInfo } from '../../../shared/services/customerService';
import { ConstructionJob } from '../../../types';

interface ChatAreaProps {
  selectedJob?: ConstructionJob | null;
  onJobDetail?: (jobId: string) => void;
  isModal?: boolean;
  // 새로운 props for direct usage
  jobId?: string;
  jobTitle?: string;
  jobAddress?: string;
  contractorName?: string;
  contractorPhone?: string;
  isDialog?: boolean;
  userRole?: 'seller' | 'contractor';
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  selectedJob, 
  onJobDetail, 
  isModal = false,
  jobId,
  jobTitle,
  jobAddress,
  contractorName,
  contractorPhone,
  isDialog = false,
  userRole = 'seller'
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [contractorInfo, setContractorInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 이미지 전송 관련 상태
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 메시지 스크롤을 맨 아래로
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 선택된 작업이 변경될 때도 스크롤을 맨 아래로
  useEffect(() => {
    if ((selectedJob || jobId) && messages.length > 0) {
      scrollToBottom();
    }
  }, [selectedJob, jobId]);

  // 선택된 시공건이 변경될 때 메시지 불러오기
  useEffect(() => {
    const targetJobId = jobId || selectedJob?.id;
    if (targetJobId) {
      loadChatMessages(targetJobId);
      subscribeToChat(targetJobId);
      if (selectedJob) {
        loadJobDetails(targetJobId);
      }
    }
  }, [selectedJob, jobId]);

  // 작업 상세 정보 로드
  const loadJobDetails = async (targetJobId: string) => {
    const targetJob = selectedJob;
    if (!targetJob) return;

    // 고객 정보 가져오기
    if (targetJob.customerId) {
      try {
        const customer = await CustomerService.getCustomerInfo(targetJob.customerId);
        setCustomerInfo(customer);
      } catch (error) {
        console.error('고객 정보 조회 실패:', error);
        setCustomerInfo(null);
      }
    } else {
      setCustomerInfo(null);
    }

    // 시공자 정보 가져오기
    if (targetJob.contractorId) {
      try {
        const { AuthService } = await import('../../../shared/services/authService');
        const contractor = await AuthService.getUserById(targetJob.contractorId);
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
    const targetJobId = jobId || selectedJob?.id;
    if (!targetJobId || !newMessage.trim() || !user?.id) return;

    try {
      await ChatService.sendMessage(
        targetJobId,
        targetJobId,
        user.id,
        userRole,
        user.name || (userRole === 'seller' ? '판매자' : '시공자'),
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

  // 이미지 선택 처리
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setImageError('이미지 파일만 선택 가능합니다.');
        return;
      }

      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      setSelectedImage(file);
      setImageError(null);

      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setImageDialogOpen(true);
    }
  };

  // 이미지 전송 처리
  const handleSendImage = async () => {
    const targetJobId = jobId || selectedJob?.id;
    if (!targetJobId || !selectedImage || !user?.id) return;

    try {
      setUploadingImage(true);
      setImageError(null);

      console.log('📤 이미지 전송 시작:', {
        jobId: targetJobId,
        fileName: selectedImage.name,
        fileSize: selectedImage.size,
        fileType: selectedImage.type
      });

      await ChatService.sendImageMessage(
        targetJobId,
        targetJobId,
        user.id,
        userRole,
        user.name || (userRole === 'seller' ? '판매자' : '시공자'),
        selectedImage,
        user.profileImage || ''
      );

      console.log('✅ 이미지 전송 완료');

      // 성공 시 상태 초기화
      setSelectedImage(null);
      setImagePreview(null);
      setImageDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ 이미지 전송 실패:', error);
      setImageError(error instanceof Error ? error.message : '이미지 전송에 실패했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 이미지 다이얼로그 닫기
  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      case 'product_ready': return '제품준비완료';
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

  if (!selectedJob && !jobId) {
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
      {/* 채팅 헤더 - 고정 */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography 
                variant="h6" 
                sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  fontSize: isModal ? '0.9rem' : '1.25rem',
                  lineHeight: 1.2,
                  flexGrow: 1
                }}
              >
                {selectedJob ? formatChatHeaderTitle(selectedJob) : (jobTitle || '작업 정보')}
              </Typography>
              {selectedJob && (
                <Chip 
                  label={getStatusText(selectedJob.status)} 
                  color={getStatusColor(selectedJob.status)} 
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              )}
            </Box>
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
              {selectedJob ? selectedJob.address : (jobAddress || '주소 정보 없음')}
              {customerInfo && ` (${customerInfo.phone})`}
            </Typography>
            {(contractorInfo || contractorName) && (
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
                시공자({contractorInfo ? (contractorInfo.name || contractorInfo.email) : contractorName}, {contractorInfo ? (contractorInfo.phone || '연락처 없음') : (contractorPhone || '연락처 없음')})
              </Typography>
            )}
          </Box>
          {onJobDetail && selectedJob && (
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
        maxHeight: isModal ? 'calc(80vh - 200px)' : 'calc(100vh - 350px)',
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
                                        {message.messageType === 'image' ? (
                          <Box>
                            {message.imageUrl ? (
                              <img 
                                src={message.imageUrl} 
                                alt="채팅 이미지"
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '200px',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(message.imageUrl, '_blank')}
                                onError={(e) => {
                                  console.error('이미지 로딩 실패:', message.imageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="error">
                                이미지를 불러올 수 없습니다.
                              </Typography>
                            )}
                            <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                              {message.content}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {message.content}
                          </Typography>
                        )}
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

      {/* 메시지 입력 - 고정 */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0
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
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            sx={{ minWidth: 'auto' }}
            title="이미지 전송"
          >
            <ImageIcon />
          </IconButton>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
        
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {/* 이미지 전송 다이얼로그 */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={handleCloseImageDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">이미지 전송</Typography>
            <IconButton onClick={handleCloseImageDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {imageError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {imageError}
            </Alert>
          )}
          
          {imagePreview && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img 
                src={imagePreview} 
                alt="미리보기"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px'
                }}
              />
            </Box>
          )}
          
          <Typography variant="body2" color="textSecondary">
            선택한 이미지를 전송하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>
            취소
          </Button>
          <Button
            onClick={handleSendImage}
            variant="contained"
            disabled={uploadingImage}
            startIcon={uploadingImage ? <CircularProgress size={16} /> : <SendIcon />}
          >
            {uploadingImage ? '전송 중...' : '전송'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatArea;
