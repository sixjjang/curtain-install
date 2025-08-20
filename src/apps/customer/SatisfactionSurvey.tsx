import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Star,
  CheckCircle,
  ThumbUp,
  ThumbDown,
  Send
} from '@mui/icons-material';
import { JobService } from '../../shared/services/jobService';
import { ConstructionJob } from '../../types';

const SatisfactionSurvey: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<ConstructionJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 만족도 평가 데이터
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [serviceRating, setServiceRating] = useState<number | null>(null);
  const [timelinessRating, setTimelinessRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [recommendToOthers, setRecommendToOthers] = useState<boolean | null>(null);

  useEffect(() => {
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      const jobData = await JobService.getJobById(jobId!);
      if (!jobData) {
        setError('작업 정보를 찾을 수 없습니다.');
        return;
      }
      setJob(jobData);
    } catch (error) {
      console.error('작업 정보 로드 실패:', error);
      setError('작업 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!job || !overallRating) {
      setError('전체 만족도를 평가해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 만족도 평가 데이터 계산
      const averageRating = Math.round(
        (overallRating + (qualityRating || overallRating) + (serviceRating || overallRating) + (timelinessRating || overallRating)) / 4
      );

      // 작업 상태 업데이트 (만족도 평가 완료)
      await JobService.updateJobStatus(job.id, 'completed', undefined, undefined, {
        customerSatisfaction: averageRating,
        satisfactionComment: comment,
        satisfactionSubmittedAt: new Date(),
        recommendToOthers: recommendToOthers || false
      });

      setSubmitted(true);
    } catch (error) {
      console.error('만족도 평가 제출 실패:', error);
      setError('만족도 평가 제출에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !job) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              만족도 평가 완료!
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              소중한 의견을 주셔서 감사합니다.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              더 나은 서비스를 제공하기 위해 노력하겠습니다.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        🏠 시공 만족도 평가
      </Typography>

      {job && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {job.title}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              주소: {job.address}
            </Typography>
            {job.scheduledDate && (
              <Typography variant="body2" color="textSecondary">
                시공일: {formatDate(job.scheduledDate)} {formatTime(job.scheduledDate)}
              </Typography>
            )}
            <Chip 
              label="시공 완료" 
              color="success" 
              size="small" 
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            시공 품질에 대한 만족도를 평가해 주세요
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* 전체 만족도 */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  전체 만족도 *
                </Typography>
                <Rating
                  value={overallRating}
                  onChange={(_, newValue) => setOverallRating(newValue)}
                  size="large"
                  sx={{ fontSize: '2rem' }}
                />
                {overallRating && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {overallRating === 5 ? '매우 만족' : 
                     overallRating === 4 ? '만족' : 
                     overallRating === 3 ? '보통' : 
                     overallRating === 2 ? '불만족' : '매우 불만족'}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* 세부 평가 */}
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  시공 품질
                </Typography>
                <Rating
                  value={qualityRating}
                  onChange={(_, newValue) => setQualityRating(newValue)}
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  서비스 태도
                </Typography>
                <Rating
                  value={serviceRating}
                  onChange={(_, newValue) => setServiceRating(newValue)}
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  시간 준수
                </Typography>
                <Rating
                  value={timelinessRating}
                  onChange={(_, newValue) => setTimelinessRating(newValue)}
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* 추천 여부 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                다른 사람에게 추천하시겠습니까?
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant={recommendToOthers === true ? "contained" : "outlined"}
                  color="success"
                  startIcon={<ThumbUp />}
                  onClick={() => setRecommendToOthers(true)}
                >
                  추천합니다
                </Button>
                <Button
                  variant={recommendToOthers === false ? "contained" : "outlined"}
                  color="error"
                  startIcon={<ThumbDown />}
                  onClick={() => setRecommendToOthers(false)}
                >
                  추천하지 않습니다
                </Button>
              </Box>
            </Grid>

            {/* 추가 의견 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="추가 의견 (선택사항)"
                placeholder="시공 과정에서 특별히 좋았던 점이나 개선이 필요한 점을 자유롭게 작성해 주세요."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* 제출 버튼 */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={!overallRating || submitting}
                  sx={{ 
                    minWidth: 200,
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {submitting ? '제출 중...' : '만족도 평가 제출'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SatisfactionSurvey;

