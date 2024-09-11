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
   ARTIST: 'a.Name',
   SONG_NAME: 'Songs.Title',
   EVENT_DATE: 'e.EventDate',
   VENUE_NAME: 'v.Name'
});
const reqQueryParamsCleaner = (req, res, next) => {
  try {
    const { page, limit, filters } = req.body;
    const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(limit) || DEFAULT_PAGE_SIZE);
    const pageNum = parseInt(page) || 0;
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
      default:
        orderBy = OrderBys.ARTIST;
    }
    req.cParams = [pageSize, pageNum, orderBy];
    next();
  } catch (err) {
    next(err);
  }
};

const whereConditionBuilder = async (req, res, next) => {
  try {
    let whereConditional = 'WHERE ';

    const { filters } = req.body;
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
    // TODO: handle age restrictions
    if(filters.ex.artist.names.length) whereConditional += `a.Name NOT IN ('${filters.ex.artist.names.join(`', '`)}') AND `;
    if(filters.req.artist.names.length) whereConditional += `a.Name IN ('${filters.req.artist.names.join(`', '`)}') AND `;
    // TODO: handle from each artists
    // TODO: handle from artist musicbrainz meta
    if(filters.ex.album.names.length) whereConditional += `al.Title NOT IN ('${filters.ex.album.names.join(`', '`)}') AND `;
    if(filters.req.album.names.length) whereConditional += `al.Title IN ('${filters.req.album.names.join(`', '`)}') AND `;
    // TODO: handle from each album
    if(filters.ex.song.names.length) whereConditional += `Songs.Title NOT IN ('${filters.ex.song.names.join(`', '`)}') AND `;
    if(filters.req.song.names.length) whereConditional += `Songs.Title IN ('${filters.req.song.names.join(`', '`)}') AND `;
    if(filters.ex.source.spotify) whereConditional += `Songs.SpotifyExternalId IS NULL AND `;
    if(filters.req.source.spotify) whereConditional += `Songs.SpotifyExternalId IS NOT NULL AND `;
    if(filters.ex.source.youtube) whereConditional += `Songs.YTUrl IS NULL AND `;
    if(filters.req.source.youtube) whereConditional += `Songs.YTNotFound = TRUE AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.whereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};


/*
  // params that are always needed are events date range 
  // acting as the data's page size. Then certain where conditions
  // are dynamically added based on filter list not empty (ex:
  // exclude_artists = ['a', 'b'] and only_venue_names = [''])
  
  SELECT Artists.Name, *.Songs, *.Events FROM Songs
  JOIN Artists ON Artists.ID = Songs.ArtistID
  JOIN EventsArtists ON EventsArtists.ArtistID = Artists.ID
  JOIN Events ON Events.ID = EventsArtists.EventID
  WHERE Events.EventDate >= (MIN_DATE_RANGE) 
  AND Events.EventDate <= (MAX_DATE_RANGE)
  
  // not these artists
  AND Artists.Name NOT IN (:excluded_names)
  // only these artists
  AND Artists.Name IN (:only_names)
  // by venue name
  AND Events.Venue
  // with in certain radius
  AND (
    <distance_calculation_logic_using_latitude_and_longitude> <= <radius_in_meters>
  )  
*/
const querySongsList = async (whereConditional, queryParms) => {
  const client = await pool.connect();
  query = `
    WITH data AS (
      SELECT 
        a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl,
        v.Name AS Venue, e.EventDate, 
        v.Hood, v.VenueAddress,
        al.Title as AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl,
        Songs.Title AS SongTitle, Songs.SpotifyExternalId AS SpId,
        Songs.YTUrl as YTUrl, Songs.LastFmUrl AS SongLastFmUrl
      FROM Songs
      JOIN Artists AS a ON a.ID = Songs.ArtistID
      JOIN EventsArtists AS ea ON ea.ArtistID = a.ID
      JOIN Events AS e ON e.ID = ea.EventID
      JOIN Venues AS v ON v.ID = e.VenueID
      JOIN Albums AS al ON al.ID = Songs.AlbumID
      ${whereConditional}
      ORDER BY $3
      LIMIT $1 OFFSET $2
    ),
    total_count AS (
        SELECT COUNT(*) AS total FROM Songs
        JOIN Artists AS a ON a.ID = Songs.ArtistID
        JOIN EventsArtists AS ea ON ea.ArtistID = a.ID
        JOIN Events AS e ON e.ID = ea.EventID
        JOIN Venues AS v ON v.ID = e.VenueID
        JOIN Albums AS al ON al.ID = Songs.AlbumID
        ${whereConditional}
    )
    SELECT data.*, total_count.total FROM data, total_count;
  `;
  const result = await client.query(query, queryParms);
  client.release();
  return result;
};

const queryTotalResults = async (whereConditional, queryParms) => {
  const client = await pool.connect();
  query = `
    SELECT COUNT(*) FROM Songs
    JOIN Artists AS a ON a.ID = Songs.ArtistID
    JOIN EventsArtists AS ea ON ea.ArtistID = a.ID
    JOIN Events AS e ON e.ID = ea.EventID
    JOIN Venues AS v ON v.ID = e.VenueID
    JOIN Albums AS al ON al.ID = Songs.AlbumID
    ${whereConditional}
  `;
  const result = await client.query(query, queryParms);
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
    JOIN EventsArtists AS ea ON ea.EventID = e.ID
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
  `;
  const result = await client.query(query);
  client.release();
  return result.rows;
}


// ROUTES
const router = express.Router();
// (potential) Optimize TODO: setup cache of songs list to avoid many sql requests
router.post('/', reqQueryParamsCleaner, whereConditionBuilder, async (req, res, next) => {
  try {
    const result = await querySongsList(req.whereConditional, req.cParams);
    const songsList = result.rows;
    // console.log(songsList)
    const artistEvents =  await queryEventsList(songsList)

    // console.log(artistEvents)
    res.json([songsList, artistEvents]);
  } catch (err) {
    next(err);
  }
});

router.post('/save', reqQueryParamsCleaner, whereConditionBuilder, async (req, res, next) => {
  try {
    const result = await querySongsList(req.whereConditional, req.cParams);
    const songsList = result.rows;
    // console.log(songsList)
    res.json(songsList);
  } catch (err) {
    next(err);
  }
});

router.post('/total_results', whereConditionBuilder, async (req, res, next) => {
  try{
    const result = await queryTotalResults(req.whereConditional);
    const total = result.rows[0];
    console.log(total)
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

module.exports = router;