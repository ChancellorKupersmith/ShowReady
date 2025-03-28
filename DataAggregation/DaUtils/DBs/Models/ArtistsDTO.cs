using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace DaUtils.DBs.Models
{
    public class ArtistsRawDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public required string Name { get; init; }

        [MaxLength(30)]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [MaxLength(600)]
        public string? SpotifyImg { get; set; }

        [MaxLength(600)]
        public string? LastFmUrl { get; set; }

        [MaxLength(600)]
        public string? LastFmImg { get; set; }

        [MaxLength(600)]
        public string? Website { get; set; }

        [MaxLength(100)]
        public string? Mbid { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        [MaxLength(600)]
        public string? TmImg { get; set; }
        
        [MaxLength(600)]
        public string? ItunesUrl { get; set; }
        
        [MaxLength(600)]
        public string? Wiki { get; set; }
        
        [MaxLength(600)]
        public string? Instagram { get; set; }

        [MaxLength(600)]
        public string? Source { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }
        
        public override bool Equals(object? obj)
        {
            if(obj == null || GetType() != obj.GetType()) return false;
            var a = (ArtistsRawDTO)obj;
            return (
                Tmid == a.Tmid &&
                Mbid == a.Mbid &&
                string.Equals(SpotifyExternalId, a.SpotifyExternalId, StringComparison.Ordinal) &&
                string.Equals(LastFmUrl, a.LastFmUrl, StringComparison.Ordinal)
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
                hash = hash * 23 + (Mbid?.GetHashCode() ?? 0);
                hash = hash * 23 + (SpotifyExternalId?.GetHashCode() ?? 0);
                hash = hash * 23 + (LastFmUrl?.GetHashCode() ?? 0);
                hash = hash * 23 + Name.GetHashCode();
                return hash;
            }
        }
    }

    [Index(nameof(Name), IsUnique = true)]
    [Index(nameof(SpotifyExternalId), IsUnique = true)]
    [Index(nameof(LastFmUrl), IsUnique = true)]
    [Index(nameof(Website), IsUnique = true)]
    [Index(nameof(Mbid), IsUnique = true)]
    [Index(nameof(Tmid), IsUnique = true)]
    public class ArtistsDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public required string Name { get; set; }

        [MaxLength(30)]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [MaxLength(600)]
        public string? SpotifyImg { get; set; }

        [MaxLength(600)]
        public string? LastFmUrl { get; set; }

        [MaxLength(600)]
        public string? LastFmImg { get; set; }

        [MaxLength(600)]
        public string? Website { get; set; }

        [MaxLength(100)]
        public string? Mbid { get; set; }

        [MaxLength(36)]
        public string? Tmid { get; set; }

        [MaxLength(600)]
        public string? TmImg { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }
    }
}