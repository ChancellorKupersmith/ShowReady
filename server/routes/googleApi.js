import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import querystring from 'querystring';
import dotenv from 'dotenv'
import { type } from 'os';
import { time } from 'console';
dotenv.config();

const LOGIN_REDIRECT_URI = 'https://showready.xyz/google_api/login_callback';
const PROD_CLIENT_REDIRECT_URI = 'https://showready.xyz';
// const LOGIN_REDIRECT_URI = 'http://localhost:3000/google_api/login_callback';
// const PROD_CLIENT_REDIRECT_URI = 'http://localhost:3000/map';
const STATE_KEY = 'google_auth_state';
const generateRandomString = (length) => {
    return crypto
    .randomBytes(length)
    .toString('hex');
};

const getAccessToken = async (req, res, next) => {
    try{
        // prevent cross-site request forgery attacks by storing and comparing state
        const state = req.query.state || null;
        const storedState = req.cookies ? req.cookies[STATE_KEY] : null;
        if(state === null || state !== storedState){
            console.error('Invalid state, potential CSRF')
            throw new Error();
        }
        res.clearCookie(STATE_KEY); //refresh cookies
        // TODO: handle error response
        const code = req.query.code || null;
        const opts = {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_API_CLIENT_ID,
                client_secret: process.env.GOOGLE_API_CLIENT_SECRET,
                redirect_uri: LOGIN_REDIRECT_URI,
                grant_type: 'authorization_code'
            }),
        };
        const response = await fetch('https://oauth2.googleapis.com/token', opts);
        if(!response.ok){
            message = await response.text()
            console.error('Failed fetching youtube access token for client, ' + message)
            throw new Error();
        }
        const curTime = new Date();
        const data = await response.json();
        const accessToken = data['access_token'];
        req.accessToken = accessToken;
        const expiration = new Date(curTime.getTime() + data['expires_in'] * 1000);
        res.cookie('google_access_token', accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiration,
        });
        const refreshToken = data['refresh_token'];
        req.refreshToken = refreshToken;
        const oneDayMiliseconds = 24 * 60 * 60 * 1000;
        res.cookie('google_refresh_token', refreshToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: oneDayMiliseconds,
        });
        next();
    } catch(err) {
        next(err)
    }
};

const googleApiRouter = express.Router();

googleApiRouter.get('/login', (req, res, next) => {
    // prevent cross-site request forgery attacks by storing and comparing state
    var state = generateRandomString(32);
    res.cookie(STATE_KEY, state);
    try {
        res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' +
        querystring.stringify({
            client_id: process.env.GOOGLE_API_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube',
            redirect_uri: LOGIN_REDIRECT_URI,
            access_type: 'offline', // include refresh token in response
            response_type: 'code',
            state: state
        }));
    } catch(err) {
        next(err);
    }
});

googleApiRouter.get('/login_callback', getAccessToken, async (req, res, next) => {
    try {
        res.redirect(process.env.ENV == 'prod' ? PROD_CLIENT_REDIRECT_URI : 'http://localhost:5173/map');
    } catch(err) {
        next(err);
    }
});

// TODO: hanlde with cookies for more secure and consistent handling
googleApiRouter.get('/refresh_token', async (req, res, next) => {
    try {
        const refresh_token = req.query.refresh_token;
        const opts = {
            method: 'POST',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.GOOGLE_API_CLIENT_ID + ':' + process.env.GOOGLE_API_CLIENT_SECRET).toString('base64')) 
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }),
        }
        const response = await fetch('https://oauth2.googleapis.com/token', opts)
        if(!response.ok){
            const message = await response.text()
            console.error('Failed to refresh google access token, ' + message);
            throw new Error();
        }
        const curTime = new Date();
        const data = await response.json();
        const accessToken = data['access_token'];
        const refreshToken = data['refresh_token'] || refresh_token;
        const expiration = new Date(curTime.getTime() + data['expires_in']);
        res.json({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiration: expiration
        });
    } catch(err) {
        next(err)
    }
});
// proxy requests for client side 
googleApiRouter.post('/new_playlist', async (req, res, next) => {
    // MOCK TESTING
    // res.json({
    //     id: 'PLwkM5ADxvzz_i495V-G-Kk8feFo0dbbiW',
    //     type: 'youtube',
    //     name: 'test'
    // });
    // return;
    try{
        const { playlistName, isPrivate } = req.body;
        const accessToken = req.cookies.google_access_token;
        const refreshToken = req.cookies.google_refresh_token;
        if(accessToken.length === 0 || playlistName.length === 0)
            throw new Error('Missing required params google_access_token and playlistName');
        const payload = {
            'snippet': {
                'title': playlistName,
            },
            'status': {
                'privacyStatus': isPrivate ? 'private' : 'public'
            }
        };
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        };
        const endpoint = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status';
        const response = await fetch(endpoint, opts);
        if(!response.ok){
            // TODO: handle 401 refresh token handling
            throw new Error(await response.text())
        }
        const data = await response.json();
        console.log(data);
        const newPlaylist = {
            id: data['id'],
            type: 'youtube',
            name: data['title']
        };
        res.json(newPlaylist);
        
    } catch (err) {
        next(err);
    }
});
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
        resolve();
        }, ms);
    });
}
  
googleApiRouter.post('/add_playlist_track', async (req, res, next) => {
    // MOCK TESTING
    // await sleep(200);
    // res.status(200).send();
    // return;
    
    try {
        const { playlistId, videoId } = req.body;
        const accessToken = req.cookies.google_access_token;
        const refreshToken = req.cookies.google_refresh_token;
        if(playlistId.length === 0 || videoId.length === 0 || accessToken.length === 0)
            throw new Error('missing required params playlistId, videoId, or accessToken');
        const payload = {
            "snippet": {
                "playlistId": playlistId,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": videoId
                }
            }
        };
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        };
        const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`;
        const response = await fetch(endpoint, opts);
        if(!response.ok){
            console.log(payload);
            // TODO: handle 401 refresh token handling
            throw new Error(await response.text())
        }
        const data = await response.json();
        console.log(data)
        res.status(200).send();
    } catch (err) {
        next(err);
    }
});

googleApiRouter.get('/client_api_key', async (req, res) => res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY_CLIENT}));

googleApiRouter.get('/places', async (req, res, next) => {
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

export default googleApiRouter;