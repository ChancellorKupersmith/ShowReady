using System.Collections.Generic;

namespace DaUtils.APIs
{
    public enum RequestMethod
    {
        Get,
        Post,
        Put,
        Delete
    }
    public class ApiRequest
    {
        public required RequestMethod Method { get; init; }
        public required string Endpoint { get; init; }
        public Dictionary<string, string>? Parameters { get; init; }
        public object? Body { get; init; }
    }
}