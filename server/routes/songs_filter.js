const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DB_NAME,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 100;
const OrderBys = Object.freeze({
   ARTIST: 'Artist',
   SONG_NAME: 'SongTitle',
   EVENT_DATE: 'EventDate',
   VENUE_NAME: 'VenueName',
   RANDOM: 'RANDOM()',
});
const reqQueryParamsCleaner = (req, res, next) => {
  try {
    const { page, limit, filters } = req.body;
    const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(limit) || DEFAULT_PAGE_SIZE);
    const pageNum = parseInt(page) || 0;
    req.fromEachArtist = filters.req.artist.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.artist.fromEach))) : null;
    req.fromEachAlbum = filters.req.album.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.album.fromEach))) : null;
    req.fromEachGenre = filters.req.genre.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.genre.fromEach))) : null;
    let orderBy = filters.orderBy || 2;
    switch (orderBy) {
      case 1:
        orderBy = OrderBys.SONG_NAME;
        break;
      case 2:
        orderBy = OrderBys.EVENT_DATE;
        break;
      case 3:
        orderBy = OrderBys.VENUE_NAME;
        break;
      case 4:
        orderBy = OrderBys.RANDOM;
        break;
      default:
        orderBy = OrderBys.ARTIST;
    }
    if(filters.descending) orderBy += ' DESC';
    req.randomSeed = filters.randomSeed ? filters.randomSeed : (Date.now() / 1000) % 1;
    req.cParams = [pageSize, pageNum];
    req.orderBy = orderBy;
    next();
  } catch (err) {
    next(err);
  }
};
const eventWhereConditionBuilder = async (req, res, next) => {
  try {
    let whereConditional = 'WHERE ';

    const { filters } = req.body;
    // if(filters.ex.genre?.names?.length) whereConditional += `g.Name NOT IN ('${filters.ex.genre.names.join(`', '`)}') AND `;
    // if(filters.req.genre?.names?.length) whereConditional += `g.Name IN ('${filters.req.genre.names.join(`', '`)}') AND `;
    if(filters.dateGThan != '') whereConditional += `e.EventDate >= '${ (new Date(filters.dateGThan)).toUTCString() }' AND `;
    if(filters.dateLThan != '') whereConditional += `e.EventDate <= '${ (new Date(filters.dateLThan)).toUTCString() }' AND `;
    if(filters.priceGThan != '') whereConditional += `e.Price >= '${filters.priceGThan}' AND `;
    if(filters.priceLThan != '') whereConditional += `e.Price <= '${filters.priceLThan}' AND `;
    // TODO: handle spotifyPopularity LThan/GThan 
    if(filters.ex.date?.dates?.length) whereConditional += `e.EventDate NOT IN ('${filters.ex.date.dates.join(`', '`)}') AND `;
    if(filters.req.date?.dates?.length) whereConditional += `e.EventDate IN ('${filters.req.date.dates.join(`', '`)}') AND `;
    if(filters.ex.date?.eventTimes?.length) whereConditional += `e.EventTime NOT IN ('${filters.ex.date.eventTimes.join(`', '`)}') AND `;
    if(filters.req.date?.eventTimes?.length) whereConditional += `e.EventTime IN ('${filters.req.date.eventTimes.join(`', '`)}') AND `;
    if(filters.ex.location.venues.length) whereConditional += `v.Name NOT IN ('${filters.ex.location.venues.join(`', '`)}') AND `;
    if(filters.req.location.venues.length) whereConditional += `v.Name IN ('${filters.req.location.venues.join(`', '`)}') AND `;
    if(filters.ex.location.hoods.length) whereConditional += `v.Hood NOT IN ('${filters.ex.location.hoods.join(`', '`)}') AND `;
    if(filters.req.location.hoods.length) whereConditional += `v.Hood IN ('${filters.req.location.hoods.join(`', '`)}') AND `;
    // TODO: handle ex/req addresses within square miles
    if(filters.ex.event.names.length) whereConditional += `e.Name NOT IN ('${filters.ex.event.names.join(`', '`)}') AND `;
    if(filters.req.event.names.length) whereConditional += `e.Name IN ('${filters.req.event.names.join(`', '`)}') AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.eventWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};
const songWhereConditionBuilder = async (req, res, next) => {
  try {
    let whereConditional = 'WHERE ';

    const { filters } = req.body;
    if(filters.ex.genre?.names?.length) whereConditional += `g.Name NOT IN ('${filters.ex.genre.names.join(`', '`)}') AND `;
    if(filters.req.genre?.names?.length) whereConditional += `g.Name IN ('${filters.req.genre.names.join(`', '`)}') AND `;
    if(filters.ex.artist.names.length) whereConditional += `a.Name NOT IN ('${filters.ex.artist.names.join(`', '`)}') AND `;
    if(filters.req.artist.names.length) whereConditional += `a.Name IN ('${filters.req.artist.names.join(`', '`)}') AND `;
    // TODO: handle from each artists
    // TODO: handle from artist musicbrainz meta
    if(filters.ex.album.names.length) whereConditional += `al.Title NOT IN ('${filters.ex.album.names.join(`', '`)}') AND `;
    if(filters.req.album.names.length) whereConditional += `al.Title IN ('${filters.req.album.names.join(`', '`)}') AND `;
    // TODO: handle from each album
    if(filters.ex.song.names.length) whereConditional += `s.Title NOT IN ('${filters.ex.song.names.join(`', '`)}') AND `;
    if(filters.req.song.names.length) whereConditional += `s.Title IN ('${filters.req.song.names.join(`', '`)}') AND `;
    if(filters.ex.source.spotify) whereConditional += `s.SpotifyExternalId IS NULL AND `;
    if(filters.req.source.spotify) whereConditional += `s.SpotifyExternalId IS NOT NULL AND `;
    if(filters.ex.source.youtube) whereConditional += `s.YTUrl IS NULL AND `;
    if(filters.req.source.youtube) whereConditional += `s.YTFound = TRUE AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.songWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};

const querySongsList = async (eventWhereConditional, songWhereConditional, queryParms, orderBy, randomSeed, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  const client = await pool.connect();
  // ${/*'LEFT JOIN Genres AS g ON e.ID = g.EventID'*/''}
  const filterEventsQuery = `
    SELECT
      ea.ArtistID, v.Name AS VenueName, e.EventDate
      FROM Events e
    JOIN Venues as v ON e.VenueID = v.ID
    JOIN EventsArtists AS ea ON e.ID = ea.EventID AND e.EventDate = ea.EventDate
    ${eventWhereConditional}
  `;
  const filterSongsQuery = `
    WITH FromEachRankedSongs AS (
      SELECT 
        a.ID AS ArtistID, a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl,
        al.ID AS AbumID, al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl,
        s.Title AS SongTitle, s.SpotifyExternalID AS SpID,
        s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, g.Name AS Genre
        ${fromEachGenre ? ', ROW_NUMBER() OVER (PARTITION BY g.Name ORDER BY s.Title) AS rn_genre' : ''}
        ${fromEachArtist ? ', ROW_NUMBER() OVER (PARTITION BY a.ID ORDER BY s.Title) AS rn_artist' : ''}
        ${fromEachAlbum ? ', ROW_NUMBER() OVER (PARTITION BY al.ID ORDER BY s.Title) AS rn_album' : ''}
      FROM Songs s
      JOIN Artists AS a ON s.ArtistID = a.ID
      LEFT JOIN Albums AS al ON s.AlbumID = al.ID
      LEFT JOIN Genres AS g ON a.ID = g.ArtistID
      ${songWhereConditional}
    )
    ${fromEachGenre ? `SELECT * FROM FromEachRankedSongs WHERE rn_genre <= ${fromEachGenre} ${fromEachArtist || fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachArtist ? `SELECT * FROM FromEachRankedSongs WHERE rn_artist <= ${fromEachArtist} ${fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachAlbum ? `SELECT * FROM FromEachRankedSongs WHERE rn_album <= ${fromEachAlbum}` : ''}
    ${!(fromEachGenre || fromEachArtist || fromEachAlbum) ? 'SELECT * FROM FromEachRankedSongs' : ''}
  `;
  const query = `
    WITH data AS (
      SELECT
        fs.Artist, fs.ArtistLastFmUrl,
        fs.AlbumTitle, fs.AlbumLastFmUrl,
        fs.SongTitle, fs.SpID, fs.Genre,
        fs.YTUrl, fs.SongLastFmUrl,
        fe.EventDate, fe.VenueName
      FROM
        (${filterEventsQuery}) AS fe
      JOIN
        (${filterSongsQuery}) AS fs ON fe.ArtistID = fs.ArtistID
      ORDER BY ${orderBy}
    ),
    total_count AS (
      SELECT COUNT(*) AS total FROM data
    )
    SELECT DISTINCT data.*, total_count.total
    FROM data, total_count
    LIMIT $1 OFFSET $2
  `;
  console.log(query)
  await client.query(`SELECT setseed(${randomSeed})`);
  const result = await client.query(query, queryParms);
  client.release();
  return result;
};

const queryTotalResults = async (eventWhereConditional, songWhereConditional, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  const client = await pool.connect();
  const filterEventsQuery = `
    SELECT
      ea.ArtistID, v.Name AS VenueName, e.EventDate
      FROM Events e
    JOIN Venues as v ON e.VenueID = v.ID
    JOIN EventsArtists AS ea ON e.ID = ea.EventID AND e.EventDate = ea.EventDate
    ${eventWhereConditional}
  `;
  const filterSongsQuery = `
    WITH FromEachRankedSongs AS (
      SELECT 
        a.ID AS ArtistID, a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl,
        al.ID AS AbumID, al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl,
        s.Title AS SongTitle, s.SpotifyExternalID AS SpID,
        s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, g.Name AS Genre
        ${fromEachGenre ? ', ROW_NUMBER() OVER (PARTITION BY g.Name ORDER BY s.Title) AS rn_genre' : ''}
        ${fromEachArtist ? ', ROW_NUMBER() OVER (PARTITION BY a.ID ORDER BY s.Title) AS rn_artist' : ''}
        ${fromEachAlbum ? ', ROW_NUMBER() OVER (PARTITION BY al.ID ORDER BY s.Title) AS rn_album' : ''}
      FROM Songs s
      JOIN Artists AS a ON s.ArtistID = a.ID
      LEFT JOIN Albums AS al ON s.AlbumID = al.ID
      LEFT JOIN Genres AS g ON a.ID = g.ArtistID
      ${songWhereConditional}
    )
    ${fromEachGenre ? `SELECT * FROM FromEachRankedSongs WHERE rn_genre <= ${fromEachGenre} ${fromEachArtist || fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachArtist ? `SELECT * FROM FromEachRankedSongs WHERE rn_artist <= ${fromEachArtist} ${fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachAlbum ? `SELECT * FROM FromEachRankedSongs WHERE rn_album <= ${fromEachAlbum}` : ''}
    ${!(fromEachGenre || fromEachArtist || fromEachAlbum) ? 'SELECT * FROM FromEachRankedSongs' : ''}
  `;
  const query = `
    WITH data AS (
      SELECT
        fs.SongTitle
      FROM
        (${filterEventsQuery}) AS fe
      JOIN
        (${filterSongsQuery}) AS fs
      ON
        fe.ArtistID = fs.ArtistID
    ),
    total_count AS (
      SELECT COUNT(*) AS total FROM data
    )
    SELECT total
    FROM total_count
  `;
  const result = await client.query(query);
  client.release();
  return result;
};

const queryEventsList = async (songs) => {
  const client = await pool.connect();
  const query = `
    SELECT 
      e.url AS Url, e.EventDate, e.Summary,
      e.EventTime, e.Price, e.AgeRestrictions,
      v.Name as Venue, v.Hood, v.VenueAddress,
      a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl
    FROM Events as e
    JOIN EventsArtists AS ea ON ea.EventID = e.ID AND ea.EventDate = e.EventDate
    JOIN Artists AS a ON a.ID = ea.ArtistID
    JOIN Venues AS v ON v.ID = e.VenueID
    WHERE a.Name = $1
    ORDER BY e.EventDate
  `;
  let artistEvents = {}
  for(let i=0; i<songs.length; i++){
    if(!artistEvents[songs[i].artist]){
      const result = await client.query(query, [songs[i].artist]);
      artistEvents[songs[i].artist] = result.rows
    }
  }
  client.release();
  return artistEvents;
}

const queryVenues = async () => {
  const client = await pool.connect();
  const query = `
    SELECT 
      name, lat, lng, venueurl, 
      venueaddress, hood, summary, phone
    FROM Venues
    WHERE lat IS NOT NULL
  `;
  const result = await client.query(query);
  client.release();
  return result.rows;
}

const queryUpcomingEvents = async (minDate, maxDate) => {
  const client = await pool.connect();
  let query = `
    SELECT 
      e.Name as EventName, e.EventDate, e.EventTime, e.Url, e.Price,
      v.Name AS VenueName, a.Name AS ArtistName
    FROM Events as e
    JOIN Venues as v ON v.ID = e.VenueID
    JOIN EventsArtists as ea ON ea.EventID = e.ID AND ea.EventDate = e.EventDate
    JOIN Artists as a ON a.ID = ea.ArtistID
  `;
  // join artists
  if(minDate || maxDate){
    query += `WHERE `;
    if(minDate) query += `e.EventDate >= '${(new Date(minDate)).toUTCString()}' AND `;
    query = maxDate ? query + `e.EventDate <= '${(new Date(maxDate)).toUTCString()}'` : query.substring(0, query.length - 4)
  }
  const result = await client.query(query);
  client.release();
  return result.rows;
}


// ROUTES
const router = express.Router();
// (potential) Optimize TODO: setup cache of songs list to avoid many sql requests
router.post('/', reqQueryParamsCleaner, eventWhereConditionBuilder, songWhereConditionBuilder, async (req, res, next) => {
  try {
    const result = await querySongsList(req.eventWhereConditional, req.songWhereConditional, req.cParams, req.orderBy, req.randomSeed, req.fromEachGenre, req.fromEachArtist, req.fromEachAlbum);
    const songsList = result.rows;
    // console.log(songsList)
    const artistEvents =  await queryEventsList(songsList)

    // console.log(artistEvents)
    res.json([songsList, artistEvents]);
  } catch (err) {
    next(err);
  }
});

router.post('/save', reqQueryParamsCleaner, eventWhereConditionBuilder, songWhereConditionBuilder, async (req, res, next) => {
  try {
    const result = await querySongsList(req.eventWhereConditional, req.songWhereConditional, req.cParams, req.orderBy, req.randomSeed, req.fromEachGenre, req.fromEachArtist, req.fromEachAlbum);
    const songsList = result.rows;
    res.json(songsList);
  } catch (err) {
    next(err);
  }
});

router.post('/total_results', reqQueryParamsCleaner, eventWhereConditionBuilder, songWhereConditionBuilder, async (req, res, next) => {
  try{
    const result = await queryTotalResults(req.eventWhereConditional, req.songWhereConditional, req.fromEachGenre, req.fromEachArtist, req.fromEachAlbum);
    const total = result.rows[0];
    // console.log(total)
    res.json(total)
  } catch (err) {
    next(err);
  }
});

router.get('/venue_markers', async (req, res, next) => {
  try{
      venues = await queryVenues();
      res.json(venues);
  } catch (err) {
      console.error(`Error fetching venues, `, err);
      next(err)
  }
});

router.post('/upcoming_events', async (req, res, next) => {
  try{
      const { filters } = req.body;
      const rows = await queryUpcomingEvents(filters.dateGThan, filters.dateLThan);
      const events = rows.reduce((acc, row) => {
        if(!acc[row.venuename]){
          acc[row.venuename] = []
        }
        acc[row.venuename].push(row)
        return acc;
      }, {});
      res.json(events);
  } catch (err) {
      console.error(`Error fetching upcoming events, `, err);
      next(err)
  }
});

module.exports = router;