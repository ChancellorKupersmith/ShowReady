const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('client_api_key', async (req, res) => {
    res.json({
        apiKey: process.env.GOOGLE_MAPS_API_KEY_CLIENT
    });
});

router.get('/map', async (req, res, next) => {
    console.log('Hit')
    try {
        const params = new URLSearchParams({
            ...(req.query),
            zoom: '10',
            size: '400x300',
            maptype: 'roadmap',
            key: process.env.GOOGLE_MAPS_API_KEY,
        });
        console.log(`PPPP: ${params}`)
        const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
        const response = await fetch(url);
        console.log(`RRRRR: ${response}`)
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // cache image for 1 hour

        if(!response.ok) throw new Error('Response Error: ', response);
        console.log(`RRRRR: ${response}`)
        response.body.pipe(res);
    } catch (err) {
        console.error(`Error fetching static map with params: `, err);
        next(err);
    }
});

router.get('/places', async (req, res, next) => {
    const { address } = req.query;
    try{
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        res.json(data);
    } catch (err) {
        console.error(`Error fetching places like ${address} from google api`, err);
        next(err)
    }
});

module.exports = router;