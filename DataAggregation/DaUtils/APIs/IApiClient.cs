using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace DaUtils.APIs
{
    public interface IApiClient
    {
        string ApiBaseAddress { get; }
        HttpClient HttpClient { get; }
        Task<HttpResponseMessage> GetAsync(string endpoint, Dictionary<string, string>? parameters = null);
        Task<HttpResponseMessage> PostAsync(string endpoint, object requestBody);
        Task<HttpResponseMessage> PutAsync(string endpoint, object requestBody);
        Task<HttpResponseMessage> DeleteAsync(string endpoint, Dictionary<string, string>? parameters = null);
    }
}