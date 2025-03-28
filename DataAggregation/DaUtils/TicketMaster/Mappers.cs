using System;
using System.Collections.Generic;
using System.Linq;
using DaUtils.DBs.Models;

namespace DaUtils.TicketMaster
{
    public static class Mapper
    {
        public static EventsRawDTO MapToDatabaseTableEvent(Event apiEvent)
        {   
            var price = apiEvent.PriceRanges?.FirstOrDefault();
            var priceStr = $"{price?.Currency}|{price?.Min}|{price?.Max}";
            return new EventsRawDTO
            {
                Tmid = apiEvent.Id,
                Name = apiEvent.Name,
                Url = apiEvent.Url,
                EventDate = apiEvent.Dates?.Start?.LocalDate ?? DateTime.MinValue,
                EventTime = apiEvent.Dates?.Start?.LocalTime,
                TmImg = apiEvent.Images?.FirstOrDefault()?.Url,
                Price = priceStr,
                Source = Constants.TicketMaster.DataAggSource
            };
        }

        private static IEnumerable<string?> ParseGenres(IClassifications apiObj) => 
            apiObj.Classifications?
                .SelectMany(c => new[] { c.SubGenre?.Name, c.Genre?.Name }.Where(name => name != null && !string.Equals(name.ToLower(), "music", StringComparison.Ordinal))) 
            ?? Enumerable.Empty<string>();

        public static List<GenresDTO> MapToDatabaseTableGenres(Event apiEvent)
        {   
            var eventGenreStrs = ParseGenres(apiEvent);
            if(apiEvent.Embedded?.Attractions == null)
                return eventGenreStrs
                    .Where(g => g != null)
                    .Select(g => new GenresDTO { Name = g.ToLower(), Source = Constants.TicketMaster.DataAggSource }).ToList();
            
            var result = eventGenreStrs;
            foreach (var attraction in apiEvent.Embedded?.Attractions)
            {
                var artistsGenreStrs = ParseGenres(attraction);
                result = result.Union(artistsGenreStrs);
            }
            return result.Select(g => new GenresDTO { Name = g.ToLower(), Source = Constants.TicketMaster.DataAggSource }).ToList();   
        }

        public static List<VenuesRawDTO> MapToDatabaseTableVenues(Event apiEvent)
        {   
            var venues = apiEvent.Embedded?.Venues?
                .Where(v => v.Name != null)
                .Select((v) => {
                    decimal? lat = null, lng = null;
                    if(decimal.TryParse(v.Location?.Latitude, out var cleanLat))
                    {
                        lat = cleanLat;
                    }
                    if(decimal.TryParse(v.Location?.Longitude, out var cleanLng))
                    {
                        lng = cleanLng;
                    }
                    return new VenuesRawDTO {
                        Name = v.Name,
                        Tmid = v.Id,
                        VenueAddress = v.Address?.Line1,
                        City = v.City?.Name,
                        Lat = lat,
                        Lng = lng,
                        Source = Constants.TicketMaster.DataAggSource
                    };
                }).ToList();

            return venues ?? new List<VenuesRawDTO>();
        }

        // example spotify artists url: https://open.spotify.com/artist/{id}?{params}
        private const string SpotifyArtistIdUrlPrefix = "https://open.spotify.com/artist/";
        public static List<ArtistsRawDTO> MapToDatabaseTableArtists(Event apiEvent)
        {   
            var artists = apiEvent.Embedded?.Attractions?
                .Select((a) => {
                    var spotifyUrl = a.ExternalLinks?.Spotifys?.FirstOrDefault()?.Url;
                    var spotifyId = spotifyUrl?.Substring(SpotifyArtistIdUrlPrefix.Length);
                    
                    return new ArtistsRawDTO {
                        Name = a.Name,
                        Tmid = a.Id,
                        TmImg = a.Images?.FirstOrDefault()?.Url,
                        LastFmUrl = a.ExternalLinks?.LastFMs?.FirstOrDefault()?.Url,
                        SpotifyExternalId = spotifyId,
                        Website = a.ExternalLinks?.Websites?.FirstOrDefault()?.Url,
                        Mbid = a.ExternalLinks?.MusicBrainzs?.FirstOrDefault()?.Id,
                        Source = Constants.TicketMaster.DataAggSource
                    };
                })
                .ToList();

            return artists ?? new List<ArtistsRawDTO>();
        }
    }
}