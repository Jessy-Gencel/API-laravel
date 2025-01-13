import express, { json } from 'express';
import dotenv from 'dotenv';
import homeRoutes from './routes/home.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profiles.js';
import enemyRoutes from './routes/enemies.js';

dotenv.config();

const app = express();
const port = 3000;
// Middleware to parse JSON
app.use(json());
app.use('/', homeRoutes);
app.use('/users', userRoutes);
app.use('/profiles', profileRoutes);
app.use('/enemies', enemyRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

