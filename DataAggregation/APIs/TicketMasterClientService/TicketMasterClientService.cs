using System;
using System.Threading.Tasks;
using DaUtils;
using DaUtils.APIs;

/* TM Service Notes
 - TicketMaster enforces rate limits based on api key so this service acts as single point of interaction to ensure rate limit is respected between parallel processes.
 - Make sure to include as required dependency for any SystemD services using ticketmaster
*/
namespace TicketMasterClientService;

static class TicketMasterClientService
{
    private static Task Main()
    {
        var now = DateTime.UtcNow;
        var timestamp = now.ToString("MM-dd-yyyy_HH-mm-ss");
        var logger = new DaLogger($"TM_API_CLIENT_SERVICE({timestamp}).log", LogLvl.Verbose);
        logger.Info("Starting TicketMaster API Client Service");
        var config = StartUp.Config.Build();
        var tmClient = new TicketMasterClientSingleton(logger, config);
        var apiClientService = new ApiClientService(logger, Constants.TicketMaster.PipeName, tmClient);
        try
        {
            apiClientService.Start();
            // Keep the application alive
            Console.WriteLine("Press Enter to exit...");
            Console.ReadLine();
        }
        catch (Exception ex)
        {
            logger.Error("Error running ApiClientService", exception: ex);
        }
        finally
        {
            apiClientService.Stop();
        }

        return Task.CompletedTask;
    }
}