import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv'
dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DB_NAME,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 100;
// TODO: remove venue name as order by and convert price to number to allow comparison
const OrderBys = Object.freeze({
   ARTIST: 'Artist',
   SONG_NAME: 'SongTitle',
   EVENT_DATE: 'EventDate',
   EVENT_PRICE: 'Price',
   VENUE_NAME: 'VenueName',
   RANDOM: 'RANDOM()',
});

const reqQueryParamsCleaner = (req, res, next) => {
  try {
    const { page, limit, filters } = req.body;
    req.pageSize = Math.min(MAX_PAGE_SIZE, parseInt(limit) || DEFAULT_PAGE_SIZE);
    req.pageNum = parseInt(page) || 0;
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
    // req.cParams = [req.pageSize, req.pageNum];
    req.orderBy = orderBy;
    next();
  } catch (err) {
    next(err);
  }
};
const eventWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters.dateGThan != '') whereConditional += `e.EventDate >= '${ (new Date(filters.dateGThan)).toUTCString() }' AND `;
    if(filters.dateLThan != '') whereConditional += `e.EventDate <= '${ (new Date(filters.dateLThan)).toUTCString() }' AND `;
    if(filters.priceGThan != '') whereConditional += `e.Price >= '${filters.priceGThan}' AND `;
    if(filters.priceLThan != '') whereConditional += `e.Price <= '${filters.priceLThan}' AND `;
    if(filters.ex.date?.dates?.length) whereConditional += `e.EventDate NOT IN ('${filters.ex.date.dates.join(`', '`)}') AND `;
    if(filters.req.date?.dates?.length) whereConditional += `e.EventDate IN ('${filters.req.date.dates.join(`', '`)}') AND `;
    if(filters.ex.date?.eventTimes?.length) whereConditional += `e.EventTime NOT IN ('${filters.ex.date.eventTimes.join(`', '`)}') AND `;
    if(filters.req.date?.eventTimes?.length) whereConditional += `e.EventTime IN ('${filters.req.date.eventTimes.join(`', '`)}') AND `;
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
const venueWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters.ex.location.venues.length) whereConditional += `v.Name NOT IN ('${filters.ex.location.venues.join(`', '`)}') AND `;
    if(filters.req.location.venues.length) whereConditional += `v.Name IN ('${filters.req.location.venues.join(`', '`)}') AND `;
    if(filters.ex.location.hoods.length) whereConditional += `v.Hood NOT IN ('${filters.ex.location.hoods.join(`', '`)}') AND `;
    if(filters.req.location.hoods.length) whereConditional += `v.Hood IN ('${filters.req.location.hoods.join(`', '`)}') AND `;
    // TODO: handle ex/req addresses within square miles
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.venueWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};
const artistWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters?.ex?.artist?.names?.length) whereConditional += `a.Name NOT IN ('${filters.ex.artist.names.join(`', '`)}') AND `;
    if(filters?.req?.artist?.names?.length) whereConditional += `a.Name IN ('${filters.req.artist.names.join(`', '`)}') AND `;
    // TODO: handle from artist musicbrainz meta
    // TODO: handle spotifyPopularity LThan/GThan
    // whereConditional += `a.spotifyimg IS NOT NULL AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.artistWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};
const genreWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters?.ex?.genre?.names?.length) whereConditional += `g.Name NOT IN ('${filters.ex.genre.names.join(`', '`)}') AND `;
    if(filters?.req?.genre?.names?.length) whereConditional += `g.Name IN ('${filters.req.genre.names.join(`', '`)}') AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.genreWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};
const songWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters?.ex?.song?.ids?.length) whereConditional += `s.id NOT IN ('${filters.ex.song.ids.join(`', '`)}') AND `
    if(filters?.ex?.song?.names?.length) whereConditional += `s.Title NOT IN ('${filters.ex.song.names.join(`', '`)}') AND `;
    if(filters?.req?.song?.names?.length) whereConditional += `s.Title IN ('${filters.req.song.names.join(`', '`)}') AND `;
    if(filters?.ex?.source?.spotify) whereConditional += `s.SpotifyExternalId IS NULL AND `;
    if(filters?.req?.source?.spotify) whereConditional += `s.SpotifyExternalId IS NOT NULL AND `;
    if(filters?.ex?.source?.youtube) whereConditional += `s.YTUrl IS NULL AND `;
    if(filters?.req?.source?.youtube) whereConditional += `s.YTFound = TRUE AND `;
    // whereConditional += `a.spotifyimg IS NOT NULL AND `;
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
const albumWhereConditionBuilder = async (req, res, next) => {
  try {
    const { filters } = req.body;
    let whereConditional = 'WHERE ';
    if(filters?.ex?.album?.names?.length) whereConditional += `al.Title NOT IN ('${filters.ex.album.names.join(`', '`)}') AND `;
    if(filters?.req?.album?.names?.length) whereConditional += `al.Title IN ('${filters.req.album.names.join(`', '`)}') AND `;
    // remove trailing 'AND'
    if(whereConditional != 'WHERE ')
      whereConditional = whereConditional.substring(0, whereConditional.length - 4);
    else
      whereConditional = ''
    req.albumWhereConditional = whereConditional;
    // console.log(whereConditional)
    next();
  } catch (err) {
    next(err);
  }
};

const fetchAllData = async (eventWhereConditional, venueWhereConditional, artistWhereConditional, genreWhereConditional, songWhereConditional, albumWhereConditional, pageSize, pageNum, orderBy, randomSeed, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  const client = await pool.connect();
  const filterEventsQuery = `
    SELECT
      a.ID AS ArtistID, a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl, a.SpotifyExternalId AS artistSpID, a.SpotifyImg,
      a.Genre,
      e.Name AS Event, e.EventDate, e.EventTime, e.Price, e.AgeRestrictions,
      v.Name AS Venue
    FROM (
      SELECT e.ID, e.Name, e.URL, e.EventDate, e.EventTime, e.Price, e.Summary, e.AgeRestrictions,
      e.VenueID FROM Events e
      ${eventWhereConditional}
    ) AS e
    JOIN (
      SELECT v.Name, v.Hood, v.VenueAddress,
      v.ID FROM Venues v
      ${venueWhereConditional}
    ) AS v ON e.VenueID = v.ID
    JOIN EventsArtists AS ea ON e.ID = ea.EventID AND e.EventDate = ea.EventDate
    JOIN (
      SELECT a.ID, a.Name, a.LastFmUrl, a.SpotifyExternalId, a.SpotifyImg,
      g.Name AS Genre
      FROM (
        SELECT a.ID, a.Name, a.LastFmUrl, a.SpotifyExternalId, a.SpotifyImg
        FROM Artists a
        ${artistWhereConditional}
      ) AS a
      LEFT JOIN ArtistsGenres AS ag ON a.ID = ag.ArtistID
      JOIN (
        SELECT g.ID, g.Name
        FROM Genres g
        ${genreWhereConditional}
      ) AS g ON ag.GenreID = g.ID
    ) AS a ON ea.ArtistID = a.ID
  `;
  // console.log(filterEventsQuery)
  const filterEventsResult = await client.query(filterEventsQuery);
  // console.log(filterEventsResult.rows)
  const filteredArtistIDs = filterEventsResult.rows.map(row => row.artistid);

  const filterSongsQuery = `
    SELECT
    DISTINCT ON (s.Title, s.ArtistID)
    al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl, al.SpotifyExternalId as AlbumSpID,
    s.Title AS SongTitle, s.SpotifyExternalID AS SpID, s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, s.ArtistID
    FROM (
      SELECT s.Title, s.SpotifyExternalID, s.YTUrl, s.LastFmUrl, s.ArtistID,
      s.AlbumID FROM Songs s
      ${songWhereConditional}
      ${songWhereConditional == '' ? 'WHERE ' : 'AND '}
      ${`s.ArtistID IN ('${filteredArtistIDs.join(`', '`)}')`}
    ) AS s
    LEFT JOIN Albums AS al on s.AlbumID = al.ID
    ${albumWhereConditional}
  `;
  // ${// handling random ordering manually later in process to avoid reording every index
  //   orderBy != OrderBys.RANDOM ? `LIMIT ${pageSize} OFFSET ${pageNum}` : ''
  // }
  // console.log(filterSongsQuery)
  const filterSongsResult = await client.query(filterSongsQuery);
  // console.log(filterSongsResult.rows);

  // prepare data for client side
    // combine db query results on artistids
    const artistEvents = filterEventsResult.rows.reduce((acc, row) => {
      if(!acc[row.artistid]){
        acc[row.artistid] = []
      }
      acc[row.artistid].push(row);
      return acc;
    }, {});
    let songsList = filterSongsResult.rows.map((row) => {
      row['artist'] = artistEvents[row.artistid][0].artist;
      row['artistspid'] = artistEvents[row.artistid][0].artistspid;
      row['artistlastfmurl'] = artistEvents[row.artistid][0].artistlastfmurl;
      row['spotifyimg'] = artistEvents[row.artistid][0].spotifyimg;
      // avoid genre duplicates, (handling outside of sql query because DISTINCT ON could exclude multiple event dates)
      row['genres'] = Object.values(artistEvents[row.artistid].reduce((acc, event) => {
        acc[event.genre] = event.genre
        return acc;
      }, {}));
      // avoid event date duplicates, (handling outside of sql query because DISTINCT ON could exclude multiple genres)
      row['events'] = Object.values(artistEvents[row.artistid].reduce((acc, event) => {
        acc[event.eventdate] = {
          'event': event.event,
          'venue': event.venue,
          'eventdate': event.eventdate,
          'eventtime': event.eventtime,
          'price': event.price
        }
        return acc;
      }, {}));
      return row;
    });
    const songsListTotal = songsList.length; // save total results before partitioning based on page size
    // TODO: handle fromEach album, aritst and genre in efficient way
    // handle ordering
      // sort by song title
      // TODO: handle desc vs ascending for each case
      switch(orderBy){
        case OrderBys.SONG_NAME:
          songsList.sort((a, b) => a.songtitle.toLowerCase().localeCompare(b.songtitle.toLowerCase()));
          break;
        case OrderBys.ARTIST:
          songsList.sort((a,b) => a.artist.toLowerCase().localeCompare(b.artist.toLowerCase()));
          break;
        case OrderBys.EVENT_DATE:
          // asc: sort by each song's smallest event date
          songsList.sort((a,b) => new Date(Math.min(...a.events.map(e => new Date(e.eventdate)))) - new Date(Math.min(...b.events.map(e => new Date(e.eventdate)))))
          break;
        // case OrderBys.EVENT_PRICE:
        //   songsList.sort((a,b) => Math.min(...a.events.map(e => e.price)) - Math.min(...b.events.map(e => e.price)))
        //   break;
        default:
          break;
      };
    // handle pagination
    if(orderBy != OrderBys.RANDOM){
      const start = pageNum * pageSize;
      songsList = songsList.slice(start, start + pageSize);
    }
    else{// manually grab random indexes in songs list
      // TODO: implement custom seeded random int generator for pagination (needed if wanting save and display list orders to match)
      const randomIndexes = new Set();
      while(randomIndexes.size < pageSize){
        const randomIndex = Math.floor(Math.random() * songsList.length);
        randomIndexes.add(randomIndex);
      }
      songsList = Array.from(randomIndexes).map(index => songsList[index]);
    }

  return [songsList, songsListTotal];
};

const querySongsList = async (eventWhereConditional, songWhereConditional, queryParms, orderBy, randomSeed, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  const client = await pool.connect();
  const filterEventsQuery = `
    SELECT
      DISTINCT ea.ArtistID
    FROM Events e
    JOIN Venues as v ON e.VenueID = v.ID
    JOIN EventsArtists AS ea ON e.ID = ea.EventID AND e.EventDate = ea.EventDate
    JOIN Artists AS a ON ea.ArtistID = a.ID
    ${eventWhereConditional}
  `;

  const artistIDsResult = await client.query(filterEventsQuery);
  const filteredArtistIDs = artistIDsResult.rows.map(row => row.artistid);
  console.log(filteredArtistIDs)
  //  maybe store event results in hash map if needing to join on artistid
  const filterSongsQuery = `
    WITH Songies AS (
      SELECT 
        DISTINCT ON (a.ID, s.ID)
        a.ID AS ArtistID, a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl, a.SpotifyExternalId as ArtistSpID, a.spotifyimg as SpotifyImg,
        al.ID AS AlbumID, al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl, al.SpotifyExternalId as AlbumSpID,
        s.Title AS SongTitle, s.SpotifyExternalID AS SpID,
        s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, g.Name AS Genre
      FROM Artists a
      JOIN Songs AS s ON a.ID = s.ArtistID
      LEFT JOIN Albums AS al ON s.AlbumID = al.ID
      LEFT JOIN ArtistsGenres AS ag ON a.ID = ag.ArtistID
      LEFT JOIN Genres AS g ON ag.GenreID = g.ID
      ${songWhereConditional}
      ${songWhereConditional == '' ? 'WHERE ' : 'AND '}
      ${`a.ID IN ('${filteredArtistIDs.join(`', '`)}')`}
      ),
      FromEachRankedSongs AS (
        SELECT 
          Songies.*
          ${fromEachGenre ? ', ROW_NUMBER() OVER (PARTITION BY Genre) AS rn_genre' : ''}
          ${fromEachArtist ? ', ROW_NUMBER() OVER (PARTITION BY ArtistID) AS rn_artist' : ''}
          ${fromEachAlbum ? ', ROW_NUMBER() OVER (PARTITION BY AlbumID) AS rn_album' : ''}
        FROM Songies
      )
      ${fromEachGenre ? `SELECT * FROM FromEachRankedSongs WHERE rn_genre <= ${fromEachGenre} ${fromEachArtist || fromEachAlbum ? 'UNION ' : ''}` : ''}
      ${fromEachArtist ? `SELECT * FROM FromEachRankedSongs WHERE rn_artist <= ${fromEachArtist} ${fromEachAlbum ? 'UNION ' : ''}` : ''}
      ${fromEachAlbum ? `SELECT * FROM FromEachRankedSongs WHERE rn_album <= ${fromEachAlbum}` : ''}
      ${!(fromEachGenre || fromEachArtist || fromEachAlbum) ? 'SELECT * FROM FromEachRankedSongs' : ''}
  `;
  const query = `
    WITH data AS (
      SELECT
        fs.Artist, fs.ArtistLastFmUrl, fs.ArtistSpID, fs.SpotifyImg,
        fs.AlbumTitle, fs.AlbumLastFmUrl, fs.AlbumSpID,
        fs.SongTitle, fs.SpID, fs.Genre,
        fs.YTUrl, fs.SongLastFmUrl
      FROM
        (${filterSongsQuery}) AS fs
    ),
    total_count AS (
      SELECT COUNT(*) AS total FROM data
    )
    SELECT data.*, total_count.total
    FROM data, total_count
    ORDER BY ${orderBy}
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
      DISTINCT ON (ea.ArtistID) ea.ArtistID, v.Name AS VenueName, e.EventDate
      FROM Events e
    JOIN Venues as v ON e.VenueID = v.ID
    JOIN EventsArtists AS ea ON e.ID = ea.EventID AND e.EventDate = ea.EventDate
    ${eventWhereConditional}
  `;
  const filterSongsQuery = `
    WITH Songies AS (
      SELECT 
        DISTINCT ON (a.ID, s.Title)
        a.ID AS ArtistID, a.Name AS Artist, a.LastFmUrl AS ArtistLastFmUrl, a.SpotifyExternalId as ArtistSpID, a.spotifyimg as SpotifyImg,
        al.ID AS AlbumID, al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl, al.SpotifyExternalId as AlbumSpID,
        s.Title AS SongTitle, s.SpotifyExternalID AS SpID,
        s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, g.Name AS Genre

        FROM Songs s
        JOIN Artists AS a ON s.ArtistID = a.ID
        LEFT JOIN Albums AS al ON s.AlbumID = al.ID
        LEFT JOIN ArtistsGenres AS ag ON a.ID = ag.ArtistID
        LEFT JOIN Genres AS g ON ag.GenreID = g.ID
        ${songWhereConditional}
    ),
    FromEachRankedSongs AS (
      SELECT
        Songies.*
        ${fromEachGenre ? ', ROW_NUMBER() OVER (PARTITION BY Genre) AS rn_genre' : ''}
        ${fromEachArtist ? ', ROW_NUMBER() OVER (PARTITION BY ArtistID) AS rn_artist' : ''}
        ${fromEachAlbum ? ', ROW_NUMBER() OVER (PARTITION BY AlbumID) AS rn_album' : ''}
      FROM Songies
    )
    ${fromEachGenre ? `SELECT * FROM FromEachRankedSongs WHERE rn_genre <= ${fromEachGenre} ${fromEachArtist || fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachArtist ? `SELECT * FROM FromEachRankedSongs WHERE rn_artist <= ${fromEachArtist} ${fromEachAlbum ? 'UNION ' : ''}` : ''}
    ${fromEachAlbum ? `SELECT * FROM FromEachRankedSongs WHERE rn_album <= ${fromEachAlbum}` : ''}
    ${!(fromEachGenre || fromEachArtist || fromEachAlbum) ? 'SELECT * FROM FromEachRankedSongs' : ''}
  `;
  // const query = `
  //   WITH data AS (
  //     SELECT
  //       fs.SongTitle
  //     FROM
  //       (${filterEventsQuery}) AS fe
  //     JOIN
  //       (${filterSongsQuery}) AS fs
  //     ON
  //       fe.ArtistID = fs.ArtistID
  //   ),
  //   total_count AS (
  //     SELECT COUNT(*) AS total FROM data
  //   )
  //   SELECT total
  //   FROM total_count
  // `;
  // const result = await client.query(query);

  const eventsResult = client.query(filterEventsQuery);
  // Maybe store event results in hashmap if joing data is needed

  const songsResult = client.query(filterSongsQuery);
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
  let whereConditional = '';
  if(minDate || maxDate){
    whereConditional += `WHERE `;
    if(minDate) whereConditional += `e.EventDate >= '${(new Date(minDate)).toUTCString()}' AND `;
    whereConditional = maxDate ? whereConditional + `e.EventDate <= '${(new Date(maxDate)).toUTCString()}'` : whereConditional.substring(0, whereConditional.length - 4);
  }
  let query = `
    SELECT 
      e.Name as EventName, e.EventDate, e.EventTime, e.Url, e.Price, e.EOImg, e.TMImg, e.TicketsLink,
      v.Name AS VenueName
    FROM Events as e
    JOIN Venues as v ON v.ID = e.VenueID
    ${whereConditional}
    ORDER BY e.EventDate --client should lists events in asc order
  `;
  const result = await client.query(query);
  client.release();
  return result.rows;
}

