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
  FormControlLabel,
  Switch,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PushPin,
  PushPinOutlined
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { BoardService } from '../../../shared/services/boardService';
import { BoardPost, BoardType } from '../../../types';

const NoticeManagement: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<BoardPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // 공지사항 목록 로드
  const loadNotices = async () => {
    try {
      setLoading(true);
      const noticesData = await BoardService.getPosts('notice');
      setNotices(noticesData);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // 새 공지사항 작성
  const handleCreateNotice = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setDialogOpen(true);
  };

  // 공지사항 수정
  const handleEditNotice = (notice: BoardPost) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setIsPinned(notice.isPinned || false);
    setDialogOpen(true);
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (noticeId: string) => {
    if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      try {
        await BoardService.deletePost(noticeId);
        loadNotices();
      } catch (error) {
        console.error('공지사항 삭제 실패:', error);
        alert('공지사항 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 공지사항 저장
  const handleSaveNotice = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      if (editingNotice) {
        // 수정
        await BoardService.updatePost(editingNotice.id, {
          title: title.trim(),
          content: content.trim(),
          isPinned,
        });
      } else {
        // 새로 작성
        await BoardService.createPost({
          title: title.trim(),
          content: content.trim(),
          authorId: user?.id || '',
          authorName: user?.name || '관리자',
          authorRole: 'admin',
          boardType: 'notice',
          category: 'notice',
          isPinned,
        });
      }
      
      setDialogOpen(false);
      loadNotices();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 대화상자 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
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
          공지사항 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateNotice}
        >
          새 공지사항 작성
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            공지사항 목록 ({notices.length}개)
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>제목</TableCell>
                  <TableCell>작성자</TableCell>
                  <TableCell>작성일</TableCell>
                  <TableCell>조회수</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow 
                    key={notice.id}
                    sx={{
                      backgroundColor: notice.isPinned ? 
                        (theme) => theme.palette.mode === 'light' ? '#fff3e0' : '#2d2b1b' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {notice.isPinned && <PushPin color="warning" />}
                        <Typography variant="body2" fontWeight={notice.isPinned ? 'bold' : 'normal'}>
                          {notice.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{notice.authorName}</TableCell>
                    <TableCell>
                      {notice.createdAt.toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>{notice.viewCount}</TableCell>
                    <TableCell>
                      <Chip
                        label={notice.isPinned ? '고정' : '일반'}
                        color={notice.isPinned ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="수정">
                          <IconButton
                            size="small"
                            onClick={() => handleEditNotice(notice)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteNotice(notice.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 공지사항 작성/수정 대화상자 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
        </DialogTitle>
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
              label="내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              rows={8}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
              }
              label="공지사항 고정"
            />
            {isPinned && (
              <Alert severity="info" sx={{ mt: 1 }}>
                고정된 공지사항은 목록 최상단에 표시됩니다.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            variant="contained"
            onClick={handleSaveNotice}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? '저장 중...' : (editingNotice ? '수정' : '작성')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoticeManagement;
