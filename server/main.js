require('dotenv').config();
const express = require('express');
const cors = require('cors');
var cookieParser = require('cookie-parser');
const path = require('path');
const songsRouter = require('./routes/songs_filter');
const googleApiRouter = require('./routes/googleApi');
const spotifyApiRouter = require('./routes/spotifyApi');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')))
   .use(cookieParser())
   .use(cors({ 
        origin: ['http://localhost:5173','https://accounts.spotify.com', 'https://api.spotify.com', 'https://spotify.com'],
        credentials: true
    }));

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

