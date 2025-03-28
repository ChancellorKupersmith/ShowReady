using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaUtils.DBs.Models
{
    public class ErrorsDTO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ID")]
        public int Id { get; set; }

        [Column("ErrorMessage")]
        [MaxLength(6000)]
        public string ErrorMessage { get; set; }

        [Column("ObjectID")]
        public int? ObjectId { get; set; }

        [Column("ObjectType")]
        [MaxLength(20)]
        public string ObjectType { get; set; }

        [Column("ObjectContents")]
        public string ObjectContents { get; set; } // Representing JSON as a string

        [Column("Active")]
        public bool Active { get; set; } = true;

        [Column("Created")]
        public DateTime Created { get; set; }

        [Column("Updated")]
        public DateTime? Updated { get; set; }
    }
}