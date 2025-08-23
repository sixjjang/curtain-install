import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  Star,
  Work,
  EmojiEvents,
  CheckCircle,
  Lock
} from '@mui/icons-material';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { LevelService } from '../../../shared/services/levelService';
import { ContractorInfo, LevelSystem } from '../../../types';

const LevelProgress: React.FC = () => {
  const { user } = useAuth();
  const contractor = user?.contractor;
  const [levelInfo, setLevelInfo] = useState<LevelSystem | null>(null);
  const [nextLevelInfo, setNextLevelInfo] = useState<LevelSystem | null>(null);

  useEffect(() => {
    const fetchLevelInfo = async () => {
      if (contractor) {
        try {
          const levels = await LevelService.getAllLevels();
          const currentLevelData = levels.find(l => l.level === (contractor.level || 1));
          const nextLevelData = levels.find(l => l.level === (contractor.level || 1) + 1);
          
          if (currentLevelData) {
            setLevelInfo({
              level: currentLevelData.level,
              experience: currentLevelData.requirements?.minExperience || 0,
              experienceToNext: nextLevelData?.requirements?.minExperience || 0,
              title: currentLevelData.name,
              benefits: currentLevelData.benefits || [],
              hourlyRateMultiplier: currentLevelData.hourlyRateMultiplier || 1,
              commissionRate: currentLevelData.commissionRate || 0.1
            });
          }
          
          if (nextLevelData) {
            setNextLevelInfo({
              level: nextLevelData.level,
              experience: nextLevelData.requirements?.minExperience || 0,
              experienceToNext: 0,
              title: nextLevelData.name,
              benefits: nextLevelData.benefits || [],
              hourlyRateMultiplier: nextLevelData.hourlyRateMultiplier || 1,
              commissionRate: nextLevelData.commissionRate || 0.1
            });
          }
        } catch (error) {
          console.error('레벨 정보 가져오기 실패:', error);
        }
      }
    };
    
    fetchLevelInfo();
  }, [contractor]);

  if (!contractor) {
    return (
      <Box>
        <Typography>사용자 정보를 불러오는 중...</Typography>
      </Box>
    );
  }

  if (!levelInfo) {
    return (
      <Box>
        <Typography>레벨 정보를 불러오는 중...</Typography>
      </Box>
    );
  }

  // experience가 string이므로 숫자로 변환 (예: "5년" -> 5)
  const experienceValue = typeof contractor.experience === 'string' 
    ? parseInt(contractor.experience.replace(/[^0-9]/g, '')) || 0
    : contractor.experience || 0;

  const progressPercentage = contractor.level < 100 && nextLevelInfo
    ? ((experienceValue - levelInfo.experience) / (nextLevelInfo.experience - levelInfo.experience)) * 100
    : 100;

  const getLevelColor = (level: number) => {
    if (level >= 90) return 'error';
    if (level >= 70) return 'warning';
    if (level >= 50) return 'info';
    if (level >= 30) return 'success';
    if (level >= 10) return 'primary';
    return 'default';
  };

  const getLevelIcon = (level: number) => {
    if (level >= 90) return <EmojiEvents />;
    if (level >= 70) return <Star />;
    if (level >= 50) return <TrendingUp />;
    if (level >= 30) return <CheckCircle />;
    if (level >= 10) return <Work />;
    return <Work />;
  };

  return (
    <Box>

      {/* 현재 레벨 카드 */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
              {getLevelIcon(contractor.level)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {levelInfo.title}
              </Typography>
              <Typography variant="body1">
                레벨 {contractor.level} • 경험치 {experienceValue}점
              </Typography>
            </Box>
          </Box>

          {contractor.level < 100 && nextLevelInfo && (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  다음 레벨까지: {nextLevelInfo.experience - experienceValue}점
                </Typography>
                <Typography variant="body2">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }} 
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* 통계 카드들 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h6">{contractor?.totalJobs || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    총 시공 건수
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6">{Number(contractor.rating || 0).toFixed(1)}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    평균 평점
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {contractor.serviceAreas?.length || 0}개
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    시공 가능지역
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {(levelInfo.commissionRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    수수료율
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 현재 레벨 혜택 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                현재 레벨 혜택
              </Typography>
              <List>
                {levelInfo.benefits.map((benefit, index) => (
                  <ListItem key={index} dense>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 다음 레벨 정보 */}
        {nextLevelInfo && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  다음 레벨 정보
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'grey.300', mr: 2 }}>
                    <Lock />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {nextLevelInfo.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      필요 경험치: {nextLevelInfo.experience}점
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  다음 레벨 혜택:
                </Typography>
                <List dense>
                  {nextLevelInfo.benefits.map((benefit, index) => (
                    <ListItem key={index} dense>
                      <ListItemIcon>
                        <Lock color="disabled" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit} 
                        sx={{ color: 'text.disabled' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 레벨별 수수료 정보 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            레벨별 수수료 정보
          </Typography>
          <Grid container spacing={2}>
            {[1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((level) => {
              // 임시로 기본값 사용 (실제로는 레벨 데이터를 가져와야 함)
              const info = {
                commissionRate: 0.1,
                title: `레벨 ${level}`
              };
              const isCurrentLevel = level === contractor.level;
              const isUnlocked = level <= contractor.level;
              
              return (
                <Grid item xs={6} sm={4} md={2} key={level}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      border: isCurrentLevel ? 2 : 1,
                      borderColor: isCurrentLevel ? 'primary.main' : 'divider',
                      bgcolor: isCurrentLevel ? 'primary.light' : 'background.paper',
                      opacity: isUnlocked ? 1 : 0.5
                    }}
                  >
                    <Chip 
                      label={`Lv.${level}`}
                      color={isCurrentLevel ? 'primary' : getLevelColor(level)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {(info.commissionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {info.title}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LevelProgress;
