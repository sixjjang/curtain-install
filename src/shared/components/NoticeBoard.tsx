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
  Divider
} from '@mui/material';
import {
  Visibility,
  PushPin,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BoardService } from '../services/boardService';
import { BoardPost } from '../../types';

const NoticeBoard: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<BoardPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // 공지사항 상세 보기
  const handleViewNotice = async (notice: BoardPost) => {
    try {
      // 조회수 증가
      await BoardService.incrementViewCount(notice.id);
      
      // 최신 데이터 다시 로드
      const updatedNotice = await BoardService.getPost(notice.id);
      if (updatedNotice) {
        setSelectedNotice(updatedNotice);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    }
  };

  // 대화상자 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedNotice(null);
    loadNotices(); // 목록 새로고침
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
          공지사항
        </Typography>
        <Chip label={`총 ${notices.length}개`} color="primary" />
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
                </TableRow>
              </TableHead>
              <TableBody>
                {notices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        등록된 공지사항이 없습니다.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  notices.map((notice) => (
                    <TableRow 
                      key={notice.id}
                      sx={{
                        backgroundColor: notice.isPinned ? 
                          (theme) => theme.palette.mode === 'light' ? '#fff3e0' : '#2d2b1b' : 'inherit',
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2d2d2d'
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {notice.isPinned && <PushPin color="warning" />}
                          <Typography 
                            variant="body2" 
                            fontWeight={notice.isPinned ? 'bold' : 'normal'}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleViewNotice(notice)}
                          >
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
                        <Tooltip title="상세보기">
                          <IconButton
                            size="small"
                            onClick={() => handleViewNotice(notice)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 공지사항 상세 보기 대화상자 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedNotice?.isPinned && <PushPin color="warning" />}
            <Typography variant="h6">
              {selectedNotice?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotice && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="textSecondary">
                  작성자: {selectedNotice.authorName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  작성일: {selectedNotice.createdAt.toLocaleDateString('ko-KR')}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {selectedNotice.content}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  조회수: {selectedNotice.viewCount}
                </Typography>
                <Chip
                  label={selectedNotice.isPinned ? '고정 공지' : '일반 공지'}
                  color={selectedNotice.isPinned ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoticeBoard;
