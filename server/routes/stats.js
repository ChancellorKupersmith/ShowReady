const express = require('express');
const { Pool } = require('pg');
import dotenv from 'dotenv'
dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DB_NAME,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

const queryRandomRadioGenPlaylists = async (limit) => {
    const client = await pool.connect();
    const query = `
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
    const query = `
        SELECT Name, SpotifyExternalID FROM SpotifyPlaylists
        WHERE IMG != '' AND Name ILIKE '%${name}%'
    `;
    const result = await client.query(query);
    client.release();
    return result;
}


const getTimePeriodRanges = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // --- This Week ---
    // Get the start of the week (Sunday) and end of the week (Saturday)
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Set date to the previous Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Reset time to midnight
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Set date to the next Saturday
    endOfWeek.setHours(23, 59, 59, 999); // Reset time to 23:59:59.999

    // --- This Month ---
    // Get the first day of the current month and the last day of the current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
    startOfMonth.setHours(0, 0, 0, 0); // Reset time to midnight
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
    endOfMonth.setHours(23, 59, 59, 999); // Reset time to 23:59:59.999

    // --- This Year ---
    // Get the first day of the year and the last day of the year
    const startOfYear = new Date(today.getFullYear(), 0, 1); // First day of the year
    startOfYear.setHours(0, 0, 0, 0); // Reset time to midnight
    const endOfYear = new Date(today.getFullYear(), 11, 31); // Last day of the year
    endOfYear.setHours(23, 59, 59, 999); // Reset time to 23:59:59.999
    const timeRanges = {
        TODAY: { 
            min: today,
            max: tomorrow
        },
        WEEK: {
            min: '',
            max: ''
        },
        MONTH: {
            min: '',
            max: ''
        },
        YEAR: {
            min: '',
            max: ''
        },
    };

    return
 };
const cleanTimePeriodParam = (param) => {
    let timePeriod = ''
    
};

// ROUTES
const router = express.Router();

router.get('/artists_performing_this', async (req, res, next) => {
    try{
        const time_period = req.query.time_period;
        const result = await queryRandomRadioGenPlaylists(limit);
        const playlists = result.rows
        res.json(playlists);
    } catch (err) {
        console.error(`Error fetching random RadioGen playlist, `, err);
        next(err)
    }
});
router.get('/playlists', async (req, res, next) => {
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
module.exports = router;