const queryTotalSongsBetween = async (minDate, maxDate) => {
  const client = await pool.connect();
  const query = `
    SELECT COUNT(s.*) FROM Songs s
    JOIN Artists as a ON s.ArtistID = a.ID
    JOIN EventsArtists as ea ON a.ID = ea.ArtistID
    WHERE ea.EventDate >= $1 AND ea.EventDate <= $2
  `;
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}
const queryTotalSongs =  async () => {
  const query = 'SELECT COUNT(*) FROM Songs';
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}
const queryTotalEventsBetween = async (minDate, maxDate) => {
  const client = await pool.connect();
  const query = `
    SELECT COUNT(ea.*) FROM EventsArtists ea
    WHERE ea.EventDate >= $1 AND ea.EventDate <= $2
  `;
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}
const queryTotalEvents =  async () => {
  const query = 'SELECT COUNT(DISTINCT *) FROM EventsArtists';
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}
const queryTotalArtistsBetween = async (minDate, maxDate) => {
  const client = await pool.connect();
  const query = `
    SELECT COUNT(a.*) FROM Artists a
    JOIN EventsArtists as ea ON a.ID = ea.ArtistID
    WHERE ea.EventDate >= $1 AND ea.EventDate <= $2
  `;
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}
const queryTotalArtists =  async () => {
  const query = 'SELECT COUNT(DISTINCT *) FROM Artists';
  const result = await client.query(query, [minDate, maxDate]);
  client.release();
  return result.rows[0];
}


