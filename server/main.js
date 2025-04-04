import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import songsRouter from './routes/songs_filter.js';
import googleApiRouter from './routes/googleApi.js';
import spotifyApiRouter from './routes/spotifyApi.js';
import radiogenPlaylistRouter from './routes/radiogenPlaylists.js';
import dotenv from 'dotenv'
dotenv.config();

const app = express();
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '../client-v2/dist')))
   .use(cookieParser())
   .use(cors({ 
        origin: [
            'http://localhost:5173',
            `http://localhost:${port}`,
            'https://showready.xyz',
            'https://accounts.spotify.com',
            'https://api.spotify.com',
            'https://spotify.com',
            'https://accounts.google.com',
            'https://www.googleapis.com',
            'https://www.youtube.com'
        ],
        credentials: true
    }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client-v2/dist/index.html'));
});

app.get('/map', (req, res) => {
    res.sendFile(path.join(__dirname, '../client-v2/dist/map.html'));
});

// TODO: handle multiple err types: 400
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        },
    });
});

app.use('/songs_list', songsRouter);
app.use('/google_api', googleApiRouter);
app.use('/spotify', spotifyApiRouter);
app.use('/radiogen', radiogenPlaylistRouter);

app.listen(port, () => {
    const website_url = process.env.ENV == 'prod' ? 'https://showready.xyz' : `http://localhost:${port}`;
    console.log(`Server is running on ${website_url}`);
});

