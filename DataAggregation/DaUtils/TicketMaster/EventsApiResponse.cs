using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace DaUtils.TicketMaster
{
    public class EventResponse
    {
        [JsonProperty("_links")]
        public Links? Links { get; set; }

        [JsonProperty("_embedded")]
        public Embedded? Embedded { get; set; }

        [JsonProperty("page")]
        public Page? Page { get; set; }
    }

    public class Links
    {
        [JsonProperty("self")]
        public Link? Self { get; set; }

        [JsonProperty("next")]
        public Link? Next { get; set; }
    }

    public class Link
    {
        [JsonProperty("href")]
        public string? Href { get; set; }

        [JsonProperty("templated")]
        public bool? Templated { get; set; }
    }

    public class Embedded
    {
        [JsonProperty("events")]
        public List<Event>? Events { get; set; }
    }

    public interface IClassifications
    {
        [JsonProperty("classifications")]
        public List<Classification>? Classifications { get; set; }
    }

    public class Event : IClassifications
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("test")]
        public bool? Test { get; set; }

        [JsonProperty("url")]
        public string? Url { get; set; }

        [JsonProperty("locale")]
        public string? Locale { get; set; }

        [JsonProperty("images")]
        public List<Image>? Images { get; set; }

        [JsonProperty("sales")]
        public Sales? Sales { get; set; }

        [JsonProperty("dates")]
        public Dates? Dates { get; set; }

        [JsonProperty("priceRanges")]
        public List<PriceRange>? PriceRanges { get; set; }

        [JsonProperty("classifications")]
        public List<Classification>? Classifications { get; set; }

        [JsonProperty("promoter")]
        public Promoter? Promoter { get; set; }

        [JsonProperty("_links")]
        public EventLinks? Links { get; set; }

        [JsonProperty("_embedded")]
        public EventEmbedded? Embedded { get; set; }

        [JsonProperty("place")]
        public Place? Place { get; set; }
    }

    public class Image
    {
        [JsonProperty("ratio")]
        public string? Ratio { get; set; }

        [JsonProperty("url")]
        public string? Url { get; set; }

        [JsonProperty("width")]
        public int? Width { get; set; }

        [JsonProperty("height")]
        public int? Height { get; set; }

        [JsonProperty("fallback")]
        public bool? Fallback { get; set; }
    }

    public class Sales
    {
        [JsonProperty("public")]
        public Public? Public { get; set; }
    }

    public class Public
    {
        [JsonProperty("startDateTime")]
        public DateTime? StartDateTime { get; set; }

        [JsonProperty("startTBD")]
        public bool? StartTbd { get; set; }

        [JsonProperty("endDateTime")]
        public DateTime? EndDateTime { get; set; }
    }

    public class Dates
    {
        [JsonProperty("start")]
        public Start? Start { get; set; }

        [JsonProperty("timezone")]
        public string? Timezone { get; set; }

        [JsonProperty("status")]
        public Status? Status { get; set; }
    }

    public class Start
    {
        [JsonProperty("localDate")]
        public DateTime? LocalDate { get; set; }

        [JsonProperty("localTime")]
        public string? LocalTime { get; set; }

        [JsonProperty("dateTBD")]
        public bool? DateTbd { get; set; }

        [JsonProperty("dateTBA")]
        public bool? DateTba { get; set; }

        [JsonProperty("timeTBA")]
        public bool? TimeTba { get; set; }

        [JsonProperty("noSpecificTime")]
        public bool? NoSpecificTime { get; set; }
    }

    public class PriceRange
    {
        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("currency")]
        public string? Currency { get; set; }

        [JsonProperty("min")]
        public float Min { get; set; }

        [JsonProperty("max")]
        public float Max { get; set; }

    }

    public class Status
    {
        [JsonProperty("code")]
        public string? Code { get; set; }
    }

    public class Classification
    {
        [JsonProperty("primary")]
        public bool? Primary { get; set; }

        [JsonProperty("segment")]
        public Segment? Segment { get; set; }

        [JsonProperty("genre")]
        public Genre? Genre { get; set; }

        [JsonProperty("subGenre")]
        public Genre? SubGenre { get; set; }
    }

    public class Segment
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("name")]
        public string? Name { get; set; }
    }

    public class Genre
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("name")]
        public string? Name { get; set; }
    }

    public class Promoter
    {
        [JsonProperty("id")]
        public string? Id { get; set; }
    }

    public class EventLinks
    {
        [JsonProperty("self")]
        public Link? Self { get; set; }

        [JsonProperty("attractions")]
        public List<Link>? Attractions { get; set; }

        [JsonProperty("venues")]
        public List<Link>? Venues { get; set; }
    }

    public class EventEmbedded
    {
        [JsonProperty("venues")]
        public List<Venue>? Venues { get; set; }

        [JsonProperty("attractions")]
        public List<Attraction>? Attractions { get; set; }
    }

    public class Place
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("area")]
        public Area? Area { get; set; }

        [JsonProperty("postalCode")]
        public string? PostalCode { get; set; }

        [JsonProperty("city")]
        public City? City { get; set; }

        [JsonProperty("state")]
        public State? State { get; set; }

        [JsonProperty("country")]
        public Country? Country { get; set; }

        [JsonProperty("address")]
        public Address? Address { get; set; }

        [JsonProperty("location")]
        public Location? Location { get; set; }

        [JsonProperty("externalLinks")]
        public ExternalLink? ExternalLinks { get; set; }
    }

    public class Area
    {
        [JsonProperty("name")]
        public string? Name { get; set; }
    }
    public class Venue
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("test")]
        public bool? Test { get; set; }

        [JsonProperty("locale")]
        public string? Locale { get; set; }

        [JsonProperty("postalCode")]
        public string? PostalCode { get; set; }

        [JsonProperty("timezone")]
        public string? Timezone { get; set; }

        [JsonProperty("city")]
        public City? City { get; set; }

        [JsonProperty("state")]
        public State? State { get; set; }

        [JsonProperty("country")]
        public Country? Country { get; set; }

        [JsonProperty("address")]
        public Address? Address { get; set; }

        [JsonProperty("location")]
        public Location? Location { get; set; }

        [JsonProperty("markets")]
        public List<Market>? Markets { get; set; }

        [JsonProperty("_links")]
        public Link? Links { get; set; }
    }

    public class City
    {
        [JsonProperty("name")]
        public string? Name { get; set; }
    }

    public class State
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("stateCode")]
        public string? StateCode { get; set; }
    }

    public class Country
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("countryCode")]
        public string? CountryCode { get; set; }
    }

    public class Address
    {
        [JsonProperty("line1")]
        public string? Line1 { get; set; }
    }

    public class Location
    {
        [JsonProperty("longitude")]
        public string? Longitude { get; set; }

        [JsonProperty("latitude")]
        public string? Latitude { get; set; }
    }

    public class Market
    {
        [JsonProperty("id")]
        public string? Id { get; set; }
    }

    public class Attraction : IClassifications
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("test")]
        public bool? Test { get; set; }

        [JsonProperty("locale")]
        public string? Locale { get; set; }

        [JsonProperty("images")]
        public List<Image>? Images { get; set; }

        [JsonProperty("classifications")]
        public List<Classification>? Classifications { get; set; }

        [JsonProperty("_links")]
        public Link? Links { get; set; }
        
        [JsonProperty("externalLinks")]
        public ExternalLink? ExternalLinks { get; set; }
    }

    [JsonObject]
    public class ExternalLink
    {
        [JsonProperty("lastfm")]
        public List<ELink>? LastFMs { get; set; }

        [JsonProperty("spotify")]
        public List<ELink>? Spotifys { get; set; }

        [JsonProperty("homepage")]
        public List<ELink>? Websites { get; set; }

        [JsonProperty("musicbrainz")]
        public List<MusicBrainz>? MusicBrainzs { get; set; }

        [JsonProperty("itunes")]
        public List<ELink>? Itunes { get; set; }

        [JsonProperty("wiki")]
        public List<ELink>? Wiki { get; set; }

        [JsonProperty("instagram")]
        public List<ELink>? Instagram { get; set; }
        
        public class ELink
        {
            [JsonProperty("url")]
            public string? Url { get; set; }
        }

        public class MusicBrainz
        {
            [JsonProperty("id")]
            public string? Id { get; set; }
        }

    }

    public class Page
    {
        [JsonProperty("size")]
        public int? Size { get; set; }

        [JsonProperty("totalElements")]
        public int? TotalElements { get; set; }

        [JsonProperty("totalPages")]
        public int? TotalPages { get; set; }

        [JsonProperty("number")]
        public int? Number { get; set; }
    }

    /* Mock String EventsApiResponse 
    "{
        "_links":  {
            "self":  {
            "href": "/discovery/v2/events.json?size=1{&page,sort}",
            "templated": true
            },
            "next":  {
            "href": "/discovery/v2/events.json?page=1&size=1{&sort}",
            "templated": true
            }
        },
        "_embedded":  {
            "events":  [
            {
                "name": "WGC Cadillac Championship - Sunday Ticket",
                "type": "event",
                "id": "vvG1VZKS5pr1qy",
                "test": false,
                "url": "http://ticketmaster.com/event/0E0050681F51BA4C",
                "locale": "en-us",
                "images":  [
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_LANDSCAPE_16_9.jpg",
                    "width": 1136,
                    "height": 639,
                    "fallback": false
                },
                {
                    "ratio": "3_2",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_PORTRAIT_3_2.jpg",
                    "width": 640,
                    "height": 427,
                    "fallback": false
                },
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_LARGE_16_9.jpg",
                    "width": 2048,
                    "height": 1152,
                    "fallback": false
                },
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_16_9.jpg",
                    "width": 1024,
                    "height": 576,
                    "fallback": false
                },
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_EVENT_DETAIL_PAGE_16_9.jpg",
                    "width": 205,
                    "height": 115,
                    "fallback": false
                },
                {
                    "ratio": "3_2",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_ARTIST_PAGE_3_2.jpg",
                    "width": 305,
                    "height": 203,
                    "fallback": false
                },
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_PORTRAIT_16_9.jpg",
                    "width": 640,
                    "height": 360,
                    "fallback": false
                },
                {
                    "ratio": "4_3",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_CUSTOM.jpg",
                    "width": 305,
                    "height": 225,
                    "fallback": false
                },
                {
                    "ratio": "16_9",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RECOMENDATION_16_9.jpg",
                    "width": 100,
                    "height": 56,
                    "fallback": false
                },
                {
                    "ratio": "3_2",
                    "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_3_2.jpg",
                    "width": 1024,
                    "height": 683,
                    "fallback": false
                }
                ],
                "sales":  {
                "public":  {
                    "startDateTime": "2015-10-02T11:00:00Z",
                    "startTBD": false,
                    "endDateTime": "2016-03-06T23:00:00Z"
                }
                },
                "dates":  {
                "start":  {
                    "localDate": "2016-03-06",
                    "dateTBD": false,
                    "dateTBA": false,
                    "timeTBA": true,
                    "noSpecificTime": false
                },
                "timezone": "America/New_York",
                "status":  {
                    "code": "offsale"
                }
                },
                "classifications":  [
                {
                    "primary": true,
                    "segment":  {
                    "id": "KZFzniwnSyZfZ7v7nE",
                    "name": "Sports"
                    },
                    "genre":  {
                    "id": "KnvZfZ7vAdt",
                    "name": "Golf"
                    },
                    "subGenre":  {
                    "id": "KZazBEonSMnZfZ7vFI7",
                    "name": "PGA Tour"
                    }
                }
                ],
                "promoter":  {
                "id": "682"
                },
                "_links":  {
                "self":  {
                    "href": "/discovery/v2/events/vvG1VZKS5pr1qy?locale=en-us"
                },
                "attractions":  [
                    {
                    "href": "/discovery/v2/attractions/K8vZ917uc57?locale=en-us"
                    }
                ],
                "venues":  [
                    {
                    "href": "/discovery/v2/venues/KovZpZAaEldA?locale=en-us"
                    }
                ]
                },
                "_embedded":  {
                "venues":  [
                    {
                    "name": "Trump National Doral",
                    "type": "venue",
                    "id": "KovZpZAaEldA",
                    "test": false,
                    "locale": "en-us",
                    "postalCode": "33178",
                    "timezone": "America/New_York",
                    "city":  {
                        "name": "Miami"
                    },
                    "state":  {
                        "name": "Florida",
                        "stateCode": "FL"
                    },
                    "country":  {
                        "name": "United States Of America",
                        "countryCode": "US"
                    },
                    "address":  {
                        "line1": "4400 NW 87th Avenue"
                    },
                    "location":  {
                        "longitude": "-80.33854298",
                        "latitude": "25.81260379"
                    },
                    "markets":  [
                        {
                        "id": "15"
                        }
                    ],
                    "_links":  {
                        "self":  {
                        "href": "/discovery/v2/venues/KovZpZAaEldA?locale=en-us"
                        }
                    }
                    }
                ],
                "attractions":  [
                    {
                    "name": "Cadillac Championship",
                    "type": "attraction",
                    "id": "K8vZ917uc57",
                    "test": false,
                    "locale": "en-us",
                    "images":  [
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_LANDSCAPE_16_9.jpg",
                        "width": 1136,
                        "height": 639,
                        "fallback": false
                        },
                        {
                        "ratio": "3_2",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_PORTRAIT_3_2.jpg",
                        "width": 640,
                        "height": 427,
                        "fallback": false
                        },
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_LARGE_16_9.jpg",
                        "width": 2048,
                        "height": 1152,
                        "fallback": false
                        },
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_16_9.jpg",
                        "width": 1024,
                        "height": 576,
                        "fallback": false
                        },
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_EVENT_DETAIL_PAGE_16_9.jpg",
                        "width": 205,
                        "height": 115,
                        "fallback": false
                        },
                        {
                        "ratio": "3_2",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_ARTIST_PAGE_3_2.jpg",
                        "width": 305,
                        "height": 203,
                        "fallback": false
                        },
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RETINA_PORTRAIT_16_9.jpg",
                        "width": 640,
                        "height": 360,
                        "fallback": false
                        },
                        {
                        "ratio": "4_3",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_CUSTOM.jpg",
                        "width": 305,
                        "height": 225,
                        "fallback": false
                        },
                        {
                        "ratio": "16_9",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_RECOMENDATION_16_9.jpg",
                        "width": 100,
                        "height": 56,
                        "fallback": false
                        },
                        {
                        "ratio": "3_2",
                        "url": "http://s1.ticketm.net/dam/a/196/6095e742-64d1-4b15-aeac-c9733c52d196_66341_TABLET_LANDSCAPE_3_2.jpg",
                        "width": 1024,
                        "height": 683,
                        "fallback": false
                        }
                    ],
                    "classifications":  [
                        {
                        "primary": true,
                        "segment":  {
                            "id": "KZFzniwnSyZfZ7v7nE",
                            "name": "Sports"
                        },
                        "genre":  {
                            "id": "KnvZfZ7vAdt",
                            "name": "Golf"
                        },
                        "subGenre":  {
                            "id": "KZazBEonSMnZfZ7vFI7",
                            "name": "PGA Tour"
                        }
                        }
                    ],
                    "_links":  {
                        "self":  {
                        "href": "/discovery/v2/attractions/K8vZ917uc57?locale=en-us"
                        }
                    }
                    }
                ]
                }
            }
            ]
        },
        "page":  {
            "size": 1,
            "totalElements": 87958,
            "totalPages": 87958,
            "number": 0
        }
    }"
    */
}