// ROUTES
const songsRouter = express.Router();
// (potential) Optimize TODO: setup cache of songs list to avoid many sql requests
songsRouter.post('/', 
  reqQueryParamsCleaner, eventWhereConditionBuilder, venueWhereConditionBuilder, 
  artistWhereConditionBuilder, genreWhereConditionBuilder, songWhereConditionBuilder, albumWhereConditionBuilder, 
  async (req, res, next) => {
    try {
      const filteredResults = await fetchAllData(
        req.eventWhereConditional,
        req.venueWhereConditional,
        req.artistWhereConditional,
        req.genreWhereConditional,
        req.songWhereConditional,
        req.albumWhereConditional,
        req.pageSize,
        req.pageNum,
        req.orderBy 
      );
      res.json(filteredResults);
    } catch (err) {
      next(err);
    }
});

songsRouter.post('/save', reqQueryParamsCleaner, eventWhereConditionBuilder, songWhereConditionBuilder, async (req, res, next) => {
  try {
    const filteredResults = await fetchAllData(
      req.eventWhereConditional,
      req.venueWhereConditional,
      req.artistWhereConditional,
      req.genreWhereConditional,
      req.songWhereConditional,
      req.albumWhereConditional,
      req.pageSize,
      req.pageNum,
      req.orderBy 
    );
    res.json(filteredResults);
  } catch (err) {
    next(err);
  }
});

