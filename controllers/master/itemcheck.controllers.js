const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom } = require('../../helpers/query')
const response = require('../../helpers/response')
const queryHandler = require('../queryhandler.function')

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}

module.exports = {
    getItemcheck: async(req, res) => {
        try {
            let containerFilter = queryHandler(req.query)
            containerFilter.length > 0 ? containerFilter = 'WHERE ' + containerFilter.join(" AND ") : containerFilter = ""
            const itemchecks = await queryGET(table.tb_m_itemchecks, containerFilter)
            response.success(res, 'success to get itemcheck', itemchecks)
        } catch (error) {
            console.error(error)
            response.failed(res, 'Error to get itemcheck')
        }
    }
}