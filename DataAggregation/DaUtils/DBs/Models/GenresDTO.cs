using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class GenresDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int? Id { get; set; }

        [Required]
        [MaxLength(255)]
        [Column(TypeName = "citext")]
        public required string Name { get; init; }

        [MaxLength(600)]
        public required string Source { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime? Created { get; set; }

        public DateTime? Updated { get; set; }
        
        public override bool Equals(object? obj)
        {
            if(obj == null || GetType() != obj.GetType()) return false;
            var g = (GenresDTO)obj;
            return string.Equals(Name, g.Name, StringComparison.Ordinal);
        }
        public override int GetHashCode()
        {
            unchecked // Allow arithmetic overflow, which wraps
            {
                // 1. Start with a prime number
                var hash = 17;
                // 2. Combine hash codes of properties compared in equals override
                hash = hash * 23 + Name.GetHashCode();
                return hash;
            }
        }
    }
}