songsRouter.post('/total_results', reqQueryParamsCleaner, eventWhereConditionBuilder, songWhereConditionBuilder, async (req, res, next) => {
  try{
    const result = await queryTotalResults(req.eventWhereConditional, req.songWhereConditional, req.fromEachGenre, req.fromEachArtist, req.fromEachAlbum);
    const total = result.rows[0];
    // console.log(total)
    res.json(total)
  } catch (err) {
    next(err);
  }
});

songsRouter.get('/venue_markers', async (req, res, next) => {
  try{
      const venues = await queryVenues();
      res.json(venues);
  } catch (err) {
      console.error(`Error fetching venues, `, err);
      next(err)
  }
});

songsRouter.post('/upcoming_events', async (req, res, next) => {
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

songsRouter.get('/total_songs', async (req, res, next) => {
  try{
    const time = req.query.time;
    let total = null;
    const today = new Date();
    const dayOfWeek = today.getDate();
    const month = today.getMonth() + 1; // adding one, zero-based month indexing (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth)
    const year = today.getFullYear();
    let minDate = '', maxDate = '';
    switch(time){
      case 'today':
        // format date to string "YYYY-MM-DD"
        const formattedDate = today.toISOString().split('T')[0];
        total =  await queryTotalSongsBetween(formattedDate, formattedDate);
        break;
      case 'weekend':
        const startOfWeekend = new Date(today);
        const endOfWeekend = new Date();
        // set start of weekend to Friday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeekend.setDate(startOfWeekend.getDate() - 2);
        }
        else {
          startOfWeekend.setDate(today.getDate() + (5 - dayOfWeek));
        }
        endOfWeekend.setDate(startOfWeekend.getDate() + 2);
        minDate = startOfWeekend.toISOString().split('T')[0];
        maxDate = endOfWeekend.toISOString().split('T')[0];
        total =  await queryTotalSongsBetween(minDate, maxDate);
        break;
      case 'week':
        const startOfWeek = new Date(today);
        const endOfWeek = new Date();
        // set start of week to Monday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeek.setDate(today.getDate() - 6);
        }
        else {
          startOfWeek.setDate(today.getDate() + (1 - dayOfWeek))
        }
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        minDate = startOfWeek.toISOString().split('T')[0];
        maxDate = endOfWeek.toISOString().split('T')[0];
        total =  await queryTotalSongsBetween(minDate, maxDate);
        break;
      case 'month':
        minDate = `${year}-${month}-01`;
        maxDate = `${year}-${month + 1}-01`;
        total =  await queryTotalSongsBetween(minDate, maxDate);
        break;
      case 'year':
        minDate = `${year}-01-01`;
        maxDate = `${year + 1}-01-01`;
        total =  await queryTotalSongsBetween(minDate, maxDate);
        break;
      default:
        total =  await queryTotalSongs();
    }
    res.send(total);
  }
  catch (err) {
    console.error(`Error fetching total songs for landing page `, err);
    next(err)
  }
});

