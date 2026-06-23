import React, { useEffect, useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Skeleton, CardActionArea, IconButton } from '@mui/material';
import { Star, ArrowRightLeft } from 'lucide-react';
import type { YgoCardData } from '../types';
import { playClick, playHover } from '../utils/sound';

interface YgoCardProps {
  card: YgoCardData;
  onClick: (card: YgoCardData) => void;
  isFavorited?: boolean;
  onAddToCompare?: (card: YgoCardData) => void;
  isComparing?: boolean;
}

export const YgoCard: React.FC<YgoCardProps> = ({ 
  card, 
  onClick, 
  isFavorited = false,
  onAddToCompare,
  isComparing = false
}) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Parallax tilt states
  const [tilt, setTilt] = useState({ x: 0, y: 0, px: 0.5, py: 0.5 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadImage() {
      try {
        const response = await fetch(`/api/cards/${card.id}/image`);
        if (response.ok) {
          const data = await response.json();
          if (data.url && isMounted) {
            setLocalUrl(data.url);
          }
        }
      } catch (err) {
        console.error('Error loading image:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadImage();
    return () => { isMounted = false; };
  }, [card.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    
    // Tilt angle calculations (-12 to +12 degrees)
    const tiltX = (py - 0.5) * 24;
    const tiltY = (0.5 - px) * 24;
    setTilt({ x: tiltX, y: tiltY, px, py });
  };

  const handleMouseEnter = () => {
    setHovered(true);
    playHover();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0, px: 0.5, py: 0.5 });
  };

  return (
    <Card 
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        bgcolor: '#0c0d10',
        border: isComparing ? '1.5px solid #ffea00' : '1.5px solid #1f2229',
        borderRadius: 0,
        overflow: 'visible', // allows rotation to scale out nicely
        boxShadow: hovered 
          ? '0 12px 24px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 234, 0, 0.15)' 
          : '0 4px 10px rgba(0, 0, 0, 0.4)',
        transformStyle: 'preserve-3d',
        transform: hovered 
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.03, 1.03, 1.03)` 
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: hovered ? 'transform 0.05s ease-out, border-color 0.2s' : 'transform 0.3s ease-in-out, border-color 0.2s',
        backgroundImage: 'none'
      }}
    >
      <CardActionArea 
        onClick={() => { playClick(); onClick(card); }} 
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ 
          width: '100%',
          aspectRatio: '2/3',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 1.5,
          bgcolor: '#050506',
          borderBottom: '1.5px solid #1f2229',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" sx={{ bgcolor: '#0c0d10' }} />
          ) : (
            <CardMedia 
              component="img" 
              image={localUrl || ''} 
              alt={card.name} 
              sx={{ 
                height: '100%', 
                width: '100%',
                objectFit: 'contain' 
              }} 
            />
          )}

          {/* Holographic foil overlay */}
          {hovered && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2,
              pointerEvents: 'none',
              mixBlendMode: 'color-dodge',
              background: `radial-gradient(circle at ${tilt.px * 100}% ${tilt.py * 100}%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 0, 128, 0.15) 25%, rgba(0, 255, 255, 0.15) 50%, rgba(255, 255, 0, 0.15) 75%, transparent 100%)`,
              opacity: 0.75,
              transition: 'opacity 0.25s'
            }} />
          )}

          {/* Quick comparison add button */}
          {onAddToCompare && (
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                playClick();
                onAddToCompare(card);
              }}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 5,
                bgcolor: isComparing ? 'primary.main' : 'rgba(5, 5, 6, 0.85)',
                border: '1.5px solid',
                borderColor: isComparing ? 'primary.main' : '#1f2229',
                color: isComparing ? '#000000' : '#ffea00',
                borderRadius: 0,
                p: 0.6,
                '&:hover': {
                  bgcolor: isComparing ? 'primary.main' : 'rgba(255, 234, 0, 0.15)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <ArrowRightLeft size={13} />
            </IconButton>
          )}

          {isFavorited && (
            <Box sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              color: 'primary.main',
              display: 'flex',
              filter: 'drop-shadow(0 0 3px #ffea00)',
              zIndex: 5
            }}>
              <Star size={16} fill="#ffea00" />
            </Box>
          )}
        </Box>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 850, 
              lineHeight: 1.2,
              color: '#ffffff',
              wordBreak: 'break-word',
              fontSize: '0.825rem',
              fontFamily: '"Outfit", sans-serif',
              letterSpacing: '0.2px'
            }}
          >
            {card.name}
          </Typography>
          <Box sx={{ display: 'flex', mt: 0.5 }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255, 234, 0, 0.04)',
                border: '1px solid rgba(255, 234, 0, 0.25)',
                px: 0.8,
                py: 0.2,
                display: 'inline-block',
                color: 'primary.main',
                fontSize: '0.625rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: '"Orbitron", sans-serif'
              }}
            >
              {card.type.replace(' Monster', '')}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
