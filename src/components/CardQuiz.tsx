import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, Grid, LinearProgress, CircularProgress } from '@mui/material';
import { HelpCircle, Image as ImageIcon, FileText, Trophy, Zap, AlertTriangle } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playClick, playCorrect, playIncorrect } from '../utils/sound';

type GameMode = 'image' | 'effect';
type GameState = 'menu' | 'loading' | 'active' | 'answered';
type FeedbackType = 'correct' | 'incorrect' | 'timeout' | null;

export const CardQuiz: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('image');
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentCard, setCurrentCard] = useState<YgoCardData | null>(null);
  const [choices, setChoices] = useState<YgoCardData[]>([]);
  const [cardImage, setCardImage] = useState<string>('');
  
  // Timer & Streaks
  const [timeLeft, setTimeLeft] = useState(15000); // 15 seconds in ms
  const [scoreStreak, setScoreStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(() => {
    return parseInt(localStorage.getItem('ygo_quiz_highest_streak') || '0', 10);
  });
  
  // Quiz evaluation state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load a new question
  const loadQuestion = async (selectedMode: GameMode) => {
    setGameState('loading');
    setSelectedId(null);
    setFeedback(null);
    setTimeLeft(15000);
    setCardImage('');

    try {
      // 1. Fetch 4 random cards (our target and 3 distractors)
      const res = await fetch('/api/booster/draw');
      const json = await res.json();
      const list = json.data as YgoCardData[];
      if (!list || list.length < 4) {
        throw new Error('Not enough cards returned for quiz choices');
      }

      // Pick target (index 0) and options (indices 0, 1, 2, 3)
      const target = list[0];
      setCurrentCard(target);

      // Shuffle choices
      const options = [...list.slice(0, 4)].sort(() => Math.random() - 0.5);
      setChoices(options);

      // Pre-cache image for image mode
      if (selectedMode === 'image') {
        const imgRes = await fetch(`/api/cards/${target.id}/image`);
        const imgData = await imgRes.json();
        setCardImage(imgData.url || `https://images.ygoprodeck.com/images/cards/${target.id}.jpg`);
      }

      setGameState('active');
    } catch (e) {
      console.error('Failed to prepare quiz question:', e);
      setGameState('menu');
    }
  };

  // Start game loop
  useEffect(() => {
    if (gameState === 'active') {
      const startTime = Date.now();
      const duration = 15000;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleTimeout();
        }
      }, 50);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playIncorrect();
    setFeedback('timeout');
    setScoreStreak(0);
    setGameState('answered');
  };

  const handleAnswer = (choiceId: number) => {
    if (gameState !== 'active') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedId(choiceId);
    setGameState('answered');

    const isCorrect = choiceId === currentCard?.id;

    if (isCorrect) {
      playCorrect();
      setFeedback('correct');
      const newStreak = scoreStreak + 1;
      setScoreStreak(newStreak);
      if (newStreak > highestStreak) {
        setHighestStreak(newStreak);
        localStorage.setItem('ygo_quiz_highest_streak', newStreak.toString());
      }
    } else {
      playIncorrect();
      setFeedback('incorrect');
      setScoreStreak(0);
    }
  };

  const handleStartGame = (selectedMode: GameMode) => {
    playClick();
    setMode(selectedMode);
    setScoreStreak(0);
    loadQuestion(selectedMode);
  };

  const handleNextQuestion = () => {
    playClick();
    loadQuestion(mode);
  };

  const handleExitToMenu = () => {
    playClick();
    setGameState('menu');
    setCurrentCard(null);
    setChoices([]);
  };

  // Censor name helper for effect mode
  const getCensoredDesc = (desc: string | undefined, name: string | undefined) => {
    if (!desc) return '';
    if (!name) return desc;
    
    // Replace whole name
    let clean = desc;
    const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedName, 'gi');
    clean = clean.replace(regex, '[REDACTED MONSTER]');

    // Also replace components of the name if they are distinct and long enough (>=4 chars)
    const parts = name.split(/\s+/).filter(p => p.length >= 4 && !['card', 'dragon', 'spell', 'trap', 'monster', 'hero'].includes(p.toLowerCase()));
    for (const part of parts) {
      const partEsc = part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const partRegex = new RegExp(`\\b${partEsc}\\b`, 'gi');
      clean = clean.replace(partRegex, '[REDACTED]');
    }

    return clean;
  };

  // Calculate blur (from 25px at 15s down to 0px at 0s)
  const blurVal = (timeLeft / 15000) * 20;

  return (
    <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
      
      {/* Quiz Header Info */}
      <Paper sx={{ 
        p: 3, 
        width: '100%',
        bgcolor: '#0c0d10', 
        border: '1.5px solid #1f2229', 
        borderRadius: 0,
        backgroundImage: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HelpCircle size={22} style={{ color: '#ffea00', filter: 'drop-shadow(0 0 4px #ffea00)' }} />
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, letterSpacing: '1px', display: 'block' }}>
              QUIZ TERMINAL OVERLAY
            </Typography>
            <Typography variant="caption" sx={{ color: '#5a6273', display: 'block' }}>
              De-scramble card datasets and verify names to bypass network security.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Zap size={16} style={{ color: '#ffea00' }} />
            <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>STREAK</Typography>
            <Typography sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 900, fontSize: '1rem', color: '#ffea00' }}>
              {scoreStreak}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Trophy size={16} style={{ color: '#a6e3a1' }} />
            <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 700 }}>MAX RECORD</Typography>
            <Typography sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 900, fontSize: '1rem', color: '#a6e3a1' }}>
              {highestStreak}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 1. Menu Screen */}
      {gameState === 'menu' && (
        <Paper sx={{ 
          p: 6, 
          width: '100%', 
          maxWidth: '600px', 
          bgcolor: '#0c0d10', 
          border: '1.5px solid #1f2229',
          borderRadius: 0,
          textAlign: 'center',
          backgroundImage: 'none',
          mt: 2
        }}>
          <Typography variant="h5" sx={{ fontWeight: 950, color: '#ffffff', mb: 1, letterSpacing: '1.5px', fontFamily: '"Orbitron", sans-serif' }}>
            SELECT QUIZ DECODING PROTOCOL
          </Typography>
          <Typography variant="body2" sx={{ color: '#5a6273', mb: 5, maxWidth: '400px', mx: 'auto' }}>
            Choose a neural decryption mode. You will have 15 seconds to evaluate the scrambled indicators and select the correct registry.
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button 
                fullWidth
                variant="outlined" 
                color="primary"
                onClick={() => handleStartGame('image')}
                sx={{ 
                  py: 4, 
                  borderRadius: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  border: '1.5px solid',
                  '&:hover': {
                    bgcolor: 'rgba(255,234,0,0.02)',
                    boxShadow: '0 0 15px rgba(255, 234, 0, 0.1)'
                  }
                }}
              >
                <ImageIcon size={32} />
                <span style={{ fontWeight: 900, fontSize: '0.85rem', fontFamily: '"Orbitron", sans-serif', letterSpacing: '1px' }}>HOLOGRAPHIC DE-BLUR</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'none', color: '#5a6273' }}>Scrambled pixels decay over time</span>
              </Button>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button 
                fullWidth
                variant="outlined" 
                color="primary"
                onClick={() => handleStartGame('effect')}
                sx={{ 
                  py: 4, 
                  borderRadius: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1.5,
                  border: '1.5px solid',
                  '&:hover': {
                    bgcolor: 'rgba(255,234,0,0.02)',
                    boxShadow: '0 0 15px rgba(255, 234, 0, 0.1)'
                  }
                }}
              >
                <FileText size={32} />
                <span style={{ fontWeight: 900, fontSize: '0.85rem', fontFamily: '"Orbitron", sans-serif', letterSpacing: '1px' }}>EFFECT LOGIC CENSOR</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'none', color: '#5a6273' }}>Analyze card effect description</span>
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 2. Loading Screen */}
      {gameState === 'loading' && (
        <Paper sx={{ 
          p: 8, 
          width: '100%', 
          maxWidth: '600px', 
          bgcolor: '#0c0d10', 
          border: '1.5px solid #1f2229',
          borderRadius: 0,
          textAlign: 'center',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          mt: 2
        }}>
          <CircularProgress color="primary" />
          <Typography variant="caption" sx={{ color: '#5a6273', fontFamily: '"Orbitron", sans-serif', letterSpacing: '1px' }}>
            TRANSMITTING NEXT LOGICAL OVERLAY...
          </Typography>
        </Paper>
      )}

      {/* 3. Active & Answered Game Arena */}
      {(gameState === 'active' || gameState === 'answered') && currentCard && (
        <Paper sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: '800px', 
          bgcolor: '#0c0d10', 
          border: '1.5px solid',
          borderColor: 
            feedback === 'correct' ? '#a6e3a1' : 
            feedback === 'incorrect' || feedback === 'timeout' ? '#ff5555' : 
            '#1f2229',
          borderRadius: 0,
          backgroundImage: 'none',
          position: 'relative',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: 
            feedback === 'correct' ? '0 0 20px rgba(166,227,161,0.15)' : 
            feedback === 'incorrect' || feedback === 'timeout' ? '0 0 20px rgba(255,85,85,0.15)' : 
            'none'
        }}>
          {/* Top Progress countdown */}
          <Box sx={{ width: '100%', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#5a6273', fontWeight: 800 }}>TIMER DECAY</Typography>
              <Typography sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.85rem', fontWeight: 900, color: timeLeft < 4000 ? '#ff5555' : '#ffffff' }}>
                {(timeLeft / 1000).toFixed(1)}s
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(timeLeft / 15000) * 100} 
              sx={{
                height: 6,
                bgcolor: '#15181e',
                '& .MuiLinearProgress-bar': {
                  bgcolor: timeLeft < 4000 ? '#ff5555' : 'primary.main',
                  transition: 'none' // disable slow animation for real-time reactivity
                }
              }}
            />
          </Box>

          {/* Arena Columns */}
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            {/* Clue Panel (Left) */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              {mode === 'image' ? (
                <Box sx={{ position: 'relative', width: '100%', maxWidth: '240px', aspectRatio: '2/3', border: '1.5px solid #1f2229' }}>
                  {cardImage ? (
                    <img 
                      src={cardImage} 
                      alt="Scrambled Card" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: gameState === 'active' ? `blur(${blurVal}px) contrast(1.1)` : 'none',
                        transition: 'filter 0.1s linear'
                      }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#050506' }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </Box>
              ) : (
                <Paper sx={{ 
                  p: 3, 
                  bgcolor: '#050506', 
                  border: '1.5px solid #1f2229', 
                  borderRadius: 0,
                  width: '100%',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  backgroundImage: 'none'
                }}>
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 900, display: 'block', mb: 1, letterSpacing: '0.5px' }}>
                    [LOGICAL DIRECTIVE EFFECT RECORD]
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#ffffff', 
                      lineHeight: 1.6, 
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '0.85rem',
                      textAlign: 'justify' 
                    }}
                  >
                    "{getCensoredDesc(currentCard.desc, currentCard.name)}"
                  </Typography>
                  <Box sx={{ mt: 2.5, display: 'flex', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#5a6273', display: 'block' }}>TYPE</Typography>
                      <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>{currentCard.type.replace(' Monster', '').toUpperCase()}</Typography>
                    </Box>
                    {currentCard.attribute && (
                      <Box>
                        <Typography variant="caption" sx={{ color: '#5a6273', display: 'block' }}>ATTR</Typography>
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>{currentCard.attribute}</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Grid>

            {/* Answer Options Panel (Right) */}
            <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="overline" sx={{ color: '#5a6273', fontWeight: 800, display: 'block', letterSpacing: '1px' }}>
                OPTIONS // CHOOSE THE CORRECT METADATA REGISTRY:
              </Typography>

              {choices.map((choice) => {
                const isSelected = selectedId === choice.id;
                const isCorrect = choice.id === currentCard.id;

                let btnColor: 'inherit' | 'primary' | 'success' | 'error' = 'inherit';
                let borderStyle = '1.5px solid #1f2229';

                if (gameState === 'answered') {
                  if (isCorrect) {
                    btnColor = 'success';
                    borderStyle = '1.5px solid #a6e3a1';
                  } else if (isSelected) {
                    btnColor = 'error';
                    borderStyle = '1.5px solid #ff5555';
                  } else {
                    borderStyle = '1.5px solid #15181e';
                  }
                }

                return (
                  <Button
                    key={choice.id}
                    fullWidth
                    disabled={gameState === 'answered'}
                    onClick={() => handleAnswer(choice.id)}
                    color={btnColor}
                    sx={{
                      py: 1.8,
                      px: 3,
                      borderRadius: 0,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      bgcolor: isSelected ? 'rgba(255,234,0,0.03)' : '#050506',
                      border: borderStyle,
                      color: gameState === 'answered' ? (isCorrect ? '#a6e3a1' : isSelected ? '#ff5555' : '#5a6273') : '#ffffff',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(255,234,0,0.05)',
                        color: 'primary.main'
                      },
                      transition: 'all 0.15s',
                      textTransform: 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 850, fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem' }}>
                        {choice.name.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#5a6273', fontSize: '0.65rem', fontWeight: 700 }}>
                        {choice.type.replace(' Monster', '').toUpperCase()}
                      </Typography>
                    </Box>
                  </Button>
                );
              })}
            </Grid>
          </Grid>

          {/* Feedback & Navigation section */}
          {gameState === 'answered' && (
            <Box sx={{ 
              mt: 4, 
              pt: 3, 
              borderTop: '1.5px solid #1f2229', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle size={20} style={{ color: feedback === 'correct' ? '#a6e3a1' : '#ff5555' }} />
                <Typography sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Orbitron", sans-serif',
                  color: feedback === 'correct' ? '#a6e3a1' : '#ff5555'
                }}>
                  {feedback === 'correct' && 'VERIFICATION APPROVED!'}
                  {feedback === 'incorrect' && 'VERIFICATION DENIED! INCORRECT INDEX.'}
                  {feedback === 'timeout' && 'VERIFICATION TIMEOUT! DECAY THRESHOLD EXCEEDED.'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={handleExitToMenu}
                  sx={{ borderRadius: 0, borderColor: '#1f2229', color: '#5a6273' }}
                >
                  MENU
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleNextQuestion}
                  sx={{ borderRadius: 0 }}
                >
                  NEXT DECRYPT
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};
