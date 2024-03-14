const pg = require('pg')
pg.types.setTypeParser(1082, function(stringValue) {
    return stringValue; //1082 for date type
});

const database = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    ssl: false
});

module.exports = {
    database
}