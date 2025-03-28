using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class EventsRawDTO
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string? Name { get; set; }

        [MaxLength(600)]
        public string? Url { get; set; }

        [MaxLength(600)]
        public string? TicketsLink { get; set; }

        [MaxLength(100)]
        public string? Price { get; set; }

        [Required]
        [Column(Order = 1)]
        [DataType(DataType.Date)]
        public DateTime? EventDate { get; set; }

        [MaxLength(100)]
        public string? EventTime { get; set; }

        [MaxLength(50)]
        public string? AgeRestrictions { get; set; }

        [MaxLength(6000)]
        public string? Summary { get; set; }

        [MaxLength(600)]
        public string? EoUrl { get; set; }

        [MaxLength(600)]
        public string? EoImg { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        [MaxLength(600)]
        public string? TmImg { get; set; }

        public int? VenueId { get; set; }

        [MaxLength(600)]
        public string? Source { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }

        [ForeignKey("VenueID")]
        public VenuesRawDTO? VenuesRaw { get; set; }
    }

    public class EventsDTO
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public required string Name { get; set; }

        [MaxLength(600)]
        public string? Url { get; set; }

        [MaxLength(600)]
        public string? TicketsLink { get; set; }

        public float? PriceMin { get; set; }

        public float? PriceMax { get; set; }

        [Required]
        [Column(Order = 1)]
        [DataType(DataType.Date)]
        public required DateTime EventDate { get; set; }

        [MaxLength(100)]
        public string? EventTime { get; set; }

        [MaxLength(50)]
        public string? AgeRestrictions { get; set; }

        [MaxLength(6000)]
        public string? Summary { get; set; }

        [MaxLength(600)]
        public string? EoImg { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        [MaxLength(600)]
        public string? TmImg { get; set; }

        public required int VenueId { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }

        [ForeignKey("VenueID")]
        public VenuesDTO? Venues { get; set; } // Navigation property
    }
}