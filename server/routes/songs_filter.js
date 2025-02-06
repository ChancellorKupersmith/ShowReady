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
  max: 20,
  idleTimeoutMillis: 30000,  // Timeout before idle connection is closed
});
const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 100;
// TODO: convert price to number to allow comparison
const OrderBys = Object.freeze({
  SONG_NAME: 1,
  ARTIST: 2,
  EVENT_DATE: 3,
  EVENT_PRICE: 4,
  RANDOM: 5,
});

const reqQueryParamsCleaner = (req, res, next) => {
  try {
    const { page, limit, filters } = req.body;
    req.pageSize = Math.min(MAX_PAGE_SIZE, parseInt(limit) || DEFAULT_PAGE_SIZE);
    req.pageNum = Math.max((parseInt(page) - 1), 0);
    req.fromEachArtist = filters.req.artist.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.artist.fromEach))) : null;
    req.fromEachAlbum = filters.req.album.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.album.fromEach))) : null;
    req.fromEachGenre = filters.req.genre.fromEach? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, parseInt(filters.req.genre.fromEach))) : null;
    switch (filters.orderBy) {
      case 1:
        req.orderBy = OrderBys.SONG_NAME;
        break;
      case 2:
        req.orderBy = OrderBys.ARTIST;
        break;
      case 3:
        req.orderBy = OrderBys.EVENT_DATE;
        break;
      default:
        req.orderBy = OrderBys.RANDOM;
    }
    req.orderByDesc = filters.descending;
    req.randomSeed = filters.randomSeed ? filters.randomSeed : (Date.now() / 1000) % 1;
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
    if(filters?.ex?.source?.spotify) whereConditional += `a.SpotifyExternalId IS NULL AND `;
    if(filters?.req?.source?.spotify) whereConditional += `a.SpotifyExternalId IS NOT NULL AND `;
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

