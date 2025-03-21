using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace StartUp
{
    public class Config
    {

        public static IConfiguration Build()
        {
            var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("secrets.json", optional: false, reloadOnChange: true);
            return builder.Build();
        }
    }
}