const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.get('/client_api_key', async (req, res) => res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY_CLIENT}));

router.get('/places', async (req, res, next) => {
    const { address } = req.query;
    try{
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(address)}&inputtype=textquery&fields=geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        const candidate = data['candidates'][0];
        const location = candidate['geometry']['location']
        console.log(location);
        res.json(location);
    } catch (err) {
        console.error(`Error fetching places like ${address} from google api`, err);
        next(err)
    }
});

module.exports = router;