/* SQL Query Notes
  TODO: MINDSET try and minimize query sizes, and send multiple when needed vs large encompassing and complex query
  - reason for spliting into 2 separate queries:
    1. Reduce amount of compute over songs data
      - songs is largest data set so perform as much compution before joins in order to minimize
      - joining on songs.artistID doesnt take advantage of partition pruning
      because artists and songs sub queries happen in parallel and then join
      which still means alot of compute over songs data set.


  - FromEach artist preprocessing using interval overlap analysis:
    1. If we know only x songs from each artist, page size (6 mobile or 9 desktop), and ordering by eventdate or artists name (or any ordering based on columns in filterEventsQuery),
    then we can signicantly increase amount of songs being pruned by paginating through artist ids instead of paginating afterwards.
      Example:
        - 3 songs fromEach artist, page size = 9, orderBy EventDate; SELECT ... artists.ID Limit {pageSize / fromEach} OFFSET {pagenNum}
      - Gotcha Edge Cases:
        a. Artists have less total songs than fromEach filter:
          - A has 2 song, B has 3 songs, C has 3 songs,  fromEach 2, pageSize 6; means only 5 songs will be returned instead of 6
          - I think its very rare for an artist to have less than 6 or 9 songs so I think its safe to negate
        b. How does this work when the page size is massive like 10,000 for spotify playlist saves:
          - 3 songs fromEach artist, page size = 10,000, orderBy EventDate; SELECT ... artists.ID Limit {pageSize / fromEach} OFFSET {pagenNum}
          = large list of artist ids to prune.
          TODO: c. How does this work with large or no fromEach filter:
          - 100 songs fromEach artist, page size = 6, orderBy EventDate; SELECT ... artists.ID Limit {Math.max(1,(pageSize / (fromEach - pageSize * pageNum)))} OFFSET {pagenNum}
          - !!! find how many multiples of pageSize go into fromEach, Math.ceil(100 / 6 = 16.7) = 17
            iterate n number of times before increasing offset (aka pageNum only increases offset after pageNum exceeds previous computed number)
    TODO: 2. Refactoring needed:
      a. orderby logic moved into sql query
      b. paginate logic moved into sql query
  
  - FromEach genre preprocessing:
    1. because genres are connected on artists, we could handle multiple artist preprocessing for each genre (meaning iterate process on individual genres),
      Example: 
        - 3 songs fromEach genre, page size = 9, orderby EventDate; SELECT ... artitstID LIMIT Limit {pageSize / fromEach} OFFSET {pagenNum}
      - Gotcha Edge Cases:
        a. if large amount of genres to iterate on could result in too many frequent queries
        b. with large or no fromEach filter 

  - 
*/
const fetchEventsArtistsData = async (eventWhereConditional, venueWhereConditional, artistWhereConditional, genreWhereConditional, pageSize, pageNum, orderBy, orderByDesc, fromEachGenre, fromEachArtist) => {
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
        LEFT JOIN (
          SELECT g.ID, g.Name
          FROM Genres g
          ${genreWhereConditional}
        ) AS g ON ag.GenreID = g.ID
      ) AS a ON ea.ArtistID = a.ID
      `;
      // ${ 
      //   !(fromEachArtist && (orderBy == OrderBys.ARTIST || orderBy == OrderBys.EVENT_DATE)) ?
      //   '' :
      //   `
      //     ${orderBy == OrderBys.ARTIST ? `ORDER BY a.Name ${ orderByDesc ? 'DESC' : '' }` : ''}
      //     ${orderBy == OrderBys.EVENT_DATE ? `ORDER BY e.EventDate ${ orderByDesc ? 'DESC' : '' }` : ''}
      //     LIMIT ${ Math.max(1, pageSize / fromEachArtist) } OFFSET ${ (Math.floor(pageNum * pageSize / fromEachArtist) + artistOffset) }
      //   `
      // }
    const client = await pool.connect();
    const filterEventsResult = await client.query(filterEventsQuery);
    client.release();
    // for combinging fetched db songs on artistids
    const uniqueFilteredArtistIDs = [...new Set(filterEventsResult.rows.map(row => row.artistid))];
    const artistEvents = filterEventsResult.rows.reduce((acc, row) => {
      if(!acc[row.artistid]){
        acc[row.artistid] = []
      }
      acc[row.artistid].push(row);
      return acc;
    }, {});
    // console.log('uArtist: ' + uniqueFilteredArtistIDs[0]);
    return [artistEvents, uniqueFilteredArtistIDs];
};
const fetchSongsData = async (artistEvents, uniqueFilteredArtistIDs, songWhereConditional, albumWhereConditional, pageSize, pageNum, orderBy, orderByDesc, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  // if no artists found continue
  if(uniqueFilteredArtistIDs.length <= 0) return [[], 0];
  const filterSongsQuery = `
    SELECT
      al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl, al.SpotifyExternalId as AlbumSpID,
      s.Title AS SongTitle, s.SpotifyExternalID AS SpID, s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, s.ArtistID, s.ID AS SongID
    FROM (
      SELECT s.Title, s.SpotifyExternalID, s.YTUrl, s.LastFmUrl, s.ArtistID, s.ID,
      s.AlbumID FROM Songs s
      ${songWhereConditional}
      ${songWhereConditional == '' ? 'WHERE ' : 'AND '}
      ${`s.ArtistID IN ('${uniqueFilteredArtistIDs.join(`', '`)}')`}
    ) AS s
    LEFT JOIN Albums AS al on s.AlbumID = al.ID
    ${albumWhereConditional}
  `;
  // console.log(filterSongsQuery);

  const client = await pool.connect();
  const filterSongsResult = await client.query(filterSongsQuery);
  client.release();
  // prepare data for client side
  // handling filtering logic outside of sql query to improve read times and reduce memory requirements for pg server
  // combine db query results on artistids
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
    }, {}))
    .sort((a,b) => new Date(a.eventdate) - new Date(b.eventdate))
    ;
    return row;
  });
  // manipulating songsList by reference instead of by value to avoid overhead of cloning large list
  const fromEachFiltering = () => {
    const visitedFromEachSongs = {
      'artists': {},
      'albums': {},
      'genres': {}
    };

    const fromEachSongs = {}; // using map to avoid duplicate songs when combining fromEach filters
    const handleFromEachs = (category) => {
      let fromEachNum;
      if (category === 'artists') fromEachNum = fromEachArtist;
      if (category === 'albums') fromEachNum = fromEachAlbum;

      songsList.forEach((song) => {
        if(category === 'genres') {
          song['genres'].forEach(genre => {
            if(!visitedFromEachSongs['genres'][genre]) visitedFromEachSongs[category][genre] = 0;
            if(visitedFromEachSongs['genres'][genre] < fromEachGenre){
              visitedFromEachSongs['genres'][genre]++;
              fromEachSongs[song.songid] = song;
            }
          });
          return;
        }

        let categoryKey;
        if (category === 'artists') categoryKey = song.artist;
        if (category === 'albums') categoryKey = song.album;
        if(!visitedFromEachSongs[category][categoryKey]) visitedFromEachSongs[category][categoryKey] = 0;
        if(visitedFromEachSongs[category][categoryKey] < fromEachNum) {
          visitedFromEachSongs[category][categoryKey]++;
          fromEachSongs[song.songid] = song;
        }
      });
    };
    if(fromEachGenre) handleFromEachs('genres');
    if(fromEachArtist) handleFromEachs('artists');
    if(fromEachAlbum) handleFromEachs('albums');
    if(Object.values(fromEachSongs).length > 0) songsList = Object.values(fromEachSongs);
  };
  fromEachFiltering();
  // handle ordering
  const orderSongsList = () => {
    switch(orderBy){
      case OrderBys.SONG_NAME:
        songsList.sort((a, b) => orderByDesc ? 
          b.songtitle.toLowerCase().localeCompare(b.songtitle.toLowerCase())
        : a.songtitle.toLowerCase().localeCompare(b.songtitle.toLowerCase()));
        break;
      case OrderBys.ARTIST:
        songsList.sort((a,b) => orderByDesc ? 
          b.artist.toLowerCase().localeCompare(a.artist.toLowerCase()) 
        : a.artist.toLowerCase().localeCompare(b.artist.toLowerCase()));
        break;
      case OrderBys.EVENT_DATE:
        // asc: sort by each song's smallest event date
        songsList.sort((a,b) => orderByDesc ?
          new Date(b.events[b.events.length - 1].eventdate) - new Date(a.events[a.events.length - 1].eventdate)
        : new Date(a.events[0].eventdate) - new Date(b.events[0].eventdate)
        );
        break;
      // case OrderBys.EVENT_PRICE:
      //   songsList.sort((a,b) => Math.min(...a.events.map(e => e.price)) - Math.min(...b.events.map(e => e.price)))
      //   break;
      default:
        break;
    };
  };
  orderSongsList();
  // save length of songs list before slicing to page size
  const songsListLength = songsList.length;
  // handle pagination
  const paginateSongsList = () => {
    if(orderBy == OrderBys.RANDOM){ // manually grab random indexes in songs list
      // TODO: implement custom seeded random int generator for pagination (needed if wanting save and display list orders to match)
      const randomIndexes = new Set();
      while(randomIndexes.size < pageSize){
        const randomIndex = Math.floor(Math.random() * songsList.length);
        randomIndexes.add(randomIndex);
      }
      songsList = Array.from(randomIndexes).map(index => songsList[index]);
    }
    else{
      const start = pageNum * pageSize;
      songsList = songsList.slice(start, start + pageSize);
    }
  };
  paginateSongsList();
  return [songsList, songsListLength];
};

