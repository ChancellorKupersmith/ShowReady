using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{

    public class SongsRawDTO
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [StringLength(300)]
        public required string Title { get; set; }

        [Key]
        [Column(Order = 1)]
        [ForeignKey("Artist")]
        public int? ArtistId { get; set; }

        [ForeignKey("Album")]
        public int? AlbumId { get; set; }

        public int? AlbumTrackNum { get; set; }

        [StringLength(100)]
        public string? Mbid { get; set; }

        [StringLength(30)]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [StringLength(600)]
        public string? SpotifyPreviewUrl { get; set; }

        [StringLength(600)]
        public string? LastFmUrl { get; set; }

        [StringLength(600)]
        public string? YtUrl { get; set; }

        public bool? YtFound { get; set; }

        [StringLength(600)]
        public string? Source {get; set;}

        public DateTime? Created { get; set; }
        public DateTime? Updated { get; set; }

        public ArtistsDTO? Artist { get; set; }
        public AlbumsDTO? Album { get; set; }
    }

    public class SongsDTO
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [StringLength(300)]
        public required string Title { get; set; }

        [Key]
        [Column(Order = 1)]
        [ForeignKey("Artist")]
        public required int ArtistId { get; set; }

        [ForeignKey("Album")]
        public int? AlbumId { get; set; }

        public int? AlbumTrackNum { get; set; }

        [StringLength(100)]
        public string? Mbid { get; set; }

        [StringLength(30)]
        public string? SpotifyExternalId { get; set; }

        public int? SpotifyPopularity { get; set; }

        [StringLength(600)]
        public string? SpotifyPreviewUrl { get; set; }

        [StringLength(600)]
        public string? LastFmUrl { get; set; }

        [StringLength(600)]
        public string? YtUrl { get; set; }

        public bool? YtFound { get; set; }

        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }

        public required ArtistsDTO ArtistDto { get; set; }
        public required AlbumsDTO AlbumDto { get; set; }
    }
}