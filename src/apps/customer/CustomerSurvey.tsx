import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert
} from '@mui/material';
import { Star } from '@mui/icons-material';

const CustomerSurvey: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [professionalismRating, setProfessionalismRating] = useState<number | null>(null);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [punctualityRating, setPunctualityRating] = useState<number | null>(null);
  const [communicationRating, setCommunicationRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기서 평가 데이터를 서버로 전송
    console.log('평가 제출:', {
      jobId,
      overallRating,
      professionalismRating,
      qualityRating,
      punctualityRating,
      communicationRating,
      comment,
      recommendation
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            평가가 성공적으로 제출되었습니다!
          </Alert>
          <Typography variant="h6" color="textSecondary">
            소중한 의견을 주셔서 감사합니다.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          시공 평가 설문
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
          작업 ID: {jobId}
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>
                전반적인 만족도
              </Typography>
              <Rating
                name="overall"
                value={overallRating}
                onChange={(event, newValue) => setOverallRating(newValue)}
                size="large"
                sx={{ mb: 3 }}
              />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    전문성
                  </Typography>
                  <Rating
                    name="professionalism"
                    value={professionalismRating}
                    onChange={(event, newValue) => setProfessionalismRating(newValue)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    시공 품질
                  </Typography>
                  <Rating
                    name="quality"
                    value={qualityRating}
                    onChange={(event, newValue) => setQualityRating(newValue)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    시간 준수
                  </Typography>
                  <Rating
                    name="punctuality"
                    value={punctualityRating}
                    onChange={(event, newValue) => setPunctualityRating(newValue)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    의사소통
                  </Typography>
                  <Rating
                    name="communication"
                    value={communicationRating}
                    onChange={(event, newValue) => setCommunicationRating(newValue)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                추가 의견
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="시공 과정에서 느낀 점이나 개선사항을 자유롭게 작성해주세요."
                sx={{ mb: 3 }}
              />

              <Typography variant="h6" gutterBottom>
                추천 여부
              </Typography>
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <RadioGroup
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="추천합니다" />
                  <FormControlLabel value="no" control={<Radio />} label="추천하지 않습니다" />
                  <FormControlLabel value="neutral" control={<Radio />} label="보통입니다" />
                </RadioGroup>
              </FormControl>

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!overallRating}
                >
                  평가 제출
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default CustomerSurvey;
