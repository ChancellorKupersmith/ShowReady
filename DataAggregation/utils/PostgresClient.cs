using Npgsql;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;

namespace DaUtils
{
    /*  PostgresClient notes
    - Executes querys to multiple DBs to keep all updated: (I understand how weird this feature is and wouldn't be reasonable on a large team but I'm the solo dev on project so bite me)
        !!!WHEN DEVELOPING OR TESTING MAKE SURE DB_SYNC IS SET TO INTENDED TARGET!!!
        Multiple DBs are targeted based on env variable DB_SYNC, this variable also dictates which relevant db rows to return.
        - case(env = 'PROD'): sends queries to dev, prod dbs; returns prod db reader
        - case(env = 'TEST'): sends queries to dev, test dbs; returns test db reader
        - case(env = 'DEV'): sends queries to dev db; returns dev db reader
    - Created credentials and pg connection class to enable db name trace logging without exposing sensitive credentials from connection strings
    - private declaration ensures sensitive data in connection string is only readable from within PostgresClient class. (this is needed because Npgsql ConnectionString prop is public https://www.npgsql.org/doc/api/Npgsql.NpgsqlConnection.html)
    */
    public class PostgresClient
    {
        private class Credentials : IDisposable
        {
            public string? DB;
            public string? Host;
            public string? User;
            public string? Password;
            public Credentials(string? db, string? host, string? user, string? password)
            {
                DB = db;
                Host = host;
                User = user;
                Password = password;
            }
            public void Dispose()
            {
                DB = null;
                Host = null;
                User = null;
                Password = null;
            }
        }
        private class PgConnection
        {
            public readonly string DB;
            public NpgsqlConnection Connection;
            public PgConnection(PostgresClient.Credentials credentials)
            {
                DB = credentials.DB != null ? credentials.DB : "None";
                string connectionString = $"Host={credentials.Host};Database={credentials.DB};Username={credentials.User};Password={credentials.Password}";
                Connection = new NpgsqlConnection(connectionString);
            }
        }
        private readonly List<PgConnection> _connections;
        private readonly DaLogger _logger;
        public PostgresClient(DaLogger logger)
        {
            _logger = logger;
            
            List<PostgresClient.Credentials> credentials = new List<Credentials>();
            var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("secrets.json", optional: false, reloadOnChange: true);
            var config = builder.Build();
            switch(config["DB_SYNC"])
            {
                // Appending order matters to ensure correct db reader is returned
                case "PROD":
                    credentials.Add(new PostgresClient.Credentials(
                        db: config["PROD_DB"],
                        host: config["PROD_DB_HOST"],
                        user: config["PROD_DB_USER"],
                        password: config["PROD_DB_PASSWORD"]
                    ));
                    credentials.Add(new PostgresClient.Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                case "TEST":
                    credentials.Add(new PostgresClient.Credentials(
                        db: config["TEST_DB"],
                        host: config["TEST_DB_HOST"],
                        user: config["TEST_DB_USER"],
                        password: config["TEST_DB_PASSWORD"]
                    ));
                    credentials.Add(new PostgresClient.Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                case "DEV":
                    credentials.Add(new PostgresClient.Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                default:
                    _logger.Warn($"Invaild DB_SYNC: {config["DB_SYNC"]}");
                    break;
            }
            
            _connections = credentials.Select(credential => {
                var connection = new PgConnection(credential);
                credential.Dispose();
                return connection;
            }).ToList();
        }
        private async Task ConnectAsync()
        {

            await Task.WhenAll(_connections.Select(async pgConnection => {
                try
                {
                    await pgConnection.Connection.OpenAsync();
                    _logger.Debug($"Connected to pg db: {pgConnection.DB}");
                }
                catch (Exception ex)
                {
                    _logger.Error($"Failed to connect to pg db: {pgConnection.DB}", exception: ex);
                }
            }));
        }
        private void Disconnet()
        {
            _connections.Select(async pgConnection => {
                try
                {
                    pgConnection.Connection.Dispose();
                    _logger.Debug($"Disconnected from pg db: {pgConnection.DB}");
                }
                catch (Exception ex)
                {
                    _logger.Error($"Failed to disconnect from pg db: {pgConnection.DB}", exception: ex);
                }
            });
        }
        public async Task Query(string query)
        {
            await ConnectAsync();
            _connections.Select(async pgConnection => {
                using (var command = new NpgsqlCommand(query, pgConnection.Connection))
                {
                    try
                    {
                        int numAffectedRows = await command.ExecuteNonQueryAsync();
                        _logger.Verbose($"Affected {numAffectedRows} rows for db: {pgConnection.DB}");
                    }
                    catch (Exception ex)
                    {
                        _logger.Error($"Failed to execute query for db: {pgConnection.DB}", exception: ex);
                    }
                }
            });
            Disconnet();
        }
        public async Task<NpgsqlDataReader> QueryRead(string query)
        {
            await ConnectAsync();
            NpgsqlDataReader reader = await _connections.Select(async pgConnection => {
                using (var command = new NpgsqlCommand(query, pgConnection.Connection))
                {
                    try
                    {
                        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
                        var rowsAffected = reader.RecordsAffected;
                        _logger.Verbose($"Affected {rowsAffected} rows for db: {pgConnection.DB}");
                        return reader;
                    }
                    catch (Exception ex)
                    {
                        _logger.Error($"Failed to execute query for db: {pgConnection.DB}", exception: ex);
                        return null;
                    }
                }
            }).FirstOrDefault();
            Disconnet();
            return reader;
        }
    }
}