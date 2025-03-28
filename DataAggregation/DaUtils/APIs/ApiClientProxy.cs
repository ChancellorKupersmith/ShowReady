using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DaUtils.APIs
{
    public class ApiClientProxy(DaLogger logger, string pipeName)
    {
        public async Task<string?> CallApiAsync(ApiRequest request)
        {
            await using var pipeClient = new NamedPipeClientStream(".", pipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
            await pipeClient.ConnectAsync();

            await using var writer = new StreamWriter(pipeClient, Encoding.UTF8, leaveOpen: true);
            writer.AutoFlush = true;
            using var reader = new StreamReader(pipeClient, Encoding.UTF8, leaveOpen: true);
            var requestJson = JsonSerializer.Serialize(request);
            logger.Verbose($"sending request: {requestJson}");
            await writer.WriteLineAsync(requestJson);

            var response = await reader.ReadLineAsync();
            return response;
        }
    }
}
