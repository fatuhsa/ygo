import React, { useEffect, useState } from 'react';
import { Grid, Container, Typography } from '@mui/material';
import { YgoCard } from './YgoCard';

export const CardList: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?num=20&offset=0')
      .then(res => res.json())
      .then(data => setCards(data.data || []));
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Yu-Gi-Oh! Explorer</Typography>
      <Grid container spacing={3}>
        {cards.map(card => (
          <Grid item key={card.id} xs={12} sm={6} md={4} lg={3}>
            <YgoCard card={card} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};
