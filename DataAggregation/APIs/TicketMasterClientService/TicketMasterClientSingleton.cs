using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using DaUtils;
using DaUtils.APIs;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace TicketMasterClientService;

public class TicketMasterClientSingleton(DaLogger logger, IConfiguration config) : IApiClient
{
    public string ApiBaseAddress { get; } = "https://app.ticketmaster.com/discovery/v2";
    public HttpClient HttpClient { get; } = new();
    private readonly string _apiKey = config["TICKET_MASTER_API_KEY"] ?? throw new InvalidOperationException(message: "Service requires api key");
    private readonly RateLimiter _rateLimiter = new(5, TimeSpan.FromSeconds(1));

    public async Task<HttpResponseMessage> GetAsync(string endpoint, Dictionary<string, string>? parameters = null)
    {
        var requestUri = $"{ApiBaseAddress}{endpoint}?apikey={_apiKey}";
        parameters = parameters ?? new Dictionary<string, string>();
        if(parameters.Count > 0)
        {
            var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}"));
            requestUri += $"&{queryString}";
        }
        await _rateLimiter.WaitAsync();
        logger.Info($"URI: {requestUri}");
        return await HttpClient.GetAsync(requestUri);
    }

    public async Task<HttpResponseMessage> PostAsync(string endpoint, object requestBody)
    {
        var requestUri = $"{ApiBaseAddress}{endpoint}?apikey={_apiKey}";
        var content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
        await _rateLimiter.WaitAsync();
        logger.Info($"URI: {requestUri}");
        return await HttpClient.PostAsync(requestUri, content);
    }

    public async Task<HttpResponseMessage> PutAsync(string endpoint, object requestBody)
    {
        var requestUri = $"{ApiBaseAddress}{endpoint}?apikey={_apiKey}";
        var content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
        await _rateLimiter.WaitAsync();
        logger.Info($"URI: {requestUri}");
        return await HttpClient.PutAsync(requestUri, content);
    }

    public async Task<HttpResponseMessage> DeleteAsync(string endpoint, Dictionary<string, string>? parameters = null)
    {
        var requestUri = $"{ApiBaseAddress}{endpoint}?apikey={_apiKey}";
        parameters = parameters ?? new Dictionary<string, string>();
        if(parameters.Count > 0)
        {
            var queryString = string.Join("&", parameters.Select(p => $"{p.Key}={p.Value}"));
            requestUri += $"&{queryString}";
        }
        await _rateLimiter.WaitAsync();
        logger.Info($"URI: {requestUri}");
        return await HttpClient.DeleteAsync(requestUri);
    }
}