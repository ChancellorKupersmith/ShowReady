using System;
using System.Collections.Concurrent;
using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace DaUtils.APIs
{
    public class ApiClientService(DaLogger logger, string pipeName, IApiClient apiClient)
    {
        private readonly ConcurrentQueue<ValueTuple<ApiRequest, NamedPipeServerStream>> _queue = new();
        private readonly CancellationTokenSource _cancellationTokenSource = new();

        public void Stop()
        {
            _cancellationTokenSource.Cancel();
        }
        public void Start()
        {
            Task.Factory.StartNew(ListenForConnections, TaskCreationOptions.LongRunning);
            Task.Factory.StartNew(ProcessQueue, TaskCreationOptions.LongRunning);
        }

        private async Task ListenForConnections()
        {
            try
            {
                while (!_cancellationTokenSource.IsCancellationRequested)
                {
                    var pipe = new NamedPipeServerStream(pipeName, PipeDirection.InOut, NamedPipeServerStream.MaxAllowedServerInstances, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
                
                    await pipe.WaitForConnectionAsync(_cancellationTokenSource.Token);

                    using var reader = new StreamReader(pipe, Encoding.UTF8, true, 1024, true);
                    var requestJson = await reader.ReadLineAsync();

                    if (string.IsNullOrEmpty(requestJson)) continue;
                    var request = JsonSerializer.Deserialize<ApiRequest>(requestJson);
                    _queue.Enqueue((Request: request, Pipe: pipe));
                }  
            }
            catch (Exception ex)
            {
                logger.Error("Error, closing pipe server stream.", exception: ex);
                throw;
            }
        }
        private async Task ProcessQueue()
        {
            try
            {
                while (!_cancellationTokenSource.IsCancellationRequested)
                {
                    if(_queue.TryDequeue(out var item))
                    {
                        var (request, pipe) = item;
                        await using(pipe)
                        await using (var writer = new StreamWriter(pipe, Encoding.UTF8, 1024, true))
                        {
                            try
                            {
                                writer.AutoFlush = true;
                                var response = request.Method switch
                                {
                                    RequestMethod.Get => await apiClient.GetAsync(request.Endpoint, request.Parameters),
                                    RequestMethod.Post => await apiClient.PostAsync(request.Endpoint, request.Body),
                                    RequestMethod.Put => await apiClient.PutAsync(request.Endpoint, request.Body),
                                    RequestMethod.Delete => await apiClient.DeleteAsync(request.Endpoint, request.Parameters),
                                    _ => throw new InvalidOperationException("Unsupported HTTP method")
                                };

                                var responseContent = await response.Content.ReadAsStringAsync();
                                await writer.WriteLineAsync(responseContent);
                            }
                            catch (Exception ex)
                            {
                                logger.Error("Error processing queue item, closing pipe server stream", exception: ex);
                            }
                        }
                    }
                    else // queue is empty
                    {
                        await Task.Delay(100);
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Error("Error dequeuing item", exception: ex);
            }
        }
    }
}