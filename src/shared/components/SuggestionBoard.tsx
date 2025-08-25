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
  Alert
} from '@mui/material';
import {
  Add,
  Visibility,
  Reply,
  CheckCircle,
  Schedule,
  Warning,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BoardService } from '../services/boardService';
import { BoardPost, BoardReply } from '../../types';

const SuggestionBoard: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<BoardPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [writeDialogOpen, setWriteDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [replies, setReplies] = useState<BoardReply[]>([]);

  const isAdmin = user?.role === 'admin';
  const canWrite = user?.role === 'seller' || user?.role === 'contractor';

  // 건의사항 목록 로드
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const suggestionsData = await BoardService.getPosts('suggestion');
      
      // 관리자는 모든 건의사항을 볼 수 있고, 
      // 판매자/시공자는 자신이 작성한 건의사항만 볼 수 있음
      const filteredSuggestions = isAdmin 
        ? suggestionsData 
        : suggestionsData.filter(suggestion => suggestion.authorId === user?.id);
      
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('건의사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  // 건의사항 상세 보기
  const handleViewSuggestion = async (suggestion: BoardPost) => {
    try {
      // 권한 확인: 관리자가 아니고 자신이 작성한 건의사항이 아닌 경우 접근 불가
      if (!isAdmin && suggestion.authorId !== user?.id) {
        alert('해당 건의사항에 접근할 권한이 없습니다.');
        return;
      }
      
      // 조회수 증가
      await BoardService.incrementViewCount(suggestion.id);
      
      // 최신 데이터 다시 로드
      const updatedSuggestion = await BoardService.getPost(suggestion.id);
      if (updatedSuggestion) {
        setSelectedSuggestion(updatedSuggestion);
        
        // 댓글 로드
        const repliesData = await BoardService.getReplies(suggestion.id);
        setReplies(repliesData);
        
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('건의사항 조회 실패:', error);
    }
  };

  // 새 건의사항 작성
  const handleWriteSuggestion = () => {
    setTitle('');
    setContent('');
    setWriteDialogOpen(true);
  };

  // 건의사항 저장
  const handleSaveSuggestion = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      await BoardService.createPost({
        title: title.trim(),
        content: content.trim(),
        authorId: user?.id || '',
        authorName: user?.name || '',
        authorRole: user?.role || 'seller',
        boardType: 'suggestion',
        category: 'suggestion',
        status: 'pending',
      });
      
      setWriteDialogOpen(false);
      loadSuggestions();
    } catch (error) {
      console.error('건의사항 저장 실패:', error);
      alert('건의사항 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 관리자 답변 작성
  const handleReplySuggestion = () => {
    setReplyContent('');
    setReplyDialogOpen(true);
  };

  // 관리자 답변 저장
  const handleSaveReply = async () => {
    if (!replyContent.trim() || !selectedSuggestion) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      await BoardService.createAdminReply(
        selectedSuggestion.id,
        replyContent.trim(),
        user?.id || '',
        user?.name || '관리자'
      );
      
      setReplyDialogOpen(false);
      handleViewSuggestion(selectedSuggestion); // 상세보기 새로고침
      loadSuggestions(); // 목록 새로고침
    } catch (error) {
      console.error('답변 저장 실패:', error);
      alert('답변 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in-progress':
        return <Schedule color="warning" />;
      case 'pending':
        return <Warning color="error" />;
      default:
        return <Warning color="error" />;
    }
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'error';
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '답변완료';
      case 'in-progress':
        return '검토중';
      case 'pending':
        return '대기중';
      default:
        return '대기중';
    }
  };

  // 건의사항 삭제
  const handleDeleteSuggestion = async (suggestion: BoardPost) => {
    if (!isAdmin) {
      alert('관리자만 삭제할 수 있습니다.');
      return;
    }

    if (!window.confirm('정말로 이 건의사항을 삭제하시겠습니까? 삭제된 건의사항은 복구할 수 없습니다.')) {
      return;
    }

    try {
      await BoardService.deletePost(suggestion.id);
      loadSuggestions();
      alert('건의사항이 삭제되었습니다.');
    } catch (error) {
      console.error('건의사항 삭제 실패:', error);
      alert('건의사항 삭제 중 오류가 발생했습니다.');
    }
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
          {isAdmin ? '건의사항 관리' : '건의하기'}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip label={`총 ${suggestions.length}개`} color="primary" />
          {canWrite && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleWriteSuggestion}
            >
              새 건의 작성
            </Button>
          )}
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>작성자</TableCell>
                  <TableCell>작성일</TableCell>
                  <TableCell>조회수</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>보기</TableCell>
                  {isAdmin && <TableCell>관리</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {suggestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        {isAdmin 
                          ? '등록된 건의사항이 없습니다.' 
                          : '작성한 건의사항이 없습니다. 새 건의를 작성해보세요!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  suggestions.map((suggestion) => (
                    <TableRow 
                      key={suggestion.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleViewSuggestion(suggestion)}
                        >
                          {suggestion.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{suggestion.authorName}</TableCell>
                      <TableCell>
                        {suggestion.createdAt.toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>{suggestion.viewCount}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(suggestion.status || 'pending')}
                          label={getStatusText(suggestion.status || 'pending')}
                          color={getStatusColor(suggestion.status || 'pending')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSuggestion(suggestion)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Tooltip title="건의사항 삭제">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSuggestion(suggestion)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 건의사항 상세 보기 대화상자 */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            {selectedSuggestion?.title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedSuggestion && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="textSecondary">
                  작성자: {selectedSuggestion.authorName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  작성일: {selectedSuggestion.createdAt.toLocaleDateString('ko-KR')}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {selectedSuggestion.content}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* 관리자 답변 */}
              {selectedSuggestion.adminReply && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      관리자 답변
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {selectedSuggestion.adminReply}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      답변일: {selectedSuggestion.adminReplyAt?.toLocaleDateString('ko-KR')}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* 댓글 목록 */}
              {replies.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    댓글 ({replies.length}개)
                  </Typography>
                                     {replies.map((reply) => (
                     <Box 
                       key={reply.id} 
                       sx={{ 
                         mb: 1, 
                         p: 1, 
                         bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.800',
                         borderRadius: 1,
                         border: (theme) => `1px solid ${theme.palette.divider}`
                       }}
                     >
                       <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                         <Typography variant="body2" fontWeight="bold">
                           {reply.authorName}
                         </Typography>
                         <Typography variant="caption" color="textSecondary">
                           {reply.createdAt.toLocaleDateString('ko-KR')}
                         </Typography>
                       </Box>
                       <Typography variant="body2">
                         {reply.content}
                       </Typography>
                     </Box>
                   ))}
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  조회수: {selectedSuggestion.viewCount}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedSuggestion.status || 'pending')}
                  label={getStatusText(selectedSuggestion.status || 'pending')}
                  color={getStatusColor(selectedSuggestion.status || 'pending')}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isAdmin && selectedSuggestion?.status !== 'completed' && (
            <Button
              variant="contained"
              startIcon={<Reply />}
              onClick={handleReplySuggestion}
            >
              답변하기
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 새 건의사항 작성 대화상자 */}
      <Dialog
        open={writeDialogOpen}
        onClose={() => setWriteDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>새 건의사항 작성</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="건의 내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={8}
              placeholder="시스템 개선이나 운영에 대한 건의사항을 작성해주세요."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWriteDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSaveSuggestion}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? '저장 중...' : '작성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 관리자 답변 작성 대화상자 */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>관리자 답변 작성</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="답변 내용"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              multiline
              rows={6}
              placeholder="건의사항에 대한 답변을 작성해주세요."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSaveReply}
            disabled={saving || !replyContent.trim()}
          >
            {saving ? '저장 중...' : '답변'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuggestionBoard;