const queryPlaylistLength = async (artistEvents, uniqueFilteredArtistIDs, songWhereConditional, albumWhereConditional, pageSize, pageNum, orderBy, orderByDesc, fromEachGenre, fromEachArtist, fromEachAlbum) => {
  // if no artists found continue
  if(uniqueFilteredArtistIDs.length <= 0) return [[], 0];
  const filterSongsQuery = `
    SELECT
      al.Title AS AlbumTitle, al.LastFmUrl AS AlbumLastFmUrl, al.SpotifyExternalId as AlbumSpID,
      s.Title AS SongTitle, s.SpotifyExternalID AS SpID, s.YTUrl AS YTUrl, s.LastFmUrl AS SongLastFmUrl, s.ArtistID, s.ID AS SongID
    FROM (
      SELECT s.Title, s.SpotifyExternalID, s.YTUrl, s.LastFmUrl, s.ArtistID, s.ID,
      s.AlbumID FROM Songs s
      ${songWhereConditional}
      ${songWhereConditional == '' ? 'WHERE ' : 'AND '}
      ${`s.ArtistID IN ('${uniqueFilteredArtistIDs.join(`', '`)}')`}
    ) AS s
    LEFT JOIN Albums AS al on s.AlbumID = al.ID
    ${albumWhereConditional}
  `;
  // console.log(filterSongsQuery);

  const client = await pool.connect();
  const filterSongsResult = await client.query(filterSongsQuery);
  client.release();
  // prepare data for client side
  // handling filtering logic outside of sql query to improve read times and reduce memory requirements for pg server
  // combine db query results on artistids
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
    }, {}))
    .sort((a,b) => new Date(a.eventdate) - new Date(b.eventdate))
    ;
    return row;
  });
  // manipulating songsList by reference instead of by value to avoid overhead of cloning large list
  const fromEachFiltering = () => {
    const visitedFromEachSongs = {
      'artists': {},
      'albums': {},
      'genres': {}
    };

    const fromEachSongs = {}; // using map to avoid duplicate songs when combining fromEach filters
    const handleFromEachs = (category) => {
      let fromEachNum;
      if (category === 'artists') fromEachNum = fromEachArtist;
      if (category === 'albums') fromEachNum = fromEachAlbum;

      songsList.forEach((song) => {
        if(category === 'genres') {
          song['genres'].forEach(genre => {
            if(!visitedFromEachSongs['genres'][genre]) visitedFromEachSongs[category][genre] = 0;
            if(visitedFromEachSongs['genres'][genre] < fromEachGenre){
              visitedFromEachSongs['genres'][genre]++;
              fromEachSongs[song.songid] = song;
            }
          });
          return;
        }

        let categoryKey;
        if (category === 'artists') categoryKey = song.artist;
        if (category === 'albums') categoryKey = song.album;
        if(!visitedFromEachSongs[category][categoryKey]) visitedFromEachSongs[category][categoryKey] = 0;
        if(visitedFromEachSongs[category][categoryKey] < fromEachNum) {
          visitedFromEachSongs[category][categoryKey]++;
          fromEachSongs[song.songid] = song;
        }
      });
    };
    if(fromEachGenre) handleFromEachs('genres');
    if(fromEachArtist) handleFromEachs('artists');
    if(fromEachAlbum) handleFromEachs('albums');
    if(Object.values(fromEachSongs).length > 0) songsList = Object.values(fromEachSongs);
  };
  fromEachFiltering();

  return songsList.length;
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
};

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
};

