using System;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace DaUtils
{
    public static class StartUp
    {
        public static class Config
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
}