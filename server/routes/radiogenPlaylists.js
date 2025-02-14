import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv'
dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB_NAME,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});

const queryRandomRadioGenPlaylists = async (limit) => {
    const client = await pool.connect();
    let query = `
        SELECT Name, SpotifyExternalId, Img, ImgHeight, ImgWidth
        FROM SpotifyPlaylists
        WHERE IMG != ''
        ORDER BY RANDOM()
        LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    client.release();
    return result;
}
const queryByNameRadioGenPlaylists = async (name) => {
    const client = await pool.connect();
    // if IMG null then playlist is empty and shoud be ignored
    let query = `
        SELECT Name, SpotifyExternalID FROM SpotifyPlaylists
        WHERE IMG != '' AND Name ILIKE '%${name}%'
    `;
    const result = await client.query(query);
    client.release();
    return result;
}

// ROUTES
const radiogenPlaylistRouter = express.Router();

radiogenPlaylistRouter.get('/random_playlists', async (req, res, next) => {
    try{
        const limit = req.query.limit;
        const result = await queryRandomRadioGenPlaylists(limit);
        const playlists = result.rows
        res.json(playlists);
    } catch (err) {
        console.error(`Error fetching random RadioGen playlist, `, err);
        next(err)
    }
});
radiogenPlaylistRouter.get('/playlists', async (req, res, next) => {
    try{
        const name = req.query.name;
        const result = await queryByNameRadioGenPlaylists(name);
        const names = result.rows
        res.json(names);
    } catch (err) {
        console.error(`Error fetching RadioGen playlist by name, `, err);
        next(err)
    }
})
export default radiogenPlaylistRouter;