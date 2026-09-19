import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import fighterRoutes from './routes/fighters.js';
import swipeRoutes from './routes/swipes.js';
import locationRoutes from './routes/locations.js';
import fightRoutes from './routes/fights.js';
import rankingRoutes from './routes/rankings.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Run The Fade API' }));

app.use('/api/auth', authRoutes);
app.use('/api/fighters', fighterRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/fights', fightRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/matches', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Run The Fade API listening on :${PORT}`));
