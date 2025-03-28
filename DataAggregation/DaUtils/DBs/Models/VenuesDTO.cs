using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace DaUtils.DBs.Models
{
    public class VenuesRawDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(300)]
        public required string Name { get; set; }

        [MaxLength(511)]
        public string? VenueUrl { get; set; }

        [MaxLength(255)]
        public string? VenueAddress { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Hood { get; set; }

        [MaxLength(6000)]
        public string? Summary { get; set; }

        [MaxLength(511)]
        public string? EoUrl { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [Column(TypeName = "NUMERIC(10, 7)")]
        public decimal? Lat { get; set; }

        [Column(TypeName = "NUMERIC(10, 7)")]
        public decimal? Lng { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        [MaxLength(600)]
        public string? Source { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }

        public override bool Equals(object? obj)
        {
            if(obj == null || GetType() != obj.GetType()) return false;
            var v = (VenuesRawDTO)obj;
            return (
                Tmid == v.Tmid &&
                (Lat == v.Lat && Lng == v.Lng) &&
                string.Equals(VenueAddress, v.VenueAddress, StringComparison.Ordinal) &&
                string.Equals(City, v.City, StringComparison.Ordinal) &&
                string.Equals(Hood, v.Hood, StringComparison.Ordinal) &&
                string.Equals(VenueUrl, v.VenueUrl, StringComparison.Ordinal) &&
                string.Equals(EoUrl, v.EoUrl, StringComparison.Ordinal) &&
                string.Equals(Name, v.Name, StringComparison.Ordinal) &&
                string.Equals(Phone, v.Phone, StringComparison.Ordinal) &&
                string.Equals(Summary, v.Summary, StringComparison.Ordinal)
            );
        }
        public override int GetHashCode()
        {
            unchecked // Allow arithmetic overflow, which wraps
            {
                // 1. Start with a prime number
                var hash = 17;
                // 2. Combine hash codes of properties compared in equals override
                hash = hash * 23 + (Tmid?.GetHashCode() ?? 0);
                hash = hash * 23 + (Lat?.GetHashCode() ?? 0);
                hash = hash * 23 + (Lng?.GetHashCode() ?? 0);
                hash = hash * 23 + (VenueAddress?.GetHashCode() ?? 0);
                hash = hash * 23 + (City?.GetHashCode() ?? 0);
                hash = hash * 23 + (Hood?.GetHashCode() ?? 0);
                hash = hash * 23 + (VenueUrl?.GetHashCode() ?? 0);
                hash = hash * 23 + (EoUrl?.GetHashCode() ?? 0);
                hash = hash * 23 + Name.GetHashCode();
                hash = hash * 23 + (Phone?.GetHashCode() ?? 0);
                hash = hash * 23 + (Summary?.GetHashCode() ?? 0);
                return hash;
            }
        }
    }

    [Index(nameof(EoUrl), IsUnique = true)]
    [Index(nameof(Tmid), IsUnique = true)]
    [Index("venues_unique_name_address", nameof(Name), nameof(VenueAddress), IsUnique = true)]
    public class VenuesDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [MaxLength(300)]
        public string? Name { get; set; }

        [MaxLength(511)]
        public string? VenueUrl { get; set; }

        [MaxLength(255)]
        public string? VenueAddress { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Hood { get; set; }

        [MaxLength(6000)]
        public string? Summary { get; set; }

        [MaxLength(511)]
        public string? EoUrl { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [Column(TypeName = "NUMERIC(10, 7)")]
        public decimal? Lat { get; set; }

        [Column(TypeName = "NUMERIC(10, 7)")]
        public decimal? Lng { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        public DateTime Created { get; set; }
        public DateTime? Updated { get; set; }
        
    }
}