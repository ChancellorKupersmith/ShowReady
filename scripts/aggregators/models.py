from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

class Venue(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    name: Optional[str] = Field(None, alias="Name", max_length=300)
    venue_url: Optional[str] = Field(None, alias="VenueUrl", max_length=511)
    venue_address: Optional[str] = Field(None, alias="VenueAddress", max_length=255)
    city: Optional[str] = Field(None, alias='City', max_length=100)
    hood: Optional[str] = Field(None, alias='Hood', max_length=100)
    summary: Optional[str] = Field(None, alias='Summary', max_length=6000)
    eo_url: Optional[str] = Field(None, alias="EOUrl", max_length=511)
    phone: Optional[str] = Field(None, alias='Phone', max_length=20)
    lat: Optional[Decimal] = Field(None, alias="LAT")
    lng: Optional[Decimal] = Field(None, alias="LNG")
    tm_id: Optional[str] = Field(None, alias="TMID", max_length=36)
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class Event(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    name: str = Field(..., alias='Name', max_length=300)
    url: Optional[str] = Field(None, alias='Url', max_length=600)
    tickets_link: Optional[str] = Field(None, alias="TicketsLink", max_length=600)
    price: Optional[str] = Field(None, alias='Price', max_length=100)
    event_date: date = Field(..., alias="EventDate")
    event_time: Optional[str] = Field(None, alias="EventTime", max_length=100)
    age_restrictions: Optional[str] = Field(None, alias="AgeRestrictions", max_length=50)
    summary: Optional[str] = Field(None, alias='Summary', max_length=6000)
    eo_img: Optional[str] = Field(None, alias="EOImg", max_length=600)
    tm_id: Optional[str] = Field(None, alias="TMID", max_length=36)
    tm_img: Optional[str] = Field(None, alias="TMImg", max_length=600)
    venue_id: Optional[int] = Field(None, alias="VenueID")
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")
    venue: Optional[str] = Field(None, alias='Venue', max_length=300)

class Artist(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    name: str = Field(..., max_length=300)
    spotify_external_id: Optional[str] = Field(None, alias="SpotifyExternalId", max_length=30)
    spotify_popularity: Optional[int] = Field(None, alias="SpotifyPopularity")
    spotify_img: Optional[str] = Field(None, alias="SpotifyImg", max_length=600)
    lastfm_url: Optional[str] = Field(None, alias="LastFmUrl", max_length=600)
    lastfm_img: Optional[str] = Field(None, alias="LastFmImg", max_length=600)
    website: Optional[str] = Field(None, max_length=600)
    mbid: Optional[str] = Field(None, max_length=100)
    tm_id: Optional[str] = Field(None, alias="TMID", max_length=36)
    tm_img: Optional[str] = Field(None, alias="TMImg", max_length=600)
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class Album(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    title: str = Field(..., max_length=300)
    spotify_external_id: Optional[str] = Field(None, alias="SpotifyExternalId", max_length=30)
    spotify_popularity: Optional[int] = Field(None, alias="SpotifyPopularity")
    lastfm_url: Optional[str] = Field(None, alias="LastFmUrl", max_length=600)
    artist_id: Optional[int] = Field(None, alias="ArtistID")
    spotify_found: Optional[bool] = Field(None, alias="SpotifyFound")
    lastfm_found: Optional[bool] = Field(None, alias="LastFmFound")
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class Genre(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    name: str = Field(..., max_length=255)  # Adjust max_length as needed for CITEXT
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class Song(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    title: str = Field(..., max_length=300)
    artist_id: int = Field(..., alias="ArtistID")
    album_id: Optional[int] = Field(None, alias="AlbumID")
    album_track_num: Optional[int] = Field(None, alias="AlbumTrackNum")
    mbid: Optional[str] = Field(None, max_length=100)
    spotify_external_id: Optional[str] = Field(None, alias="SpotifyExternalId", max_length=30)
    spotify_popularity: Optional[int] = Field(None, alias="SpotifyPopularity")
    spotify_preview_url: Optional[str] = Field(None, alias="SpotifyPreviewUrl", max_length=600)
    lastfm_url: Optional[str] = Field(None, alias="LastFmUrl", max_length=600)
    yt_url: Optional[str] = Field(None, alias="YTUrl", max_length=600)
    yt_found: Optional[bool] = Field(None, alias="YTFound")
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class EventArtist(BaseModel):
    event_id: int = Field(..., alias="EventID")
    event_date: date = Field(..., alias="EventDate")
    artist_id: int = Field(..., alias="ArtistID")
    created: Optional[datetime] = Field(None, alias="Created")

class ArtistGenre(BaseModel):
    artist_id: int = Field(..., alias="ArtistID")
    genre_id: int = Field(..., alias="GenreID")
    created: Optional[datetime] = Field(None, alias="Created")

class Error(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    error_message: Optional[str] = Field(None, alias="ErrorMessage", max_length=6000)
    album_id: Optional[int] = Field(None, alias="AlbumID")
    artist_id: Optional[int] = Field(None, alias="ArtistID")
    event_id: Optional[int] = Field(None, alias="EventID")
    event_date: Optional[date] = Field(None, alias="EventDate")
    genre_id: Optional[int] = Field(None, alias="GenreID")
    song_id: Optional[int] = Field(None, alias="SongID")
    venue_id: Optional[int] = Field(None, alias="VenueID")
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")

class SpotifyPlaylist(BaseModel):
    id: Optional[int] = Field(None, alias="ID")
    name: str = Field(..., max_length=300)
    img: Optional[str] = Field(None, max_length=600)
    img_height: Optional[int] = Field(None, alias="ImgHeight")
    img_width: Optional[int] = Field(None, alias="ImgWidth")
    spotify_external_id: Optional[str] = Field(None, alias="SpotifyExternalId", max_length=30)
    spotify_popularity: Optional[int] = Field(None, alias="SpotifyPopularity")
    created: Optional[datetime] = Field(None, alias="Created")
    updated: Optional[datetime] = Field(None, alias="Updated")
