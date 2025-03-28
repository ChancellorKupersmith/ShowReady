using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class AlbumsRawDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string? Title { get; set; }

        [MaxLength(30)]
        [Column(TypeName = "VARCHAR")]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [MaxLength(600)]
        [Column(TypeName = "VARCHAR")]
        public string? LastFmUrl { get; set; }

        [ForeignKey("Artist")]
        public int? ArtistId { get; set; }

        public bool? SpotifyFound { get; set; }

        public bool? LastFmFound { get; set; }

        [MaxLength(600)]
        [Column(TypeName = "VARCHAR")]
        public string? Source { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }

        public virtual ArtistsDTO? Artist { get; set; }
    }

    public class AlbumsDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(300)]
        public required string Title { get; set; }

        [MaxLength(30)]
        [Column(TypeName = "VARCHAR")]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [MaxLength(600)]
        [Column(TypeName = "VARCHAR")]
        public string? LastFmUrl { get; set; }

        [ForeignKey("Artist")]
        public required int ArtistId { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime Created { get; set; }

        public DateTime? Updated { get; set; }

        public virtual required ArtistsDTO ArtistDto { get; set; }
    }
}