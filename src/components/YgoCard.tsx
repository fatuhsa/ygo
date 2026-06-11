import React, { useEffect, useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Skeleton, CardActionArea } from '@mui/material';
import { supabase } from '../supabaseClient';
import type { YgoCardData } from '../types';

interface YgoCardProps {
  card: YgoCardData;
  onClick: (card: YgoCardData) => void;
}

export const YgoCard: React.FC<YgoCardProps> = ({ card, onClick }) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadImage() {
      try {
        const { data } = await supabase.from('cards').select('local_image_url').eq('id', card.id).maybeSingle();
        if (data?.local_image_url) {
          if (isMounted) { setLocalUrl(data.local_image_url); setLoading(false); }
          return;
        }
        const { data: fnData, error: fnError } = await supabase.functions.invoke('cache-ygo-image', { body: { cardId: card.id } });
        if (!fnError && fnData?.url && isMounted) {
          setLocalUrl(fnData.url);
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

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'background.paper', 
      transition: 'all 0.2s ease-in-out', 
      '&:hover': { 
        transform: 'translateY(-4px)',
        borderColor: 'primary.main',
        boxShadow: (theme) => `0 0 10px ${theme.palette.primary.main}44`
      } 
    }}>
      <CardActionArea onClick={() => onClick(card)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <Box sx={{ 
          width: '100%',
          aspectRatio: '2/3',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          p: 1,
          bgcolor: '#000'
        }}>
          {loading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
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
        </Box>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flexGrow: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 800, 
              lineHeight: 1.1,
              mb: 0.2,
              color: 'text.primary',
              // Removed clamping to show full title
              wordBreak: 'break-word',
              fontSize: '0.85rem'
            }}
          >
            {card.name}
          </Typography>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              fontSize: '0.75rem',
              letterSpacing: '0.5px'
            }}
          >
            {card.type}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
