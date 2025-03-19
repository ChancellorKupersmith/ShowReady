using System;
using System.Threading.Tasks;
using DaUtils;


class Program
{
    static async Task Main()
    {
        DaLogger logger = new DaLogger("testing.log", LogLvl.Debug);
        try
        {
            logger.Info("Testing logger", includeStackTrace: true);
        }
        catch (Exception ex)
        {
            logger.Error("Global Error", includeStackTrace: true, exception: ex);
        }
    }
}
