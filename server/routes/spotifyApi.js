import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import querystring from 'querystring';
import dotenv from 'dotenv'
dotenv.config();

const LOGIN_REDIRECT_URI = 'http://localhost:3000/spotify/login_callback';
const STATE_KEY = 'spotify_auth_state';

const getAccessToken = async (req, res, next) => {
    // prevent cross-site request forgery attacks by storing and comparing state
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[STATE_KEY] : null;
    try{
        if(state === null || state !== storedState){
            console.error('Invalid state, potential CSRF')
            throw new Error();
        }
        res.clearCookie(STATE_KEY); //refresh cookies

        const opts = {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_API_CLIENT_ID + ':' + process.env.SPOTIFY_API_CLIENT_SECRET).toString('base64'))
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: LOGIN_REDIRECT_URI, // used for spotify validation only (https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
                grant_type: 'authorization_code'
            }),
        };
        const response = await fetch('https://accounts.spotify.com/api/token', opts);
        if(!response.ok){
            message = await response.text()
            console.error('Failed fetching spotify access token for client, ' + message)
            throw new Error();
        }
        const curTime = new Date();
        const data = await response.json();
        const accessToken = data['access_token'];
        req.accessToken = accessToken;
        const expiration = new Date(curTime.getTime() + data['expires_in'] * 1000);
        res.cookie('spotify_access_token', accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiration,
        });

        const refreshToken = data['spotify_refresh_token'];
        req.refreshToken = refreshToken;
        const oneDayMiliseconds = 24 * 60 * 60 * 1000;
        res.cookie('spotify_refresh_token', refreshToken, {
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

const getUserMeta = async (req, res, next) => {
    try{
        const opts = {
            headers: { 'Authorization': 'Bearer ' + req.accessToken }
        }
        const response = await fetch('https://api.spotify.com/v1/me', opts);
        if(!response.ok) {
            message = await response.text()
            console.error('Failed to fetch spotify user data, ' + message)
            throw new Error();
        }
        const data = await response.json();
        const imgs = data['images'];
        const userMeta = {
            username: data['display_name'],
            id: data['id'],
            profileImg: imgs.length > 0 ? imgs[0]["url"] : null,
        };
        console.log(userMeta);
        const oneDayMiliseconds = 24 * 60 * 60 * 1000;
        res.cookie('spotify_user_meta', JSON.stringify(userMeta), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: oneDayMiliseconds,
        });
        next();
    } catch(err) {
        next(err);
    }
};

const generateRandomString = (length) => {
    return crypto
    .randomBytes(length)
    .toString('hex');
};

const spotifyApiRouter = express.Router();
spotifyApiRouter.get('/login', (req, res, next) => {
    // prevent cross-site request forgery attacks by storing and comparing state
    var state = generateRandomString(16);
    res.cookie(STATE_KEY, state);
    try {
        res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.SPOTIFY_API_CLIENT_ID,
            scope: 'user-read-private user-read-email playlist-modify-public playlist-modify-private',
            redirect_uri: LOGIN_REDIRECT_URI,
            state: state
        }));
    } catch(err) {
        next(err);
    }
});

spotifyApiRouter.get('/login_callback', getAccessToken, getUserMeta, async (req, res, next) => {
    try {
        res.redirect('http://localhost:5173/map');
    } catch(err) {
        next(err);
    }
});

// TODO: hanlde with cookies for more secure and consistent handling
spotifyApiRouter.get('/refresh_token', async (req, res, next) => {
    try {
        const refresh_token = req.query.refresh_token;
        const opts = {
            method: 'POST',
            headers: { 
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_API_CLIENT_ID + ':' + process.env.SPOTIFY_API_CLIENT_SECRET).toString('base64')) 
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            }),
        }
        const response = await fetch('https://accounts.spotify.com/api/token', opts)
        if(!response.ok){
            const message = await response.text()
            console.error('Failed to refresh spotify access token, ' + message);
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

export default spotifyApiRouter;