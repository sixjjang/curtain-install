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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge
} from '@mui/material';
import {
  Chat,
  Send,
  Message,
  Person,
  Business,
  Engineering,
  Delete,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BoardService } from '../services/boardService';
import { BoardPost, BoardReply } from '../../types';

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<BoardPost | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState<BoardReply[]>([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  // 채팅방 목록 로드 (실시간 업데이트 포함)
  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const chatRoomsData = await BoardService.getPosts('admin-chat');
      
      // 관리자가 아닌 경우 자신의 채팅방만 표시
      const filteredRooms = isAdmin 
        ? chatRoomsData 
        : chatRoomsData.filter(room => room.authorId === user?.id);
      
      setChatRooms(filteredRooms);
    } catch (error) {
      console.error('채팅방 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩 및 실시간 채팅방 업데이트 구독
  useEffect(() => {
    console.log('🔍 AdminChat - useEffect 실행:', user?.id, isAdmin);
    
    // 초기 로딩
    loadChatRooms();
    
    // 실시간 업데이트 구독
    const unsubscribe = BoardService.subscribeToPosts('admin-chat', (posts) => {
      console.log('🔍 AdminChat - 실시간 업데이트:', posts.length, '개의 채팅방');
      const filteredRooms = isAdmin 
        ? posts 
        : posts.filter(room => room.authorId === user?.id);
      setChatRooms(filteredRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, isAdmin]);

  // 채팅방 생성 (사용자용)
  const handleCreateChatRoom = async () => {
    if (!user?.id || !user?.name) return;

    try {
      console.log('🔍 AdminChat - 채팅방 생성 시작:', user.id, user.name, user.role);
      await BoardService.createChatRoom(user.id, user.name, user.role);
      console.log('🔍 AdminChat - 채팅방 생성 완료');
      // 채팅방 목록 새로고침
      await loadChatRooms();
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      alert('채팅방 생성 중 오류가 발생했습니다.');
    }
  };

  // 채팅방 열기
  const handleOpenChat = async (chatRoom: BoardPost) => {
    try {
      console.log('🔍 AdminChat - 채팅방 열기:', chatRoom.id);
      setSelectedChat(chatRoom);
      setChatDialogOpen(true);
      
      // 실시간 구독이 있으므로 초기 로딩은 선택적
      const repliesData = await BoardService.getReplies(chatRoom.id);
      setReplies(repliesData);
      console.log('🔍 AdminChat - 초기 메시지 로드:', repliesData.length, '개');
    } catch (error) {
      console.error('채팅방 열기 실패:', error);
      alert('채팅방을 열 수 없습니다.');
    }
  };

  // 사용자 프로필 보기
  const handleViewProfile = async (userId: string, userRole: string) => {
    try {
      setUserProfileLoading(true);
      setProfileDialogOpen(true);
      
      // 사용자 정보 가져오기 (간단한 정보만 표시)
      let userInfo = null;
      
      if (userRole === 'seller') {
        // 판매자 정보 가져오기
        const { SellerService } = await import('../services/sellerService');
        userInfo = await SellerService.getBasicInfo(userId);
      } else if (userRole === 'contractor') {
        // 시공자 정보 가져오기
        const { ContractorService } = await import('../services/contractorService');
        userInfo = await ContractorService.getBasicInfo(userId);
      }
      
      setSelectedUser(userInfo);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      alert('사용자 정보를 불러올 수 없습니다.');
    } finally {
      setUserProfileLoading(false);
    }
  };

  // 채팅방 삭제
  const handleDeleteChatRoom = async (chatRoom: BoardPost) => {
    // 권한 확인: 관리자가 아니고 자신이 생성한 채팅방이 아닌 경우 삭제 불가
    if (!isAdmin && chatRoom.authorId !== user?.id) {
      alert('해당 채팅방을 삭제할 권한이 없습니다.');
      return;
    }

    if (!window.confirm('정말로 이 채팅방을 삭제하시겠습니까? 삭제된 채팅방은 복구할 수 없습니다.')) {
      return;
    }

    try {
      console.log('🔍 AdminChat - 채팅방 삭제 시작:', chatRoom.id);
      await BoardService.deletePost(chatRoom.id);
      console.log('🔍 AdminChat - 채팅방 삭제 완료');
      alert('채팅방이 삭제되었습니다.');
      
      // 실시간 업데이트가 있으므로 별도로 새로고침할 필요 없음
    } catch (error) {
      console.error('채팅방 삭제 실패:', error);
      alert('채팅방 삭제 중 오류가 발생했습니다.');
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      setSending(true);
      console.log('🔍 AdminChat - 메시지 전송 시작:', message.trim());
      
      await BoardService.createReply({
        postId: selectedChat.id,
        content: message.trim(),
        authorId: user?.id || '',
        authorName: user?.name || '',
        authorRole: user?.role || 'seller',
      });
      
      setMessage('');
      console.log('🔍 AdminChat - 메시지 전송 완료');
      
      // 실시간 업데이트가 있으므로 별도로 새로고침할 필요 없음
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 실시간 메시지 업데이트 구독
  useEffect(() => {
    if (selectedChat) {
      console.log('🔍 AdminChat - 메시지 구독 시작:', selectedChat.id);
      
      const unsubscribe = BoardService.subscribeToReplies(selectedChat.id, (replies) => {
        console.log('🔍 AdminChat - 메시지 업데이트:', replies.length, '개의 메시지');
        setReplies(replies);
      });

      return () => {
        console.log('🔍 AdminChat - 메시지 구독 해제');
        unsubscribe();
      };
    }
  }, [selectedChat?.id]);

  // 역할별 아이콘
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Person color="error" />;
      case 'seller':
        return <Business color="primary" />;
      case 'contractor':
        return <Engineering color="secondary" />;
      default:
        return <Person />;
    }
  };

  // 역할별 색상
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'seller':
        return 'primary';
      case 'contractor':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // 새 메시지 여부 확인 (관리자용)
  const hasNewMessages = (chatRoom: BoardPost) => {
    if (!isAdmin) return false;
    // 마지막 메시지가 있고, 관리자가 보낸 메시지가 아닌 경우
    return chatRoom.lastMessage && chatRoom.lastMessageBy && chatRoom.lastMessageBy !== user?.id;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          관리자와 채팅
        </Typography>
        <Box display="flex" gap={1}>
          <Chip label={`총 ${chatRooms.length}개`} color="primary" />
          {!isAdmin && chatRooms.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Chat />}
              onClick={handleCreateChatRoom}
            >
              채팅방 생성
            </Button>
          )}
        </Box>
      </Box>

      <Card>
        <CardContent>
          {chatRooms.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="textSecondary" mb={2}>
                {isAdmin ? '아직 생성된 채팅방이 없습니다.' : '관리자와의 채팅방을 생성해주세요.'}
              </Typography>
              {!isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<Chat />}
                  onClick={handleCreateChatRoom}
                >
                  채팅방 생성
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>사용자</TableCell>
                    <TableCell>역할</TableCell>
                    <TableCell>마지막 메시지</TableCell>
                    <TableCell>마지막 메시지 시간</TableCell>
                    <TableCell>메시지 수</TableCell>
                    <TableCell>채팅</TableCell>
                    <TableCell>관리</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chatRooms.map((chatRoom) => (
                    <TableRow 
                      key={chatRoom.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                        },
                        backgroundColor: hasNewMessages(chatRoom) ? (theme) => 
                          theme.palette.mode === 'light' ? '#fff3e0' : '#3e2723' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Badge
                            color="error"
                            variant="dot"
                            invisible={!hasNewMessages(chatRoom)}
                          >
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                cursor: isAdmin ? 'pointer' : 'default'
                              }}
                              onClick={() => isAdmin && handleViewProfile(chatRoom.authorId, chatRoom.authorRole)}
                            >
                              {chatRoom.authorName?.charAt(0)}
                            </Avatar>
                          </Badge>
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                cursor: isAdmin ? 'pointer' : 'default',
                                fontWeight: hasNewMessages(chatRoom) ? 'bold' : 'normal'
                              }}
                              onClick={() => isAdmin && handleViewProfile(chatRoom.authorId, chatRoom.authorRole)}
                            >
                              {chatRoom.authorName}
                            </Typography>
                            {isAdmin && (
                              <Tooltip title="프로필 보기">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewProfile(chatRoom.authorId, chatRoom.authorRole)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getRoleIcon(chatRoom.authorRole)}
                          label={chatRoom.authorRole === 'admin' ? '관리자' : 
                                 chatRoom.authorRole === 'seller' ? '판매자' : 
                                 chatRoom.authorRole === 'contractor' ? '시공자' : '사용자'}
                          color={getRoleColor(chatRoom.authorRole)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          noWrap
                          sx={{ 
                            fontWeight: hasNewMessages(chatRoom) ? 'bold' : 'normal',
                            color: hasNewMessages(chatRoom) ? 'primary.main' : 'text.secondary'
                          }}
                        >
                          {chatRoom.lastMessage || '메시지 없음'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {chatRoom.lastMessageAt?.toLocaleString('ko-KR') || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={chatRoom.replyCount} 
                          size="small"
                          color={hasNewMessages(chatRoom) ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="채팅 열기">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenChat(chatRoom)}
                          >
                            <Chat />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="채팅방 삭제">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteChatRoom(chatRoom)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 채팅 대화상자 */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {isAdmin ? selectedChat?.authorName?.charAt(0) : '관'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              {isAdmin ? `${selectedChat?.authorName}님과의 채팅` : '관리자와 채팅'}
            </Box>
            <Chip
              icon={getRoleIcon(isAdmin ? (selectedChat?.authorRole || '') : 'admin')}
              label={isAdmin ? (selectedChat?.authorRole === 'admin' ? '관리자' : 
                     selectedChat?.authorRole === 'seller' ? '판매자' : 
                     selectedChat?.authorRole === 'contractor' ? '시공자' : '사용자') : '관리자'}
              color={getRoleColor(isAdmin ? (selectedChat?.authorRole || '') : 'admin')}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            {/* 메시지 목록 */}
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
              {replies.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="textSecondary">
                    아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {replies.map((reply) => {
                    const isMyMessage = reply.authorId === user?.id;
                    return (
                      <Box
                        key={reply.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            display: 'flex',
                            flexDirection: isMyMessage ? 'row-reverse' : 'row',
                            alignItems: 'flex-end',
                            gap: 1,
                          }}
                        >
                          {!isMyMessage && (
                            <Avatar sx={{ width: 24, height: 24, flexShrink: 0 }}>
                              {reply.authorName?.charAt(0)}
                            </Avatar>
                          )}
                          <Box
                            sx={{
                              backgroundColor: isMyMessage 
                                ? (theme) => theme.palette.primary.main 
                                : (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d',
                              color: isMyMessage ? 'white' : 'inherit',
                              borderRadius: 2,
                              px: 2,
                              py: 1,
                              position: 'relative',
                            }}
                          >
                            {!isMyMessage && (
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Typography variant="caption" fontWeight="bold">
                                  {reply.authorName}
                                </Typography>
                                <Chip
                                  icon={getRoleIcon(reply.authorRole)}
                                  label={reply.authorRole === 'admin' ? '관리자' : 
                                         reply.authorRole === 'seller' ? '판매자' : 
                                         reply.authorRole === 'contractor' ? '시공자' : '사용자'}
                                  color={getRoleColor(reply.authorRole)}
                                  size="small"
                                  sx={{ height: 16, fontSize: '0.7rem' }}
                                />
                              </Box>
                            )}
                            <Typography variant="body2">
                              {reply.content}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7,
                                display: 'block',
                                mt: 0.5,
                                textAlign: isMyMessage ? 'right' : 'left'
                              }}
                            >
                              {reply.createdAt.toLocaleString('ko-KR')}
                            </Typography>
                          </Box>
                          {isMyMessage && (
                            <Avatar sx={{ width: 24, height: 24, flexShrink: 0 }}>
                              {reply.authorName?.charAt(0)}
                            </Avatar>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
            
            {/* 메시지 입력 */}
            <Divider sx={{ mb: 2 }} />
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                placeholder="메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                startIcon={<Send />}
              >
                전송
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 프로필 대화상자 */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
                 <DialogTitle>
           사용자 프로필
         </DialogTitle>
        <DialogContent>
          {userProfileLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : selectedUser ? (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ width: 64, height: 64 }}>
                  {selectedUser.name?.charAt(0) || selectedUser.companyName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.name || selectedUser.companyName}
                  </Typography>
                  <Chip
                    icon={getRoleIcon(selectedUser.role || 'seller')}
                    label={selectedUser.role === 'admin' ? '관리자' : 
                           selectedUser.role === 'seller' ? '판매자' : 
                           selectedUser.role === 'contractor' ? '시공자' : '사용자'}
                    color={getRoleColor(selectedUser.role || 'seller')}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">이메일</Typography>
                  <Typography variant="body2">{selectedUser.email || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">전화번호</Typography>
                  <Typography variant="body2">{selectedUser.phone || '-'}</Typography>
                </Grid>
                {selectedUser.companyName && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">회사명</Typography>
                    <Typography variant="body2">{selectedUser.companyName}</Typography>
                  </Grid>
                )}
                {selectedUser.businessName && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">상호명</Typography>
                    <Typography variant="body2">{selectedUser.businessName}</Typography>
                  </Grid>
                )}
                {selectedUser.businessNumber && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">사업자번호</Typography>
                    <Typography variant="body2">{selectedUser.businessNumber}</Typography>
                  </Grid>
                )}
                {selectedUser.address && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">주소</Typography>
                    <Typography variant="body2">{selectedUser.address}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              사용자 정보를 불러올 수 없습니다.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminChat;
