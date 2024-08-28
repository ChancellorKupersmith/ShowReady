CREATE TABLE IF NOT EXISTS Venues (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) UNIQUE,
    VenueUrl VARCHAR(600),
    VenueAddress VARCHAR(600),
    Hood VARCHAR(100),
    Summary VARCHAR(6000),
    EOUrl VARCHAR(600),
    Phone VARCHAR(20),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Events (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300),
    Url VARCHAR(600),
    Price VARCHAR(100),    
    EventDate DATE,
    EventTime VARCHAR(100),
    AgeRestrictions VARCHAR(50),
    Summary VARCHAR(6000),
    VenueID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (VenueID) REFERENCES Venues(ID)
);

CREATE TABLE IF NOT EXISTS Artists (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) UNIQUE NOT NULL,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Albums (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    LastFmUrl VARCHAR(600),
    ArtistID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID)
);

CREATE TABLE IF NOT EXISTS Genres (
    ID SERIAL PRIMARY KEY,
    Name VARCHAR(300) UNIQUE NOT NULL,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Songs (
    ID SERIAL PRIMARY KEY,
    Title VARCHAR(300) NOT NULL,
    ArtistID INT NOT NULL,
    AlbumID INT,
    AlbumTrackNum INT,
    SpotifyExternalId VARCHAR(30) UNIQUE,
    SpotifyPopularity INT,
    SpotifyPreviewUrl VARCHAR(600),
    LastFmUrl VARCHAR(600),
    YTUrl VARCHAR(600),
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated TIMESTAMP,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID),
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID)
);

CREATE TABLE IF NOT EXISTS EventsArtists (
    EventID INT,
    ArtistID INT,
    Created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (EventID, ArtistID),
    FOREIGN KEY (EventID) REFERENCES Events(ID) ON DELETE CASCADE,
    FOREIGN KEY (ArtistID) REFERENCES Artists(ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AlbumGenres (
    AlbumID INT NOT NULL,
    GenreID INT NOT NULL,
    PRIMARY KEY (AlbumID, GenreID),
    FOREIGN KEY (AlbumID) REFERENCES Albums(ID) ON DELETE CASCADE,
    FOREIGN KEY (GenreID) REFERENCES Genres(ID) ON DELETE CASCADE
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