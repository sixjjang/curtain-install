import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Rating,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  Star,
  ThumbUp,
  ThumbDown,
  Send
} from '@mui/icons-material';
import { SatisfactionService } from '../../shared/services/satisfactionService';
import { SatisfactionSurvey } from '../../types';

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'yesno' | 'text';
  isRequired: boolean;
  category: string;
}

interface SurveyResponse {
  questionId: string;
  answer: string | number | boolean;
  category?: string;
}

const SimpleSatisfactionSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [survey, setSurvey] = useState<SatisfactionSurvey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!surveyId) {
        setError('잘못된 링크입니다.');
        setLoading(false);
        return;
      }

      try {
        // 만족도 조사 정보 조회
        const surveyData = await SatisfactionService.getSurvey(surveyId);
        if (!surveyData) {
          setError('만족도 조사를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 토큰이 있는 경우 토큰 검증
        if (token && surveyData.accessToken && token !== surveyData.accessToken) {
          setError('잘못된 접근입니다. 올바른 링크를 사용해주세요.');
          setLoading(false);
          return;
        }

        if (surveyData.isCompleted) {
          setError('이미 완료된 만족도 조사입니다.');
          setLoading(false);
          return;
        }

        setSurvey(surveyData);

        // 만족도 조사 문항 조회
        const questionsData = await SatisfactionService.getSurveyQuestions();
        setQuestions(questionsData);

      } catch (error) {
        console.error('만족도 조사 데이터 로드 실패:', error);
        setError('만족도 조사를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [surveyId]);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateResponses = (): boolean => {
    for (const question of questions) {
      if (question.isRequired && !responses[question.id]) {
        setError(`"${question.question}" 문항에 답변해주세요.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 응답 데이터 변환
      const surveyResponses: SurveyResponse[] = questions.map(question => ({
        questionId: question.id,
        answer: responses[question.id] || '',
        category: question.category
      }));

      await SatisfactionService.submitSurvey(surveyId!, surveyResponses);
      
      setSuccess(true);
      
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('만족도 조사 제출 실패:', error);
      setError('만족도 조사 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'rating':
        return (
          <Box sx={{ mt: 2 }}>
            <Rating
              value={value || 0}
              onChange={(_, newValue) => handleResponseChange(question.id, newValue || 0)}
              size="large"
              sx={{ fontSize: '2rem' }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {value ? `${value}점` : '평점을 선택해주세요'}
            </Typography>
          </Box>
        );

      case 'yesno':
        return (
          <RadioGroup
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value === 'true')}
            sx={{ mt: 1 }}
          >
            <FormControlLabel
              value="true"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <ThumbUp color="success" />
                  <Typography>예</Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="false"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <ThumbDown color="error" />
                  <Typography>아니오</Typography>
                </Box>
              }
            />
          </RadioGroup>
        );

      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="의견을 자유롭게 작성해주세요..."
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            sx={{ mt: 2 }}
          />
        );

      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'punctuality': return 'primary';
      case 'communication': return 'secondary';
      case 'professionalism': return 'success';
      case 'service': return 'warning';
      case 'general': return 'info';
      default: return 'default';
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

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                fullWidth
              >
                메인으로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Card>
            <CardContent>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                만족도 조사 완료!
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                소중한 의견을 주셔서 감사합니다
              </Typography>
              <Typography variant="body1" color="textSecondary">
                고객님의 의견을 바탕으로 더 나은 서비스를 제공하겠습니다.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" align="center" gutterBottom>
            🏠 시공 서비스 만족도 조사
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
            ※ 로그인 없이 바로 참여 가능합니다
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary">
            소중한 의견을 바탕으로 더 나은 서비스를 제공하겠습니다
          </Typography>
        </Paper>

        <Card>
          <CardContent>
            <Box component="form">
              {questions.map((question, index) => (
                <Box key={question.id} sx={{ mb: 4 }}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                    <Typography variant="h6" component="span">
                      {index + 1}.
                    </Typography>
                    <Typography variant="h6" component="span">
                      {question.question}
                    </Typography>
                    {question.isRequired && (
                      <Chip label="필수" size="small" color="error" />
                    )}
                  </Box>
                  
                  <Chip
                    label={getCategoryLabel(question.category)}
                    color={getCategoryColor(question.category) as any}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {renderQuestion(question)}

                  {index < questions.length - 1 && (
                    <Divider sx={{ mt: 3 }} />
                  )}
                </Box>
              ))}

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {submitting ? '제출 중...' : '만족도 조사 제출'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SimpleSatisfactionSurvey;
