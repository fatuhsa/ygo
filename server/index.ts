import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure directories exist
const DATA_DIR = path.resolve('data');
const IMAGES_DIR = path.resolve(DATA_DIR, 'images');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Initialize SQLite DB
const db = new Database(path.resolve(DATA_DIR, 'ygo.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    local_image_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS card_metadata (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    desc TEXT,
    atk INTEGER,
    def INTEGER,
    level INTEGER,
    race TEXT,
    attribute TEXT,
    linkval INTEGER,
    linkmarkers TEXT,
    prices_json TEXT,
    archetype TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    card_id INTEGER PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS price_history (
    card_id INTEGER,
    price_tcg REAL,
    price_cm REAL,
    date TEXT,
    PRIMARY KEY (card_id, date)
  );

  CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id INTEGER,
    card_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (deck_id, card_id),
    FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
  );
`);

// Insert default starter deck if empty
try {
  const countDecks = db.prepare('SELECT COUNT(*) as count FROM decks').get() as { count: number };
  if (countDecks.count === 0) {
    db.prepare("INSERT INTO decks (name) VALUES ('Championship Starter Deck')").run();
  }
} catch (err) {
  console.error('Failed to create default starter deck:', err);
}

app.use(cors());
app.use(express.json());

// Serve static images from data/images
app.use('/images', express.static(IMAGES_DIR));

// 1. Database Background Sync
const insertMetadata = db.prepare(`
  INSERT OR REPLACE INTO card_metadata (
    id, name, type, desc, atk, def, level, race, attribute, linkval, linkmarkers, prices_json, archetype
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

async function syncCardMetadata() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM card_metadata');
    const result = countStmt.get() as { count: number };
    if (result && result.count > 0) {
      console.log('Database already populated with card metadata. Skipping sync.');
      return;
    }

    console.log('Database empty. Starting background sync of card metadata from YGOPRODeck...');
    const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    if (!res.ok) {
      throw new Error(`Failed to fetch card metadata: status ${res.status}`);
    }
    const body = await res.json() as { data: any[] };
    const cards = body.data || [];
    console.log(`Fetched ${cards.length} cards. Inserting into SQLite database...`);

    // Insert in a transaction for speed
    const insertTransaction = db.transaction((cardsList) => {
      for (const card of cardsList) {
        insertMetadata.run(
          card.id,
          card.name,
          card.type,
          card.desc || '',
          card.atk !== undefined ? card.atk : null,
          card.def !== undefined ? card.def : null,
          card.level !== undefined ? card.level : null,
          card.race || '',
          card.attribute || null,
          card.linkval !== undefined ? card.linkval : null,
          card.linkmarkers ? card.linkmarkers.join(',') : null,
          JSON.stringify(card.card_prices || []),
          card.archetype || null
        );
      }
    });

    const start = Date.now();
    insertTransaction(cards);
    console.log(`Successfully synced ${cards.length} cards in ${((Date.now() - start)/1000).toFixed(2)}s.`);
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// 2. Offline Card Search Endpoint
app.get('/api/cards', (req, res) => {
  const { fname, archetype, type, attribute, level, limit = 20, offset = 0 } = req.query;
  
  const parsedLimit = parseInt(limit as string, 10);
  const parsedOffset = parseInt(offset as string, 10);

  let query = 'SELECT * FROM card_metadata WHERE 1=1';
  const params: any[] = [];

  if (fname) {
    query += ' AND name LIKE ?';
    params.push(`%${fname}%`);
  }
  if (archetype) {
    query += ' AND archetype = ?';
    params.push(archetype);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (attribute) {
    query += ' AND attribute = ?';
    params.push(attribute);
  }
  if (level) {
    query += ' AND level = ?';
    params.push(parseInt(level as string, 10));
  }

  // Apply order and pagination
  query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
  
  try {
    const stmt = db.prepare(query);
    const rows = stmt.all(...params, parsedLimit, parsedOffset) as any[];

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      desc: row.desc,
      atk: row.atk !== null ? row.atk : undefined,
      def: row.def !== null ? row.def : undefined,
      level: row.level !== null ? row.level : undefined,
      race: row.race,
      attribute: row.attribute !== null ? row.attribute : undefined,
      linkval: row.linkval !== null ? row.linkval : undefined,
      linkmarkers: row.linkmarkers ? row.linkmarkers.split(',') : undefined,
      card_prices: JSON.parse(row.prices_json || '[]'),
      card_images: [
        {
          id: row.id,
          image_url: `https://images.ygoprodeck.com/images/cards/${row.id}.jpg`,
          image_url_small: `https://images.ygoprodeck.com/images/cards_small/${row.id}.jpg`,
          image_url_cropped: `https://images.ygoprodeck.com/images/cards_cropped/${row.id}.jpg`,
        }
      ]
    }));

    return res.json({ data });
  } catch (error: any) {
    console.error('Database search error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Image Caching Endpoint
app.get('/api/cards/:id/image', async (req, res) => {
  const cardIdStr = req.params.id;
  const cardId = parseInt(cardIdStr, 10);
  if (isNaN(cardId)) {
    return res.status(400).json({ error: 'Invalid card ID' });
  }

  try {
    // Check SQLite cache
    const stmt = db.prepare('SELECT local_image_url FROM cards WHERE id = ?');
    const existing = stmt.get(cardId) as { local_image_url: string } | undefined;

    if (existing) {
      return res.json({ url: existing.local_image_url });
    }

    // Download from YGOPRODeck
    const externalImageUrl = `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
    const response = await fetch(externalImageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch card image from YGOPRODeck: status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save image locally
    const localFileName = `${cardId}.jpg`;
    const localFilePath = path.join(IMAGES_DIR, localFileName);
    await fs.promises.writeFile(localFilePath, buffer);

    const localImageUrl = `/images/${localFileName}`;

    // Save metadata in SQLite
    const insertStmt = db.prepare('INSERT INTO cards (id, local_image_url) VALUES (?, ?)');
    insertStmt.run(cardId, localImageUrl);

    return res.json({ url: localImageUrl });
  } catch (error: any) {
    console.error(`Error caching card image ${cardId}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Favorites Endpoints
app.get('/api/favorites', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM card_metadata 
      WHERE id IN (SELECT card_id FROM favorites)
      ORDER BY name ASC
    `).all() as any[];

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      desc: row.desc,
      atk: row.atk !== null ? row.atk : undefined,
      def: row.def !== null ? row.def : undefined,
      level: row.level !== null ? row.level : undefined,
      race: row.race,
      attribute: row.attribute !== null ? row.attribute : undefined,
      linkval: row.linkval !== null ? row.linkval : undefined,
      linkmarkers: row.linkmarkers ? row.linkmarkers.split(',') : undefined,
      card_prices: JSON.parse(row.prices_json || '[]'),
      card_images: [
        {
          id: row.id,
          image_url: `https://images.ygoprodeck.com/images/cards/${row.id}.jpg`,
          image_url_small: `https://images.ygoprodeck.com/images/cards_small/${row.id}.jpg`,
          image_url_cropped: `https://images.ygoprodeck.com/images/cards_cropped/${row.id}.jpg`,
        }
      ]
    }));

    return res.json({ data });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/favorites/toggle', (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: 'Missing cardId' });
  }

  try {
    const checkStmt = db.prepare('SELECT 1 FROM favorites WHERE card_id = ?');
    const exists = checkStmt.get(cardId);

    if (exists) {
      db.prepare('DELETE FROM favorites WHERE card_id = ?').run(cardId);
      return res.json({ favorited: false });
    } else {
      db.prepare('INSERT INTO favorites (card_id) VALUES (?)').run(cardId);
      return res.json({ favorited: true });
    }
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/favorites/:id', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  try {
    const exists = db.prepare('SELECT 1 FROM favorites WHERE card_id = ?').get(cardId);
    return res.json({ favorited: !!exists });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. Booster Pack Gacha Endpoint
app.get('/api/booster/draw', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM card_metadata 
      ORDER BY RANDOM() 
      LIMIT 9
    `).all() as any[];

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      desc: row.desc,
      atk: row.atk !== null ? row.atk : undefined,
      def: row.def !== null ? row.def : undefined,
      level: row.level !== null ? row.level : undefined,
      race: row.race,
      attribute: row.attribute !== null ? row.attribute : undefined,
      linkval: row.linkval !== null ? row.linkval : undefined,
      linkmarkers: row.linkmarkers ? row.linkmarkers.split(',') : undefined,
      card_prices: JSON.parse(row.prices_json || '[]'),
      card_images: [
        {
          id: row.id,
          image_url: `https://images.ygoprodeck.com/images/cards/${row.id}.jpg`,
          image_url_small: `https://images.ygoprodeck.com/images/cards_small/${row.id}.jpg`,
          image_url_cropped: `https://images.ygoprodeck.com/images/cards_cropped/${row.id}.jpg`,
        }
      ]
    }));

    return res.json({ data });
  } catch (error: any) {
    console.error('Error drawing booster pack:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Price Tracking & Historical Ticker Endpoint
app.get('/api/cards/:id/price-history', (req, res) => {
  const cardId = parseInt(req.params.id, 10);
  if (isNaN(cardId)) {
    return res.status(400).json({ error: 'Invalid card ID' });
  }

  try {
    // Get price from metadata
    const cardInfo = db.prepare('SELECT prices_json FROM card_metadata WHERE id = ?').get(cardId) as { prices_json: string } | undefined;
    
    let tcgPrice = 0.99;
    let cmPrice = 0.99;

    if (cardInfo) {
      const prices = JSON.parse(cardInfo.prices_json || '[]');
      if (prices && prices.length > 0) {
        tcgPrice = parseFloat(prices[0].tcgplayer_price) || 0.99;
        cmPrice = parseFloat(prices[0].cardmarket_price) || 0.99;
      }
    }

    // Insert today's price if not exists
    const today = new Date().toISOString().split('T')[0];
    const insertPrice = db.prepare(`
      INSERT OR IGNORE INTO price_history (card_id, price_tcg, price_cm, date)
      VALUES (?, ?, ?, ?)
    `);
    insertPrice.run(cardId, tcgPrice, cmPrice, today);

    // Fetch history
    const historyRows = db.prepare(`
      SELECT price_tcg, price_cm, date FROM price_history 
      WHERE card_id = ? 
      ORDER BY date ASC
    `).all(cardId) as { price_tcg: number, price_cm: number, date: string }[];

    // Generate mock price points if less than 5 records exist
    let resultPoints = historyRows;
    if (historyRows.length < 5) {
      resultPoints = [];
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        if (i === 0) {
          resultPoints.push({ price_tcg: tcgPrice, price_cm: cmPrice, date: dateStr });
        } else {
          // Slight sinusoidal deviation for visual mock chart lines
          const seed = Math.sin(i + cardId);
          const tcgDev = tcgPrice * (1 + seed * 0.12);
          const cmDev = cmPrice * (1 + seed * 0.10);
          resultPoints.push({
            price_tcg: Math.max(0.01, parseFloat(tcgDev.toFixed(2))),
            price_cm: Math.max(0.01, parseFloat(cmDev.toFixed(2))),
            date: dateStr
          });
        }
      }
    }

    return res.json({ history: resultPoints });
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7. NEW: Deck Builder APIs
app.get('/api/decks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM decks ORDER BY name ASC').all();
    return res.json({ data: rows });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/decks', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing deck name' });

  try {
    const result = db.prepare('INSERT INTO decks (name) VALUES (?)').run(name);
    return res.json({ id: result.lastInsertRowid, name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete('/api/decks/:id', (req, res) => {
  const deckId = parseInt(req.params.id, 10);
  try {
    db.prepare('DELETE FROM deck_cards WHERE deck_id = ?').run(deckId);
    db.prepare('DELETE FROM decks WHERE id = ?').run(deckId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/decks/:id/cards', (req, res) => {
  const deckId = parseInt(req.params.id, 10);
  try {
    const rows = db.prepare(`
      SELECT c.*, dc.quantity FROM card_metadata c
      INNER JOIN deck_cards dc ON c.id = dc.card_id
      WHERE dc.deck_id = ?
      ORDER BY c.name ASC
    `).all(deckId) as any[];

    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      desc: row.desc,
      atk: row.atk !== null ? row.atk : undefined,
      def: row.def !== null ? row.def : undefined,
      level: row.level !== null ? row.level : undefined,
      race: row.race,
      attribute: row.attribute !== null ? row.attribute : undefined,
      linkval: row.linkval !== null ? row.linkval : undefined,
      linkmarkers: row.linkmarkers ? row.linkmarkers.split(',') : undefined,
      card_prices: JSON.parse(row.prices_json || '[]'),
      quantity: row.quantity,
      card_images: [
        {
          id: row.id,
          image_url: `https://images.ygoprodeck.com/images/cards/${row.id}.jpg`,
          image_url_small: `https://images.ygoprodeck.com/images/cards_small/${row.id}.jpg`,
          image_url_cropped: `https://images.ygoprodeck.com/images/cards_cropped/${row.id}.jpg`,
        }
      ]
    }));

    return res.json({ data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/decks/:id/cards', (req, res) => {
  const deckId = parseInt(req.params.id, 10);
  const { cardId, quantity } = req.body;

  if (cardId === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Missing cardId or quantity' });
  }

  const parsedQty = parseInt(quantity, 10);

  try {
    if (parsedQty <= 0) {
      db.prepare('DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?').run(deckId, cardId);
      return res.json({ success: true, quantity: 0 });
    } else {
      if (parsedQty > 3) {
        return res.status(400).json({ error: 'Max 3 copies of a card allowed in a deck' });
      }
      db.prepare(`
        INSERT INTO deck_cards (deck_id, card_id, quantity) 
        VALUES (?, ?, ?)
        ON CONFLICT(deck_id, card_id) 
        DO UPDATE SET quantity = excluded.quantity
      `).run(deckId, cardId, parsedQty);
      return res.json({ success: true, quantity: parsedQty });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 8. NEW: YDK Deck Export Endpoint
app.get('/api/decks/:id/export', (req, res) => {
  const deckId = parseInt(req.params.id, 10);
  try {
    const deck = db.prepare('SELECT name FROM decks WHERE id = ?').get(deckId) as { name: string } | undefined;
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    const rows = db.prepare(`
      SELECT card_id, type, quantity FROM deck_cards dc
      INNER JOIN card_metadata c ON dc.card_id = c.id
      WHERE dc.deck_id = ?
    `).all(deckId) as { card_id: number, type: string, quantity: number }[];

    let mainList: number[] = [];
    let extraList: number[] = [];

    for (const row of rows) {
      const isExtra = 
        row.type.includes('Synchro') || 
        row.type.includes('XYZ') || 
        row.type.includes('Fusion') || 
        row.type.includes('Link');
      
      for (let i = 0; i < row.quantity; i++) {
        if (isExtra) {
          extraList.push(row.card_id);
        } else {
          mainList.push(row.card_id);
        }
      }
    }

    let ydk = '#created by YGO Explorer Database Terminal\n#main\n';
    ydk += mainList.join('\n') + '\n';
    ydk += '#extra\n';
    ydk += extraList.join('\n') + '\n';
    ydk += '!side\n';

    return res.json({ ydk, deckName: deck.name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 9. NEW: Analytics Dashboard Endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const total = (db.prepare('SELECT COUNT(*) as count FROM card_metadata').get() as any).count;
    const monsters = (db.prepare("SELECT COUNT(*) as count FROM card_metadata WHERE type LIKE '%Monster%'").get() as any).count;
    const spells = (db.prepare("SELECT COUNT(*) as count FROM card_metadata WHERE type = 'Spell Card'").get() as any).count;
    const traps = (db.prepare("SELECT COUNT(*) as count FROM card_metadata WHERE type = 'Trap Card'").get() as any).count;

    // Attributes grouping
    const attributes = db.prepare(`
      SELECT attribute, COUNT(*) as count FROM card_metadata 
      WHERE attribute IS NOT NULL AND type LIKE '%Monster%'
      GROUP BY attribute 
      ORDER BY count DESC
    `).all() as { attribute: string, count: number }[];

    // Top 5 ATK monsters
    const topAtkRows = db.prepare(`
      SELECT id, name, type, atk, prices_json FROM card_metadata 
      WHERE atk IS NOT NULL AND type LIKE '%Monster%'
      ORDER BY atk DESC 
      LIMIT 5
    `).all() as any[];

    const topAtk = topAtkRows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      atk: row.atk,
      prices: JSON.parse(row.prices_json || '[]')[0] || {}
    }));

    return res.json({
      total,
      composition: { monsters, spells, traps },
      attributes,
      topAtk
    });
  } catch (error: any) {
    console.error('Analytics load error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Serve frontend in production
const DIST_DIR = path.resolve('dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*all', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Run background sync
  syncCardMetadata();
});
