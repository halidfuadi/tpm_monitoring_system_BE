const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom } = require('../../helpers/query')
const queryHandler = require('../queryhandler.function')
const response = require('../../helpers/response');

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}

module.exports = {
    getHistory: async(req, res) => {
        try {
            let containerFilter = queryHandler(req.query)
            containerFilter.length > 0 ? containerFilter = 'WHERE ' + containerFilter.join(" AND ") : containerFilter = ""
            const historyData = await queryGET(table.v_tpm_history, containerFilter + ' ORDER BY plan_check_dt DESC')
            response.success(res, 'success to get history', historyData)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get history')
        }
    }
}