songsRouter.get('/total_events', async (req, res, next) => {
  try{
    const time = req.query.time;
    let total = null;
    const today = new Date();
    const dayOfWeek = today.getDate();
    const month = today.getMonth() + 1; // adding one, zero-based month indexing (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth)
    const year = today.getFullYear();
    let minDate = '', maxDate = '';
    switch(time){
      case 'today':
        // format date to string "YYYY-MM-DD"
        const formattedDate = today.toISOString().split('T')[0];
        total =  await queryTotalEventsBetween(formattedDate, formattedDate);
        break;
      case 'weekend':
        const startOfWeekend = new Date(today);
        const endOfWeekend = new Date();
        // set start of weekend to Friday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeekend.setDate(startOfWeekend.getDate() - 2);
        }
        else {
          startOfWeekend.setDate(today.getDate() + (5 - dayOfWeek));
        }
        endOfWeekend.setDate(startOfWeekend.getDate() + 2);
        minDate = startOfWeekend.toISOString().split('T')[0];
        maxDate = endOfWeekend.toISOString().split('T')[0];
        total =  await queryTotalEventsBetween(minDate, maxDate);
        break;
      case 'week':
        const startOfWeek = new Date(today);
        const endOfWeek = new Date();
        // set start of week to Monday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeek.setDate(today.getDate() - 6);
        }
        else {
          startOfWeek.setDate(today.getDate() + (1 - dayOfWeek))
        }
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        minDate = startOfWeek.toISOString().split('T')[0];
        maxDate = endOfWeek.toISOString().split('T')[0];
        total =  await queryTotalEventsBetween(minDate, maxDate);
        break;
      case 'month':
        minDate = `${year}-${month}-01`;
        maxDate = `${year}-${month + 1}-01`;
        total =  await queryTotalEventsBetween(minDate, maxDate);
        break;
      case 'year':
        minDate = `${year}-01-01`;
        maxDate = `${year + 1}-01-01`;
        total =  await queryTotalEventsBetween(minDate, maxDate);
        break;
      default:
        total =  await queryTotalEvents();
    }
    res.send(total);
  }
  catch (err) {
    console.error(`Error fetching total events for landing page `, err);
    next(err)
  }
});

