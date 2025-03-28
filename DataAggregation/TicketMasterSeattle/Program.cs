using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DaUtils;
using DaUtils.APIs;
using DaUtils.DBs;
using DaUtils.DBs.Models;
using DaUtils.TicketMaster;
using Newtonsoft.Json;

namespace TicketMasterSeattle;

class Program
{
    static async Task Main()
    {
        var now = DateTime.UtcNow;
        var timestamp = now.ToString("MM-dd-yyyy_HH-mm-ss");
        var logger = new DaLogger($"TM_Seattle({timestamp}).log", LogLvl.Verbose);
        try
        {
            logger.Info("Starting Seattle TicketMaster data aggregation");
            var config = StartUp.Config.Build();

            var tmClientProxy = new ApiClientProxy(logger, Constants.TicketMaster.PipeName);
            // Scrape 1000 upcoming events from seattle (purpose: get events and potentially new ticketmaster venues)
            var pageSize = "10";
            var yesterday = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ");
            for (var page = 0; page < 2; page++)
            {
                var tmRequest = new ApiRequest
                {
                    Method = RequestMethod.Get,
                    Endpoint = "/events.json",
                    Parameters = new Dictionary<string, string>
                    {
                        {"city", "Seattle"},
                        {"page", $"{page}"},
                        {"size", pageSize},
                        {"classificationName", "music"},
                        {"startDateTime", yesterday}
                    }
                };
                var response = await tmClientProxy.CallApiAsync(tmRequest);
                var tmResponse = JsonConvert.DeserializeObject<EventResponse>(response);
                if(tmResponse?.Embedded?.Events == null)
                {
                    logger.Debug($"TM RESPONSE: {tmResponse}");
                    logger.Debug(response);
                    logger.Info("No Events from TicketMaster API.");
                    continue;
                }
                logger.Debug($"Tm Embedded: {tmResponse.Embedded}");
                /* standardize api response data
                iterate through apiEvents adding mapped values to associated hashsets and to hashmap for joining db assigned ids later in process
                reason behind complexity is to allow for bulk insert in db
                - HashMap (key: event.TMID_event.EventDate, value: [EventsRaw, List<VenuesRaw>, List<ArtistsRaw>, List<Genres>])
                - insert venues before events to get venueid foreign key
                - insert events and artists before join table
                - insert artists and genres before join table

            */
                var events = new Dictionary<string, ValueTuple<EventsRawDTO, List<VenuesRawDTO>, List<ArtistsRawDTO>, List<GenresDTO>>>();
                var uniqueVenues = new HashSet<VenuesRawDTO>();
                var uniqueArtists = new HashSet<ArtistsRawDTO>();
                var uniqueGenres = new HashSet<GenresDTO>();
                
                foreach (var apiEvent in tmResponse.Embedded?.Events)
                {
                    logger.Info($"Number of events: {tmResponse.Embedded?.Events.Count}");
                    var newEvent = Mapper.MapToDatabaseTableEvent(apiEvent);
                    var newVenues = Mapper.MapToDatabaseTableVenues(apiEvent);
                    var newArtists = Mapper.MapToDatabaseTableArtists(apiEvent);
                    var newGenres = Mapper.MapToDatabaseTableGenres(apiEvent);

                    logger.Info($"Adding ({newEvent.Name}-{newEvent.EventDate}) to Events");
                    logger.Info($"Venue Check: {newVenues.FirstOrDefault()?.Name}");
                    logger.Info($"Artist Check: {newArtists.FirstOrDefault()?.Name}");
                    logger.Info($"Genre Check: {newGenres.FirstOrDefault()?.Name}");
                    events[$"{newEvent.Name}-{newEvent.EventDate}"] = (newEvent, newVenues, newArtists, newGenres);
                    uniqueVenues.UnionWith(newVenues);
                    uniqueArtists.UnionWith(newArtists);
                    uniqueGenres.UnionWith(newGenres);
                }

                // insert
                var pgClient = new PostgresClient(logger, config);
                // insert venues, artists, genres
                await pgClient.Query("SELECT COUNT(*) FROM ArtistsRaw;");
                // add venueIds EventsRaw
                // insert EventsRaw
                // foreach
            }
        }
        catch (Exception ex)
        {
            logger.Error("Global Error", exception: ex);
        }
    }
}