const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DB_NAME,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});

const queryRadioGenPlaylists = async (limit) => {
    const client = await pool.connect();
    let query = `
        SELECT Name, SpotifyExternalId, Img, ImgHeight, ImgWidth
        FROM SpotifyPlaylists
        ORDER BY RANDOM()
        LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    client.release();
    return result;
}

// ROUTES
const router = express.Router();

router.get('/random_playlists', async (req, res, next) => {
    try{
        const limit = req.query.limit;
        const result = await queryRadioGenPlaylists(limit);
        const playlists = result.rows
        res.json(playlists);
    } catch (err) {
        console.error(`Error fetching random RadioGen playlist, `, err);
        next(err)
    }
});

module.exports = router;