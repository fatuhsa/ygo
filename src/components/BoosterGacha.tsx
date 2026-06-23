import React, { useState } from 'react';
import { Box, Typography, Button, Grid, CircularProgress, Paper, CardMedia, Skeleton } from '@mui/material';
import { Sparkles, Eye } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playClick, playHover, playCardDraw } from '../utils/sound';
import { CardDetailsModal } from './CardDetailsModal';

export const BoosterGacha: React.FC = () => {
  const [cards, setCards] = useState<YgoCardData[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [cardImages, setCardImages] = useState<{ [id: number]: string }>({});
  const [selectedCard, setSelectedCard] = useState<YgoCardData | null>(null);

  const drawBooster = async () => {
    playClick();
    setLoading(true);
    setCards([]);
    setFlipped(Array(9).fill(false));
    setCardImages({});
    
    try {
      const res = await fetch('/api/booster/draw');
      const json = await res.json();
      const drawnCards = json.data || [];
      setCards(drawnCards);

      // Pre-fetch cached images in parallel
      await Promise.all(
        drawnCards.map(async (card: YgoCardData) => {
          try {
            const imgRes = await fetch(`/api/cards/${card.id}/image`);
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              if (imgData.url) {
                setCardImages(prev => ({ ...prev, [card.id]: imgData.url }));
              }
            }
          } catch (e) {
            console.error('Failed to load booster image:', e);
          }
        })
      );
    } catch (err) {
      console.error('Failed to fetch booster pack:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (index: number) => {
    if (flipped[index]) {
      // If already flipped, click opens card details
      playClick();
      setSelectedCard(cards[index]);
    } else {
      // Flip the card
      playCardDraw();
      const nextFlipped = [...flipped];
      nextFlipped[index] = true;
      setFlipped(nextFlipped);
    }
  };

  // Check if card is considered "Rare" (Atk >= 2500, or a Special/Extra Deck Monster)
  const isRare = (card: YgoCardData) => {
    const atk = card.atk || 0;
    const isSpecialType = 
      card.type.includes('Fusion') || 
      card.type.includes('Synchro') || 
      card.type.includes('XYZ') || 
      card.type.includes('Link');
    return atk >= 2500 || isSpecialType;
  };

  return (
    <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
      
      {/* Control Panel */}
      <Paper sx={{ 
        p: 4, 
        width: '100%', 
        bgcolor: '#0c0d10', 
        border: '1.5px solid #1f2229',
        borderRadius: 0,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        backgroundImage: 'none',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '2px',
          bgcolor: 'primary.main',
          boxShadow: '0 0 10px #ffea00'
        }
      }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>
          BOOSTER DECK GENERATOR
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: '500px', mb: 1 }}>
          Initialize neural grid transmission to generate 9 random cards from the local offline database index. Click cards to activate their holographic data overlays.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={drawBooster} 
          disabled={loading}
          size="large"
          sx={{ px: 5, py: 1.8, fontSize: '0.9rem', fontWeight: 900 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} color="inherit" />
              <span>TRANSMITTING DATA...</span>
            </Box>
          ) : 'LOAD PROTOCOL: OPEN BOOSTER'}
        </Button>
      </Paper>

      {/* Grid of Cards */}
      {cards.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 1, width: '100%', maxWidth: '1200px', justifyContent: 'center' }}>
          {cards.map((card, idx) => {
            const flippedState = flipped[idx];
            const rareStatus = isRare(card);
            const imageSrc = cardImages[card.id] || '';

            return (
              <Grid key={card.id} size={{ xs: 6, sm: 4, md: 4 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box 
                  onClick={() => handleCardClick(idx)}
                  onMouseEnter={() => !flippedState && playHover()}
                  sx={{
                    perspective: '1000px',
                    width: '100%',
                    maxWidth: '280px',
                    aspectRatio: '2/3',
                    cursor: 'pointer',
                  }}
                >
                  <Box sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: flippedState ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}>
                    {/* Back of Card (Face Down) */}
                    <Paper sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      bgcolor: '#070708',
                      border: '1.5px solid #1f2229',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: 'none',
                      gap: 1.5,
                      p: 2,
                      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 15px rgba(255, 234, 0, 0.15), inset 0 0 20px rgba(255, 234, 0, 0.05)',
                        '& .MuiTypography-root': { color: 'primary.main' }
                      }
                    }}>
                      <Box sx={{ 
                        border: '1px solid #1f2229', 
                        width: '45px', 
                        height: '45px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#4d5360',
                        bgcolor: '#0c0d10',
                        position: 'relative'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 950, fontSize: '0.9rem', letterSpacing: 1 }}>YGO</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', fontWeight: 800, fontSize: '0.55rem', letterSpacing: '1.5px', lineHeight: 1.2 }}>
                          SECURE GRID
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#3f4554', fontWeight: 700, fontSize: '0.5rem', letterSpacing: '0.5px' }}>
                          CLICK TO DECRYPT
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Front of Card (Revealed) */}
                    <Paper sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      bgcolor: '#0c0d10',
                      border: rareStatus ? '2px solid #ffea00' : '1.5px solid #1f2229',
                      borderRadius: 0,
                      backgroundImage: 'none',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: rareStatus 
                        ? '0 0 20px rgba(255,234,0,0.3), inset 0 0 10px rgba(255,234,0,0.1)' 
                        : '0 5px 15px rgba(0,0,0,0.5)',
                      '&:hover': {
                        transform: 'rotateY(180deg) scale(1.03)',
                        boxShadow: rareStatus 
                          ? '0 0 25px rgba(255,234,0,0.4), inset 0 0 15px rgba(255,234,0,0.15)' 
                          : '0 8px 20px rgba(0,0,0,0.6)',
                        '& .details-reveal-btn': {
                          opacity: 1
                        }
                      }
                    }}>
                      {/* Image Frame */}
                      <Box sx={{ 
                        flexGrow: 1, 
                        bgcolor: '#050506', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 0.5,
                        position: 'relative'
                      }}>
                        {imageSrc ? (
                          <CardMedia 
                            component="img" 
                            image={imageSrc} 
                            alt={card.name} 
                            sx={{ height: '100%', width: '100%', objectFit: 'contain' }} 
                          />
                        ) : (
                          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ bgcolor: 'rgba(255,234,0,0.03)' }} />
                        )}
                        
                        {/* Hover Overlay Button */}
                        <Box 
                          className="details-reveal-btn"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            bgcolor: 'rgba(5,5,6,0.8)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1
                          }}
                        >
                          <Eye size={24} color="#ffea00" />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 1 }}>
                            EXPAND DATA
                          </Typography>
                        </Box>

                        {/* Rare Indicator Badge */}
                        {rareStatus && (
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8, 
                            bgcolor: 'primary.main', 
                            color: '#000', 
                            px: 1, 
                            py: 0.2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            boxShadow: '0 0 10px #ffea00'
                          }}>
                            <Sparkles size={10} />
                            <Typography sx={{ fontWeight: 900, fontSize: '0.55rem', fontFamily: '"Orbitron", sans-serif' }}>RARE</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Details Box */}
                      <Box sx={{ p: 1.2, borderTop: '1px solid #1f2229', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 800, 
                            lineHeight: 1.2, 
                            color: 'text.primary',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.75rem',
                            fontFamily: '"Outfit", sans-serif'
                          }}
                        >
                          {card.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ 
                            bgcolor: 'rgba(255,234,0,0.03)', 
                            border: '1px solid rgba(255,234,0,0.15)', 
                            px: 0.6, 
                            py: 0.1, 
                            fontSize: '0.55rem', 
                            fontWeight: 800,
                            fontFamily: '"Orbitron", sans-serif',
                            color: 'primary.main'
                          }}>
                            {card.type.replace(' Monster', '')}
                          </Box>
                          {card.atk !== undefined && (
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary', fontFamily: '"Orbitron", sans-serif' }}>
                              ATK: <span style={{ color: '#ffea00' }}>{card.atk}</span>
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Details Dialog */}
      <CardDetailsModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </Box>
  );
};
