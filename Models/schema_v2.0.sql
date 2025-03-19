CREATE TABLE IF NOT EXISTS VenuesRaw (
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
    Source VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);
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

CREATE TABLE IF NOT EXISTS EventsRaw (
    ID SERIAL,
    Name VARCHAR(300) NOT NULL,
    Url VARCHAR(600),
    TicketsLink VARCHAR(600),
    Price VARCHAR(100),    
    EventDate DATE NOT NULL,
    EventTime VARCHAR(100),
    AgeRestrictions VARCHAR(50),
    Summary VARCHAR(6000),
    EOUrl VARCHAR(600) UNIQUE,
    EOImg VARCHAR(600),
    TMID VARCHAR(36),
    TMImg VARCHAR(600),
    VenueID INT,
    Source VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    UNIQUE (TMID, EventDate),
    PRIMARY KEY (ID, EventDate),
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
) PARTITION BY RANGE (EventDate);
CREATE TABLE IF NOT EXISTS Events (
    ID SERIAL,
    Name VARCHAR(300) NOT NULL,
    Url VARCHAR(600),
    TicketsLink VARCHAR(600),
    PriceMin FLOAT,
    PriceMax FLOAT, 
    EventDate DATE NOT NULL,
    EventTime VARCHAR(100),
    AgeRestrictions VARCHAR(50),
    Summary VARCHAR(6000),
    EOImg VARCHAR(600),
    TMID VARCHAR(36),
    TMImg VARCHAR(600),
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    UNIQUE (TMID, EventDate),
    UNIQUE (Name, EventDate, EventTime, VenueID),
    PRIMARY KEY (ID, EventDate),
    FOREIGN KEY (VenueID) REFERENCES Venues(ID) ON DELETE CASCADE
) PARTITION BY RANGE (EventDate);
CREATE INDEX joins_on_VenueID_Events ON Events (VenueID);

CREATE TABLE IF NOT EXISTS ArtistsRaw (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL,
    SpotifyExternalId VARCHAR(30),
    SpotifyPopularity INT,
    SpotifyImg VARCHAR(600),
    LastFmUrl VARCHAR(600),
    LastFmImg VARCHAR(600),
    Website VARCHAR(600),
    MBID VARCHAR(100),
    TMID VARCHAR(36) UNIQUE,
    TMImg VARCHAR(600),
    Source VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);
CREATE TABLE IF NOT EXISTS Artists (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL UNIQUE,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    SpotifyImg VARCHAR(600),
    LastFmUrl VARCHAR(600) UNIQUE,
    LastFmImg VARCHAR(600),
    Website VARCHAR(600) UNIQUE,
    MBID VARCHAR(100) UNIQUE,
    TMID VARCHAR(36) UNIQUE,
    TMImg VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS AlbumsRaw (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600) UNIQUE,
    ArtistID INT,
    SpotifyFound BOOLEAN,
    LastFmFound BOOLEAN,
    Source VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS Albums (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600) UNIQUE,
    ArtistID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SongsRaw (
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
    Source VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    UNIQUE (SpotifyExternalId, ArtistID),
    UNIQUE (LastFmUrl, ArtistID),
    UNIQUE (Title, ArtistID),
    PRIMARY KEY (ID, ArtistID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL
) PARTITION BY LIST (ArtistID);
CREATE TABLE IF NOT EXISTS Songs (
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
    UNIQUE (SpotifyExternalId, ArtistID),
    UNIQUE (LastFmUrl, ArtistID),
    UNIQUE (Title, ArtistID),
    PRIMARY KEY (ID, ArtistID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE SET NULL
) PARTITION BY LIST (ArtistID);
CREATE INDEX joins_on_AlbumID_Songs ON Songs (AlbumID);

CREATE TABLE IF NOT EXISTS Genres (
    ID SERIAL PRIMARY KEY,
    Name CITEXT NOT NULL UNIQUE,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EventsArtists (
    EventID INT,
    EventDate DATE,
    ArtistID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (EventID, ArtistID),
    FOREIGN KEY (EventID, EventDate) REFERENCES Events(ID, EventDate) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);
CREATE INDEX joins_on_EventID_EventsArtists ON EventsArtists (EventID);
CREATE INDEX joins_on_ArtistID_EventsArtists ON EventsArtists (ArtistID);

CREATE TABLE IF NOT EXISTS ArtistsGenres (
    ArtistID INT,
    GenreID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ArtistID, GenreID),
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE,
    FOREIGN KEY (GenreID) REFERENCES Genres(ID) ON DELETE CASCADE
);
CREATE INDEX joins_on_ArtistID_ArtistsGenres ON ArtistsGenres (ArtistID);
CREATE INDEX joins_on_GenreID_ArtistsGenres ON ArtistsGenres (GenreID);


CREATE TABLE IF NOT EXISTS Errors (
    ID SERIAL PRIMARY KEY,
    ErrorMessage VARCHAR(6000),
    ObjectID INT,
    ObjectType VARCHAR(20),
    ObjectContents JSON, -- prioritizing insert speeds, string representation is fine as its meant for debugging purposes anyways
    Active BOOLEAN DEFAULT TRUE,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SpotifyPlaylists (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) NOT NULL,
    Img VARCHAR(600),
    ImgHeight INT,
    ImgWidth INT,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
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

CREATE TRIGGER update_updated_trigger_spotify_playlists
BEFORE UPDATE ON SpotifyPlaylists
FOR EACH ROW
EXECUTE FUNCTION update_updated();