// ROUTES
const songsRouter = express.Router();
// (potential) Optimize TODO: setup cache of songs list to avoid many sql requests
songsRouter.post('/', 
  reqQueryParamsCleaner,
  eventWhereConditionBuilder, venueWhereConditionBuilder, artistWhereConditionBuilder,
  genreWhereConditionBuilder, songWhereConditionBuilder, albumWhereConditionBuilder,
  async (req, res, next) => {
    try{
        const [artistEvents, uniqueFilteredArtistIDs] = await fetchEventsArtistsData(
          req.eventWhereConditional,
          req.venueWhereConditional,
          req.artistWhereConditional,
          req.genreWhereConditional,
          req.pageSize,
          req.pageNum,
          req.orderBy,
          req.orderByDesc,
          req.fromEachGenre,
          req.fromEachArtist
        );
        const [songsList, songsListLength] = await fetchSongsData(
          artistEvents, uniqueFilteredArtistIDs,
          req.songWhereConditional,
          req.albumWhereConditional,
          req.pageSize,
          req.pageNum,
          req.orderBy,
          req.orderByDesc,
          req.fromEachGenre,
          req.fromEachArtist,
          req.fromEachAlbum
        );
      res.json([songsList, songsListLength])
    } catch (err) {
      next(err);
    }
  }
);

songsRouter.post('/total_results',
  reqQueryParamsCleaner,
  eventWhereConditionBuilder, venueWhereConditionBuilder, artistWhereConditionBuilder,
  genreWhereConditionBuilder, songWhereConditionBuilder, albumWhereConditionBuilder,
  async (req, res, next) =>{
    try{
      const [artistEvents, uniqueFilteredArtistIDs] = await fetchEventsArtistsData(
        req.eventWhereConditional,
        req.venueWhereConditional,
        req.artistWhereConditional,
        req.genreWhereConditional,
        req.pageSize,
        req.pageNum,
        req.orderBy,
        req.orderByDesc,
        req.fromEachGenre,
        req.fromEachArtist
      );
      const filteredSongsLength = await queryPlaylistLength(
        artistEvents, uniqueFilteredArtistIDs,
        req.songWhereConditional,
        req.albumWhereConditional,
        req.pageSize,
        req.pageNum,
        req.orderBy,
        req.orderByDesc,
        req.fromEachGenre,
        req.fromEachArtist,
        req.fromEachAlbum
      );
      console.log(filteredSongsLength);
      res.json(filteredSongsLength);
    } catch (err) {
      next(err);
    }
  }
);

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
          acc[row.venuename] = [];
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

export default songsRouter;