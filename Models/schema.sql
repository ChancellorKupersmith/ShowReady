CREATE TABLE IF NOT EXISTS Venues (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300),
    VenueUrl VARCHAR(511),
    VenueAddress VARCHAR(255),
    City VARCHAR(100),
    Hood VARCHAR(100),
    Summary VARCHAR(6000),
    EOUrl VARCHAR(511) UNIQUE,
    Phone VARCHAR(20),
    LAT NUMERIC(10, 7),
    LNG NUMERIC(10, 7),
    TMID VARCHAR(36) UNIQUE,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    CONSTRAINT venues_unique_name_address UNIQUE(Name, VenueAddress)
);

CREATE TABLE IF NOT EXISTS Events (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL,
    Url VARCHAR(600),
    Price VARCHAR(100),    
    EventDate DATE NOT NULL,
    EventTime VARCHAR(100),
    AgeRestrictions VARCHAR(50),
    Summary VARCHAR(6000),
    TMID VARCHAR(36) UNIQUE,
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    UNIQUE (Name, EventDate),
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
) PARTITION BY RANGE (EventDate);

CREATE TABLE IF NOT EXISTS Events_Partitioned (
    ID SERIAL,
    Name VARCHAR(300) NOT NULL,
    Url VARCHAR(600),
    Price VARCHAR(100),    
    EventDate DATE NOT NULL,
    EventTime VARCHAR(100),
    AgeRestrictions VARCHAR(50),
    Summary VARCHAR(6000),
    TMID VARCHAR(36),
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    PRIMARY KEY (Name, EventDate),
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
) PARTITION BY RANGE (EventDate);

DO $$
DECLARE
    StartDate DATE := '2024-08-26';
    EndDate DATE := '2026-01-12';
    CurDate DATE := StartDate;
BEGIN
    WHILE CurDate <= EndDate LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS events_%s PARTITION OF Events_Partitioned
            FOR VALUES FROM (%L) TO (%L);',
            to_char(CurDate, 'IYYY_IW'),  -- Year and week number
            CurDate,
            CurDate + interval '1 week'
        );
        CurDate := CurDate + interval '1 week';
    END LOOP;
END $$;

INSERT INTO Events_Partitioned (ID, Name, Url, Price, EventDate, EventTime, AgeRestrictions, Summary, TMID, VenueID, Created, Updated)
SELECT ID, Name, Url, Price, EventDate, EventTime, AgeRestrictions, Summary, TMID, VenueID, Created, Updated
FROM Events;

CREATE TABLE IF NOT EXISTS Artists (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL UNIQUE,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600) UNIQUE,
    Website VARCHAR(600),
    MBID VARCHAR(100),
    TMID VARCHAR(36) UNIQUE,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Albums (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600) UNIQUE,
    ArtistID INT,
    SpotifyFound BOOLEAN,
    LastFmFound BOOLEAN,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Genres (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL,
    ArtistID INT,
    AlbumID INT,
    SongID INT,
    EventID INT,
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    CONSTRAINT genres_distinct UNIQUE(ArtistID, AlbumID, SongID, EventID, VenueID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE SET NULL,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL,
    FOREIGN KEY (SongID) REFERENCES Songs(ID) ON DELETE SET NULL,
    FOREIGN KEY (EventID) REFERENCES Events(ID) ON DELETE SET NULL,
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Songs (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    ArtistID INT NOT NULL,
    AlbumID INT,
    AlbumTrackNum INT,
    MBID VARCHAR(100),
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    SpotifyPreviewUrl VARCHAR(600),
    LastFmUrl VARCHAR(600) UNIQUE,
    YTUrl VARCHAR(600),
    -- used to identify if song has been scraped by youtube, Null if not attempted, true/false if url found
    YTFound BOOLEAN,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    CONSTRAINT songs_unique_title_artist UNIQUE (Title, ArtistID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL
) PARTITION BY LIST (ArtistID);

CREATE TABLE IF NOT EXISTS Songs_Partitioned (
    ID SERIAL,
    Title VARCHAR(300) NOT NULL,
    ArtistID INT NOT NULL,
    AlbumID INT,
    AlbumTrackNum INT,
    MBID VARCHAR(100),
    SpotifyExternalId VARCHAR(30),
    SpotifyPopularity INT,
    SpotifyPreviewUrl VARCHAR(600),
    LastFmUrl VARCHAR(600),
    YTUrl VARCHAR(600),
    -- used to identify if song has been scraped by youtube, Null if not attempted, true/false if url found
    YTFound BOOLEAN,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    PRIMARY KEY (Title, ArtistID),
    CONSTRAINT songs_unique_title_artist UNIQUE (Title, ArtistID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL
) PARTITION BY LIST (ArtistID);

DO $$
DECLARE
    artist RECORD;
BEGIN
    FOR artist IN
        SELECT DISTINCT ArtistID FROM Songs
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS songs_artist_%s PARTITION OF Songs_Partitioned FOR VALUES IN (%s);', artist.ArtistID, artist.ArtistID);
    END LOOP;
END $$;

INSERT INTO Songs_Partitioned (ID, Title, ArtistID, AlbumID, AlbumTrackNum, MBID, SpotifyExternalId, SpotifyPopularity, SpotifyPreviewUrl, LastFmUrl, YTUrl, YTFound, Created, Updated)
SELECT ID, Title, ArtistID, AlbumID, AlbumTrackNum, MBID, SpotifyExternalId, SpotifyPopularity, SpotifyPreviewUrl, LastFmUrl, YTUrl, YTFound, Created, Updated
FROM Songs;

CREATE TABLE IF NOT EXISTS EventsArtists (
    EventID INT,
    ArtistID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (EventID, ArtistID),
    FOREIGN KEY (EventID) REFERENCES Events(ID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Errors (
    ID SERIAL PRIMARY KEY,
    ErrorMessage VARCHAR(6000),
    AlbumID INT,
    ArtistID INT,
    EventID INT,
    GenreID INT,
    SongID INT,
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(ID) ON DELETE CASCADE,
    FOREIGN KEY (GenreID) REFERENCES Genres(ID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES Songs(ID) ON DELETE CASCADE,
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION update_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.Updated := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_trigger_venues
BEFORE UPDATE ON Venues
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_events
BEFORE UPDATE ON Events
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_artists
BEFORE UPDATE ON Artists
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_albums
BEFORE UPDATE ON Albums
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_songs
BEFORE UPDATE ON Songs
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_genres
BEFORE UPDATE ON Genres
FOR EACH ROW
EXECUTE FUNCTION update_updated();

CREATE TRIGGER update_updated_trigger_errors
BEFORE UPDATE ON Errors
FOR EACH ROW
EXECUTE FUNCTION update_updated();