require('dotenv').config();
const express = require('express');
const path = require('path');
const songsRouter = require('./routes/songs_filter');
const googleApiRouter = require('./routes/googleApi')


const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

