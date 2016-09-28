/**
 * Sahana Eden Mobile - Database Service
 *
 * Copyright (c) 2016: Sahana Software Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

"use strict";

EdenMobile.factory('$emdb', ['$q', function ($q) {

    // @status: work in progress

    /**
     * The table definitions
     */
    var tables = {},
        pendingTables = {};

    /**
     * DB Status Promise
     */
    var dbStatus = $q.defer(),
        dbReady = dbStatus.promise;

    /**
     * Generic error callback for database transactions
     *
     * @param {object} error - the error object
     */
    var errorCallback = function(error) {
        alert("Error processing SQL: " + JSON.stringify(error));
    };

    /**
     * Save the current schema for a table in the database
     *
     * @param {object} db - the database handle
     * @param {string} tableName - the table name
     */
    var saveSchema = function(db, tableName) {

        var table = emSQL.Table('em_schema', tables.em_schema),
            tableSpec = tables[tableName],
            schema = {};

        // Serialize the schema (skip prepop records)
        for (var prop in tableSpec) {
            if (prop != '_records') {
                schema[prop] = tableSpec[prop];
            }
        }

        // @todo: check whether this is an update?

        // Save the schema
        var sql = table.insert({
            'name': tableName,
            'schema': schema
        });
        db.executeSql(sql[0], sql[1], null, errorCallback);
    };

    /**
     * Function to define a new table
     *
     * @param {object} db - the database handle
     * @param {string} tableName - the table name
     * @param {object} schema - the table schema
     * @param {function} callback - function to call upon success
     */
    var defineTable = function(db, tableName, schema, callback) {

        // Prevent re-definition of tables
        if (tables.hasOwnProperty(tableName)) {
            alert('Error: redefinition of ' + tableName + ' table');
            return;
        }

        // Automatically add ID field to schema
        if (tableName != 'em_version' && !schema.hasOwnProperty('id')) {
            schema.id = {type: 'id'};
        }

        // Create the table
        var table = emSQL.Table(tableName, schema),
            sql = [table.drop(), table.create()];
        db.sqlBatch(sql, function() {
            // Add table definition to registry
            tables[tableName] = schema;
            if (tableName == 'em_schema') {
                // Save all existing schemas
                for (tableName in tables) {
                    saveSchema(db, tableName);
                }
            } else if (tables.hasOwnProperty('em_schema')) {
                // Save this schema
                saveSchema(db, tableName);
            }
            // Generate prepop SQL
            var prepop = [];
            if (schema.hasOwnProperty('_records')) {
                var records = schema._records,
                    record;

                for (var i=0, len=records.length; i<len; i++) {
                    record = records[i];
                    var sql = table.insert(record);
                    if (sql) {
                        prepop.push(sql);
                    }
                }
            }
            // Prepop + callback
            if (prepop.length) {
                db.sqlBatch(prepop, function() {
                    callback(tableName);
                }, errorCallback);
            } else if (callback) {
                callback(tableName);
            }
        }, errorCallback);
    };

    /**
     * Create and populate all tables from default schema
     *
     * @param {object} db - the database handle
     */
    var firstRun = function(db) {

        var tablesDefined = $q.defer(),
            tableName;

        // Schedule tables to define
        pendingTables = {};
        for (tableName in emDefaultSchema) {
            if (tableName[0] != '_') {
                pendingTables[tableName] = null;
            }
        }

        // Callback for defineTable to report progress
        var whenTableDefined = function(tableName) {

            pendingTables[tableName] = true;

            // Check for pending table definitions
            var ready = true;
            for (var t in pendingTables) {
                if (pendingTables[t] === null) {
                    ready = false;
                    break;
                }
            }
            // Resolve promise when all tables are defined
            if (ready) {
                tablesDefined.resolve(true);
            }
        };

        for (tableName in pendingTables) {
            defineTable(db,
                        tableName,
                        emDefaultSchema[tableName],
                        whenTableDefined);
        }
        return tablesDefined.promise;
    };

    /**
     * Load all current schemas from em_schema table
     *
     * @param {object} db - the database handle
     *
     * @todo: check schema version and handle schema migrations
     */
    var loadSchema = function(db) {

        var schemaLoaded = $q.defer(),
            table = emSQL.Table('em_schema', emDefaultSchema.em_schema),
            sql = table.select(['name', 'schema']);

        db.executeSql(sql, [], function(result) {
            var rows = result.rows,
                row;
            for (var i=0, len=rows.length; i<len; i++) {
                row = rows.item(i);
                try {
                    tables[row.name] = JSON.parse(row.schema);
                } catch(e) {
                    alert('Error parsing schema for table ' + row.name);
                }
            }
            schemaLoaded.resolve(true);
        }, errorCallback);

        return schemaLoaded.promise;
    };

    /**
     * Check whether database has already been populated
     *
     * @param {object} db - the database handle
     */
    var checkFirstRun = function(db) {

        // Check if em_version table exists
        var sql = 'SELECT DISTINCT tbl_name FROM sqlite_master WHERE tbl_name = "em_version"';
        db.executeSql(sql, [], function(result) {
            if (!result.rows.length) {
                firstRun(db).then(function() {
                    dbStatus.resolve(true);
                });
            } else {
                loadSchema(db).then(function() {
                    dbStatus.resolve(true);
                });
            }
        }, errorCallback);
    };

    /**
     * Open the database
     *
     * @param {object} dbSpec - the database parameters
     */
    var openDatabase = function(dbSpec) {

        return window.sqlitePlugin.openDatabase(dbSpec,
            function(dbHandle) {
                checkFirstRun(dbHandle);
            },
            function(error) {
                // Maybe platform not supported (e.g. browser)
                alert('Error opening database: ' + JSON.stringify(error));
                tables = emDefaultSchema;
                dbStatus.resolve(true);
            }
        );
    };

    // Open the database on init
    var dbSpec = {name: 'emdb.db', location: 'default'},
        db = openDatabase(dbSpec);

    /**
     * Table API
     *
     * @param {string} tableName: the table name
     */
    function Table(tableName) {

        var self = this;

        self.tableName = tableName;
        self.schema = tables[tableName];

        /**
         * Insert new records into table
         *
         * @todo: document parameters
         */
        self.insert = function(data, callback) {
            var table = emSQL.Table(self.tableName, self.schema),
                sql = table.insert(data);
            db.executeSql(sql[0], sql[1], function(result) {
                if (callback) {
                    callback(result.insertId);
                }
            }, errorCallback);
        };

        /**
         * Select records from table
         *
         * @param {Array} fields - list of field names to extract
         * @param {string} query - SQL WHERE expression
         * @param {function} callback - callback function to process
         *                              the result: function(result)
         */
        self.select = function(fields, query, callback) {

            var table = emSQL.Table(self.tableName, self.schema),
                sql = null;

            // Flexible argument list (only callback is required)
            switch(arguments.length) {
                case 1:
                    callback = fields;
                    sql = table.select();
                    break;
                case 2:
                    callback = query;
                    sql = table.select(fields);
                    break;
                default:
                    sql = table.select(fields, query);
                    break;
            }

            if (sql && callback) {
                db.executeSql(sql, [], callback, errorCallback);
            }
        };
    }

    /**
     * The $emdb API
     */
    var apiNotReady = function(error) {
        alert('Database Error: ' + error);
    };

    var api = {

        tables: function() {
            return dbReady.then(function() {
                var tableNames = [];
                for (var tn in tables) {
                    if (tn[0] != '_' && tn.substring(0, 3) != 'em_') {
                        tableNames.push(tn);
                    }
                }
                return tableNames;
            }, apiNotReady);
        },

        table: function(tableName) {
            return dbReady.then(function() {
                return new Table(tableName);
            }, apiNotReady);
        }
    };
    return api;

}]);
