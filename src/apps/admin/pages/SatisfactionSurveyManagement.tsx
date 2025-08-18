import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase/config';

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'yesno' | 'text';
  isRequired: boolean;
  isActive: boolean;
  order: number;
  category: 'punctuality' | 'communication' | 'professionalism' | 'service' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

const SatisfactionSurveyManagement: React.FC = () => {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 기본 문항들
  const defaultQuestions: Omit<SurveyQuestion, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      question: '시공자가 약속한 시간에 맞게 도착했나요?',
      type: 'yesno',
      isRequired: true,
      isActive: true,
      order: 1,
      category: 'punctuality'
    },
    {
      question: '늦었다면 사전연락을 받으셨나요?',
      type: 'yesno',
      isRequired: false,
      isActive: true,
      order: 2,
      category: 'punctuality'
    },
    {
      question: '시공자가 별도의 명함을 고객님께 드렸어요?',
      type: 'yesno',
      isRequired: true,
      isActive: true,
      order: 3,
      category: 'professionalism'
    },
    {
      question: '시공자로부터 불쾌한 일을 겪으셨어요?',
      type: 'yesno',
      isRequired: true,
      isActive: true,
      order: 4,
      category: 'service'
    },
    {
      question: '전체적인 시공 서비스에 만족하시나요?',
      type: 'rating',
      isRequired: true,
      isActive: true,
      order: 5,
      category: 'general'
    },
    {
      question: '앞으로 개선되었으면 하는 부분을 말씀해주세요. 큰도움이 됩니다.',
      type: 'text',
      isRequired: false,
      isActive: true,
      order: 6,
      category: 'general'
    }
  ];

  // 문항 로드
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsRef = collection(db, 'surveyQuestions');
      const q = query(questionsRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // 기본 문항 생성
        await createDefaultQuestions();
      } else {
        const questionsData: SurveyQuestion[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as SurveyQuestion[];
        
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error('문항 로드 실패:', error);
      setError('문항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기본 문항 생성
  const createDefaultQuestions = async () => {
    try {
      const questionsRef = collection(db, 'surveyQuestions');
      const newQuestions: SurveyQuestion[] = [];
      
      for (const question of defaultQuestions) {
        const docRef = await addDoc(questionsRef, {
          ...question,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        newQuestions.push({
          id: docRef.id,
          ...question,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      setQuestions(newQuestions);
      setSuccess('기본 문항이 생성되었습니다.');
    } catch (error) {
      console.error('기본 문항 생성 실패:', error);
      setError('기본 문항 생성에 실패했습니다.');
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // 문항 추가/수정
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      if (editingQuestion.id) {
        // 수정
        const questionRef = doc(db, 'surveyQuestions', editingQuestion.id);
        await updateDoc(questionRef, {
          ...editingQuestion,
          updatedAt: new Date()
        });
        
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestion.id ? { ...editingQuestion, updatedAt: new Date() } : q
        ));
      } else {
        // 추가
        const questionsRef = collection(db, 'surveyQuestions');
        const docRef = await addDoc(questionsRef, {
          ...editingQuestion,
          order: questions.length + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        const newQuestion = {
          ...editingQuestion,
          id: docRef.id,
          order: questions.length + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setQuestions(prev => [...prev, newQuestion]);
      }
      
      setDialogOpen(false);
      setEditingQuestion(null);
      setSuccess(editingQuestion.id ? '문항이 수정되었습니다.' : '문항이 추가되었습니다.');
    } catch (error) {
      console.error('문항 저장 실패:', error);
      setError('문항 저장에 실패했습니다.');
    }
  };

  // 문항 삭제
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('이 문항을 삭제하시겠습니까?')) return;
    
    try {
      await deleteDoc(doc(db, 'surveyQuestions', questionId));
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setSuccess('문항이 삭제되었습니다.');
    } catch (error) {
      console.error('문항 삭제 실패:', error);
      setError('문항 삭제에 실패했습니다.');
    }
  };

  // 문항 활성화/비활성화
  const handleToggleActive = async (questionId: string, isActive: boolean) => {
    try {
      const questionRef = doc(db, 'surveyQuestions', questionId);
      await updateDoc(questionRef, {
        isActive,
        updatedAt: new Date()
      });
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, isActive, updatedAt: new Date() } : q
      ));
      
      setSuccess(`문항이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('문항 상태 변경 실패:', error);
      setError('문항 상태 변경에 실패했습니다.');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'punctuality': return '시간 준수';
      case 'communication': return '소통';
      case 'professionalism': return '전문성';
      case 'service': return '서비스';
      case 'general': return '일반';
      default: return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rating': return '평점';
      case 'yesno': return '예/아니오';
      case 'text': return '텍스트';
      default: return type;
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
        <Typography variant="h4" gutterBottom>
          만족도 조사 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingQuestion({
              id: '',
              question: '',
              type: 'rating',
              isRequired: true,
              isActive: true,
              order: questions.length + 1,
              category: 'general',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            setDialogOpen(true);
          }}
        >
          문항 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            만족도 조사 문항 ({questions.length}개)
          </Typography>
          
          <List>
            {questions.map((question, index) => (
              <React.Fragment key={question.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1">
                          {index + 1}. {question.question}
                        </Typography>
                        {!question.isActive && (
                          <Chip label="비활성" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={getCategoryLabel(question.category)} 
                          size="small" 
                          sx={{ mr: 1 }} 
                        />
                        <Chip 
                          label={getTypeLabel(question.type)} 
                          size="small" 
                          sx={{ mr: 1 }} 
                        />
                        {question.isRequired && (
                          <Chip label="필수" size="small" color="primary" />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(question.id, !question.isActive)}
                      >
                        {question.isActive ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingQuestion(question);
                          setDialogOpen(true);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < questions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* 문항 추가/수정 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingQuestion(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion?.id ? '문항 수정' : '문항 추가'}
        </DialogTitle>
        <DialogContent>
          {editingQuestion && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="문항 내용"
                  multiline
                  rows={3}
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    question: e.target.value
                  })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="카테고리"
                  value={editingQuestion.category}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    category: e.target.value as any
                  })}
                >
                  <option value="punctuality">시간 준수</option>
                  <option value="communication">소통</option>
                  <option value="professionalism">전문성</option>
                  <option value="service">서비스</option>
                  <option value="general">일반</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="문항 유형"
                  value={editingQuestion.type}
                  onChange={(e) => setEditingQuestion({
                    ...editingQuestion,
                    type: e.target.value as any
                  })}
                >
                  <option value="rating">평점</option>
                  <option value="yesno">예/아니오</option>
                  <option value="text">텍스트</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingQuestion.isRequired}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        isRequired: e.target.checked
                      })}
                    />
                  }
                  label="필수 문항"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditingQuestion(null);
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuestion}
            disabled={!editingQuestion?.question.trim()}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SatisfactionSurveyManagement;
