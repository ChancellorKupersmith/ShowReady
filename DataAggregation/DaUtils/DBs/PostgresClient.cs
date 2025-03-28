using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace DaUtils.DBs
{
    /*  PostgresClient notes
    - Executes queries to multiple DBs to keep all updated: (I understand how weird this feature is and wouldn't be reasonable on a large team, but I'm the solo dev on project so bite me)
        !!!WHEN DEVELOPING OR TESTING MAKE SURE DB_SYNC IS SET TO INTENDED TARGET!!!
        Multiple DBs are targeted based on config variable DB_SYNC, this variable also dictates which relevant db rows to return.
        - case(DB_SYNC = 'PROD'): sends queries to dev, prod dbs; returns prod db reader
        - case(DB_SYNC = 'TEST'): sends queries to dev, test dbs; returns test db reader
        - case(DB_SYNC = 'DEV'): sends queries to dev db; returns dev db reader
    - Created credentials and pg connection class to enable db name trace logging without exposing sensitive credentials from connection strings
    */
    public class PostgresClient
    {
        private class Credentials(string? db, string? host, string? user, string? password)
            : IDisposable
        {
            public string? Db = db;
            public string? Host = host;
            public string? User = user;
            public string? Password = password;

            public void Dispose()
            {
                Db = null;
                Host = null;
                User = null;
                Password = null;
            }
        }
        private class PgConnection
        {
            public readonly string Db;
            public readonly NpgsqlConnection Connection;
            public PgConnection(Credentials credentials)
            {
                Db = credentials.Db != null ? credentials.Db : "None";
                var connectionString = $"Host={credentials.Host};Database={credentials.Db};Username={credentials.User};Password={credentials.Password}";
                Connection = new NpgsqlConnection(connectionString);
            }
        }
        private readonly List<PgConnection> _connections;
        private readonly DaLogger _logger;
        public PostgresClient(DaLogger logger, IConfiguration config)
        {
            _logger = logger;
            var credentials = new List<Credentials>();
            switch(config["DB_SYNC"])
            {
                // Appending order matters to ensure correct db reader is returned
                case "PROD":
                    credentials.Add(new Credentials(
                        db: config["PROD_DB"],
                        host: config["PROD_DB_HOST"],
                        user: config["PROD_DB_USER"],
                        password: config["PROD_DB_PASSWORD"]
                    ));
                    credentials.Add(new Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                case "TEST":
                    credentials.Add(new Credentials(
                        db: config["TEST_DB"],
                        host: config["TEST_DB_HOST"],
                        user: config["TEST_DB_USER"],
                        password: config["TEST_DB_PASSWORD"]
                    ));
                    credentials.Add(new Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                case "DEV":
                    credentials.Add(new Credentials(
                        db: config["DEV_DB"],
                        host: config["DEV_DB_HOST"],
                        user: config["DEV_DB_USER"],
                        password: config["DEV_DB_PASSWORD"]
                    ));
                    break;
                default:
                    _logger.Warn($"Invalid DB_SYNC: {config["DB_SYNC"]}");
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
                    _logger.Debug($"Connected to pg dba: {pgConnection.Db}");
                }
                catch (Exception ex)
                {
                    _logger.Error($"Failed to connect to pg db: {pgConnection.Db}", exception: ex);
                }
            }));
        }
        private void Disconnect()
        {
            foreach(var pgConnection in _connections)
            {
                try
                {
                    pgConnection.Connection.Dispose();
                    _logger.Debug($"Disconnected from pg db: {pgConnection.Db}");
                }
                catch (Exception ex)
                {
                    _logger.Error($"Failed to disconnect from pg db: {pgConnection.Db}", exception: ex);
                }
            }
        }
        public async Task Query(string query)
        {
            await ConnectAsync();
            foreach(var pgConnection in _connections)
            {
                await using var command = new NpgsqlCommand(query, pgConnection.Connection);
                try
                {
                    var numAffectedRows = await command.ExecuteNonQueryAsync();
                    _logger.Verbose($"Affected {numAffectedRows} rows for db: {pgConnection.Db}");
                }
                catch (Exception ex)
                {
                    _logger.Error($"Failed to execute query for db: {pgConnection.Db}", exception: ex);
                }
            }
            Disconnect();
        }
        public async Task<NpgsqlDataReader> QueryRead(string query)
        {
            await ConnectAsync();
            var reader = await _connections.Select(async pgConnection => {
                using (var command = new NpgsqlCommand(query, pgConnection.Connection))
                {
                    try
                    {
                        var reader = await command.ExecuteReaderAsync();
                        var rowsAffected = reader.RecordsAffected;
                        _logger.Verbose($"Affected {rowsAffected} rows for db: {pgConnection.Db}");
                        return reader;
                    }
                    catch (Exception ex)
                    {
                        _logger.Error($"Failed to execute query for db: {pgConnection.Db}", exception: ex);
                        return null;
                    }
                }
            }).FirstOrDefault();
            Disconnect();
            return reader;
        }
    }
}