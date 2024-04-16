const pg = require('pg')
pg.types.setTypeParser(1082, function(stringValue) {
    return stringValue; //1082 for date type
});

const database = new pg.Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'new_tpm_system',
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    ssl: false
});

module.exports = {
    database
}