songsRouter.get('/total_artists', async (req, res, next) => {
  try{
    const time = req.query.time;
    let total = null;
    const today = new Date();
    const dayOfWeek = today.getDate();
    const month = today.getMonth() + 1; // adding one, zero-based month indexing (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth)
    const year = today.getFullYear();
    let minDate = '', maxDate = '';
    switch(time){
      case 'today':
        // format date to string "YYYY-MM-DD"
        const formattedDate = today.toISOString().split('T')[0];
        total =  await queryTotalArtistsBetween(formattedDate, formattedDate);
        break;
      case 'weekend':
        const startOfWeekend = new Date(today);
        const endOfWeekend = new Date();
        // set start of weekend to Friday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeekend.setDate(startOfWeekend.getDate() - 2);
        }
        else {
          startOfWeekend.setDate(today.getDate() + (5 - dayOfWeek));
        }
        endOfWeekend.setDate(startOfWeekend.getDate() + 2);
        minDate = startOfWeekend.toISOString().split('T')[0];
        maxDate = endOfWeekend.toISOString().split('T')[0];
        total =  await queryTotalArtistsBetween(minDate, maxDate);
        break;
      case 'week':
        const startOfWeek = new Date(today);
        const endOfWeek = new Date();
        // set start of week to Monday
        if (dayOfWeek == 0) { // if Sunday
          startOfWeek.setDate(today.getDate() - 6);
        }
        else {
          startOfWeek.setDate(today.getDate() + (1 - dayOfWeek))
        }
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        minDate = startOfWeek.toISOString().split('T')[0];
        maxDate = endOfWeek.toISOString().split('T')[0];
        total =  await queryTotalArtistsBetween(minDate, maxDate);
        break;
      case 'month':
        minDate = `${year}-${month}-01`;
        maxDate = `${year}-${month + 1}-01`;
        total =  await queryTotalArtistsBetween(minDate, maxDate);
        break;
      case 'year':
        minDate = `${year}-01-01`;
        maxDate = `${year + 1}-01-01`;
        total =  await queryTotalArtistsBetween(minDate, maxDate);
        break;
      default:
        total =  await queryTotalArtists();
    }
    res.send(total);
  }
  catch (err) {
    console.error(`Error fetching total artists for landing page `, err);
    next(err)
  }
});

export default songsRouter;