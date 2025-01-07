WITH weekend_dates AS (
    -- Get the start of the current weekend (Saturday) and the end of the weekend (Sunday)
    SELECT
        CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INT + 5 AS friday,
        CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7 AS sunday
),
performing_artists AS (
    -- Find artists performing on the weekend (Saturday and Sunday)
    SELECT DISTINCT ea.ArtistID
    FROM Events e
    JOIN EventsArtists ea ON e.ID = ea.EventID AND e.EventDate BETWEEN (SELECT friday FROM weekend_dates) AND (SELECT sunday FROM weekend_dates)
)
-- Count the number of distinct artists
SELECT COUNT(*) AS artist_count
FROM performing_artists;




-- SELECT g.Name AS GenreName, COUNT(DISTINCT s.ID) AS SongCount
-- FROM Genres g
-- JOIN Artists AS a ON g.ArtistID = a.ID
-- JOIN Songs AS s ON a.ID = s.ArtistID
-- JOIN EventsArtists AS ea ON a.ID = ea.ArtistID
-- JOIN Events AS e ON ea.EventID = e.ID
-- WHERE e.EventDate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 week'
-- GROUP BY g.Name
-- ORDER BY SongCount DESC;

-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('This is Seattle Oct-2024', '5zQkAGDApz1YgmBG065qpe');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle World Oct-2024', '4kwbd5OleUZvKzmiS7tsbP');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle French Rap Oct-2024', '22JZno6BXETFY17NlrXp4a');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle Other Oct-2024', '3hgGKHHRgsNzuztZpqAVvT');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle Witchstep Oct-2024', '5GcPMi8Ec5miYs2XixUjCK');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle Alternative Folk Oct-2024', '5d48BouZC08EutOZfOCPFj');
-- INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId)
-- VALUES ('Seattle Indie Pop Oct-2024', '10tt4ZIQYwfkX8qs0dYRk9');

-- CREATE TABLE IF NOT EXISTS Events_Partitioned (
--     ID SERIAL,
--     Name VARCHAR(300) NOT NULL,
--     Url VARCHAR(600),
--     Price VARCHAR(100),    
--     EventDate DATE NOT NULL,
--     EventTime VARCHAR(100),
--     AgeRestrictions VARCHAR(50),
--     Summary VARCHAR(6000),
--     TMID VARCHAR(36),
--     VenueID INT,
--     Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     Updated TIMESTAMP,
--     PRIMARY KEY (Name, EventDate),
--     FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
-- ) PARTITION BY RANGE (EventDate);

-- DO $$
-- DECLARE
--     StartDate DATE := '2024-08-26';
--     EndDate DATE := '2029-01-01';
--     CurDate DATE := StartDate;
-- BEGIN
--     WHILE CurDate <= EndDate LOOP
--         EXECUTE format('
--             CREATE TABLE IF NOT EXISTS events_%s PARTITION OF Events
--             FOR VALUES FROM (%L) TO (%L);',
--             to_char(CurDate, 'IYYY_IW'),  -- Year and week number
--             CurDate,
--             CurDate + interval '1 week'
--         );
--         CurDate := CurDate + interval '1 week';
--     END LOOP;
-- END $$;

-- INSERT INTO Events_Partitioned (ID, Name, Url, Price, EventDate, EventTime, AgeRestrictions, Summary, TMID, VenueID, Created, Updated)
-- SELECT ID, Name, Url, Price, EventDate, EventTime, AgeRestrictions, Summary, TMID, VenueID, Created, Updated
-- FROM Events;

-- CREATE TABLE IF NOT EXISTS Songs_Partitioned (
--     ID SERIAL,
--     Title VARCHAR(300) NOT NULL,
--     ArtistID INT NOT NULL,
--     AlbumID INT,
--     AlbumTrackNum INT,
--     MBID VARCHAR(100),
--     SpotifyExternalId VARCHAR(30),
--     SpotifyPopularity INT,
--     SpotifyPreviewUrl VARCHAR(600),
--     LastFmUrl VARCHAR(600),
--     YTUrl VARCHAR(600),
--     -- used to identify if song has been scraped by youtube, Null if not attempted, true/false if url found
--     YTFound BOOLEAN,
--     Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     Updated TIMESTAMP,
--     PRIMARY KEY (Title, ArtistID),
--     CONSTRAINT songs_unique_title_artist UNIQUE (Title, ArtistID),
--     FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
--     FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL
-- ) PARTITION BY LIST (ArtistID);

-- DO $$
-- DECLARE
--     artist RECORD;
-- BEGIN
--     FOR artist IN
--         SELECT DISTINCT ArtistID FROM Songs
--     LOOP
--         EXECUTE format('CREATE TABLE IF NOT EXISTS songs_artist_%s PARTITION OF Songs_Partitioned FOR VALUES IN (%s);', artist.ArtistID, artist.ArtistID);
--     END LOOP;
-- END $$;

-- INSERT INTO Songs_Partitioned (ID, Title, ArtistID, AlbumID, AlbumTrackNum, MBID, SpotifyExternalId, SpotifyPopularity, SpotifyPreviewUrl, LastFmUrl, YTUrl, YTFound, Created, Updated)
-- SELECT ID, Title, ArtistID, AlbumID, AlbumTrackNum, MBID, SpotifyExternalId, SpotifyPopularity, SpotifyPreviewUrl, LastFmUrl, YTUrl, YTFound, Created, Updated
-- FROM Songs;