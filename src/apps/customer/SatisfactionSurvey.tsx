import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Rating,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import { SatisfactionService } from '../../shared/services/satisfactionService';
import { SatisfactionSurvey, SurveyResponse } from '../../types';

const CustomerSatisfactionSurvey: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<SatisfactionSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    overallRating: 0,
    categories: {
      workQuality: 0,
      punctuality: 0,
      communication: 0,
      cleanliness: 0,
      professionalism: 0
    },
    comment: ''
  });

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;
      
      try {
        setLoading(true);
        setError(null);
        const surveyData = await SatisfactionService.getSurvey(surveyId);
        
        if (!surveyData) {
          setError('만족도 조사를 찾을 수 없습니다.');
          return;
        }
        
        if (surveyData.isCompleted) {
          setError('이미 완료된 만족도 조사입니다.');
          return;
        }
        
        setSurvey(surveyData);
      } catch (error) {
        console.error('만족도 조사 가져오기 실패:', error);
        setError('만족도 조사를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleRatingChange = (category: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
  };

  const handleOverallRatingChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      overallRating: value
    }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      comment: e.target.value
    }));
  };

  const handleSubmit = async () => {
    if (!survey || !surveyId) return;
    
    // 필수 항목 검증
    if (formData.overallRating === 0) {
      setError('전체 만족도를 평가해주세요.');
      return;
    }
    
    if (Object.values(formData.categories).some(rating => rating === 0)) {
      setError('모든 항목을 평가해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // formData를 SurveyResponse[] 형식으로 변환
      const responses = [
        {
          questionId: 'overall',
          question: '전체 만족도',
          answer: formData.overallRating.toString(),
          type: 'rating'
        },
        {
          questionId: 'workQuality',
          question: '시공 품질',
          answer: formData.categories.workQuality.toString(),
          type: 'rating'
        },
        {
          questionId: 'punctuality',
          question: '시간 준수',
          answer: formData.categories.punctuality.toString(),
          type: 'rating'
        },
        {
          questionId: 'communication',
          question: '의사소통',
          answer: formData.categories.communication.toString(),
          type: 'rating'
        },
        {
          questionId: 'cleanliness',
          question: '청결도',
          answer: formData.categories.cleanliness.toString(),
          type: 'rating'
        },
        {
          questionId: 'professionalism',
          question: '전문성',
          answer: formData.categories.professionalism.toString(),
          type: 'rating'
        },
        {
          questionId: 'comment',
          question: '추가 의견',
          answer: formData.comment,
          type: 'text'
        }
      ];
      
      await SatisfactionService.submitSurvey(surveyId, responses);
      
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box maxWidth="600px" mx="auto" mt={4}>
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
    );
  }

  if (success) {
    return (
      <Box maxWidth="600px" mx="auto" mt={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              만족도 조사가 완료되었습니다!
            </Typography>
            <Typography variant="body1" color="textSecondary">
              소중한 의견 감사합니다. 더 나은 서비스를 제공하겠습니다.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              3초 후 메인 페이지로 이동합니다...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto" mt={4} mb={4}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            시공 만족도 조사
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
            시공 서비스에 대한 솔직한 의견을 들려주세요.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 전체 만족도 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              전체 만족도
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Rating
                value={formData.overallRating}
                onChange={(_, value) => handleOverallRatingChange(value || 0)}
                size="large"
                icon={<Star sx={{ fontSize: 40 }} />}
              />
              <Typography variant="body1">
                {formData.overallRating > 0 ? `${formData.overallRating}점` : '평가해주세요'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 세부 항목 평가 */}
          <Typography variant="h6" gutterBottom>
            세부 항목 평가
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  시공 품질
                </Typography>
                <Rating
                  value={formData.categories.workQuality}
                  onChange={(_, value) => handleRatingChange('workQuality', value || 0)}
                  size="medium"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  시간 준수
                </Typography>
                <Rating
                  value={formData.categories.punctuality}
                  onChange={(_, value) => handleRatingChange('punctuality', value || 0)}
                  size="medium"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  의사소통
                </Typography>
                <Rating
                  value={formData.categories.communication}
                  onChange={(_, value) => handleRatingChange('communication', value || 0)}
                  size="medium"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  청결도
                </Typography>
                <Rating
                  value={formData.categories.cleanliness}
                  onChange={(_, value) => handleRatingChange('cleanliness', value || 0)}
                  size="medium"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  전문성
                </Typography>
                <Rating
                  value={formData.categories.professionalism}
                  onChange={(_, value) => handleRatingChange('professionalism', value || 0)}
                  size="medium"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* 추가 의견 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              추가 의견 (선택사항)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="시공 서비스에 대한 추가 의견이나 개선사항을 자유롭게 작성해주세요."
              value={formData.comment}
              onChange={handleCommentChange}
            />
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ flex: 1 }}
            >
              취소
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ flex: 1 }}
            >
              {submitting ? '제출 중...' : '만족도 조사 제출'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerSatisfactionSurvey;

