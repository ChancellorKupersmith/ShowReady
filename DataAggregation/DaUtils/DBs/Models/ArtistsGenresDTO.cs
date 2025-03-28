using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class ArtistsGenresRawDTO
    {
        [Key]
        [Column(Order = 0)]
        [ForeignKey("ArtistsRaw")]
        public required int ArtistId { get; set; }

        [Key]
        [Column(Order = 1)]
        [ForeignKey("Genres")]
        public required int GenreId { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime? Created { get; set; }

        public required ArtistsRawDTO ArtistsRawDto { get; set; }
        public required GenresDTO GenresDto { get; set; }
    }

    public class ArtistsGenresDTO
    {
        [Key]
        [Column(Order = 0)]
        [ForeignKey("Artists")]
        public required int ArtistId { get; set; }

        [Key]
        [Column(Order = 1)]
        [ForeignKey("Genres")]
        public required int GenreId { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime? Created { get; set; }

        public required ArtistsDTO ArtistsDto { get; set; }
        public required GenresDTO GenresDto { get; set; }
    }
}