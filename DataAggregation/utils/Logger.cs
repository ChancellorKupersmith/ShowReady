using Serilog;
using Serilog.Events;
using System;
using System.Runtime.CompilerServices;
using System.IO;

namespace DaUtils
{
    public enum LogLvl 
    {
        Verbose = LogEventLevel.Verbose,
        Debug = LogEventLevel.Debug,
        Info = LogEventLevel.Information,
        Warn = LogEventLevel.Warning,
        Error = LogEventLevel.Error,
        Fatal = LogEventLevel.Fatal
    }
    public class DaLogger
    {
        private readonly ILogger _logger;
        public DaLogger(string logFilename, LogLvl logLvl)
        {
            string logFilePath = $"logs/{logFilename}";
            if (File.Exists(logFilePath))
            {
                File.Delete(logFilePath);
            }
            
            _logger = new LoggerConfiguration()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Is((LogEventLevel) logLvl)
                .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level}] {Message}{NewLine}{Exception}")
                .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Infinite, outputTemplate: "{Timestamp} [{Level}] {Message}{NewLine}{Exception}")
                .CreateLogger();
        }

        private void Log(
            LogEventLevel level, string message, bool includeStackTrace,
            string memberName, string sourceFilePath, int sourceLineNumber,
            Exception? exception = null
        )
        {
            if (!includeStackTrace)
            {
                _logger.Write(level, exception, message);
                return;
            }

            // remove path before DataAgggregation dir
            string searchTerm = "DataAggregation";
            int index = sourceFilePath.IndexOf(searchTerm);
            if(index != -1){
                sourceFilePath = sourceFilePath.Substring(index);
            }

            string stackTraceInfo = $"StackTrace: {sourceFilePath} - {memberName}() at line {sourceLineNumber}";
            _logger.Write(level, exception, $"{message}{Environment.NewLine}---- {stackTraceInfo}");
        }
        public void Verbose(
            string msg, bool includeStackTrace = false,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0
        ) => Log(LogEventLevel.Verbose, msg, includeStackTrace, memberName, sourceFilePath, sourceLineNumber);
        public void Debug(            
            string msg, bool includeStackTrace = false,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0
        ) => Log(LogEventLevel.Debug, msg, includeStackTrace, memberName, sourceFilePath, sourceLineNumber);
        public void Info(            
            string msg, bool includeStackTrace = false,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0
        ) => Log(LogEventLevel.Information, msg, includeStackTrace, memberName, sourceFilePath, sourceLineNumber);
        public void Warn(            
            string msg, bool includeStackTrace = false,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0
        ) => Log(LogEventLevel.Warning, msg, includeStackTrace, memberName, sourceFilePath, sourceLineNumber);
        public void Error(            
            string msg, bool includeStackTrace = true,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0,
            Exception? exception = null
        ) => Log(LogEventLevel.Error, $"{msg}; ExceptionMsg: {exception.Message}", includeStackTrace, memberName, sourceFilePath, sourceLineNumber, exception);
        public void Fatal(            
            string msg, bool includeStackTrace = true,
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string sourceFilePath = "",
            [CallerLineNumber] int sourceLineNumber = 0,
            Exception? exception = null
        ) => Log(LogEventLevel.Fatal, $"{msg}; ExceptionMsg: {exception.Message}", includeStackTrace, memberName, sourceFilePath, sourceLineNumber, exception);
    }
}