using System;
using System.Threading.Tasks;
using DaUtils;
using StartUp;


class Program
{
    static async Task Main()
    {
        DateTime now = DateTime.UtcNow;
        string timestamp = now.ToString("MM-dd-yyyy_HH-mm-ss");
        var logger = new DaLogger($"TM_Seattle({timestamp}).log", LogLvl.Verbose);
        try
        {
            logger.Info("Starting Seattle TicketMaster data aggregation");
            var config = Config.Build();
            
            PostgresClient pgClient = new PostgresClient(logger, config);
            await pgClient.Query("SELECT COUNT(*) FROM ArtistsRaw;");
        }
        catch (Exception ex)
        {
            logger.Error("Global Error", includeStackTrace: true, exception: ex);
        }
        return;
    }
}
