using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class EventsArtistsRawDTO
    {
        [Key]
        [Column(Order = 0)]
        public required int EventId { get; set; }

        [Key]
        [Column(Order = 1)]
        public required int ArtistId { get; set; }

        [Column(TypeName = "DATE")]
        public required DateTime EventDate { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime? Created { get; set; }

        [ForeignKey("EventID, EventDate")]
        public required EventsRawDTO EventsRawDto { get; set; }

        [ForeignKey("ArtistID")]
        public required ArtistsRawDTO ArtistsRawDto { get; set; }
    }

    public class EventsArtistsDTO
    {
        [Key]
        [Column(Order = 0)]
        public required int EventId { get; set; }

        [Key]
        [Column(Order = 1)]
        public required int ArtistId { get; set; }

        [Required]
        [Column(TypeName = "DATE")]
        public required DateTime EventDate { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime? Created { get; set; }

        [ForeignKey("EventID, EventDate")]
        public required EventsDTO EventDto { get; set; }

        [ForeignKey("ArtistID")]
        public required ArtistsDTO ArtistDto { get; set; }
    }
}
