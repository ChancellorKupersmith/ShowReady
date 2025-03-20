using System;
using System.Threading.Tasks;
using DaUtils;


class Program
{
    static async Task Main()
    {
        DaLogger logger = new DaLogger("testing.log", LogLvl.Verbose);
        try
        {
            logger.Info("Testing logger", includeStackTrace: true);
            PostgresClient pgClient = new PostgresClient(logger);
            await pgClient.Query("SELECT COUNT(*) FROM ArtistsRaw;");
            
        }
        catch (Exception ex)
        {
            logger.Error("Global Error", includeStackTrace: true, exception: ex);
        }
        return;
    }
}
