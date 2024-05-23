const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom, queryBulkPOST, queryDELETE, querySoftDELETE } = require('../../helpers/query')
const response = require('../../helpers/response')
const { groupFunction } = require('../../functions/groupFunction')
const queryHandler = require('../queryhandler.function')
const getLastIdData = require('../../helpers/getLastIdData')
const { v4 } = require('uuid')
const moment = require('moment')

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}


module.exports = {
    sparepartsGet: async (req, res) => {
        try {
            let filter = queryHandler(req.query)
            console.log(filter);
            let dataParts = queryGET(tb_m_spareparts)
            response.success(res, dataParts)

        } catch (error) {
            console.log(error);
            response.failed(res, "failed get sparepart data")
        }
    },
    sparepartAdd: async (req, res) => {
        try {
            let created_dt = moment().format('YYYY-MM-DD');
            req.body.created_dt = created_dt;
            await queryPOST(table.tb_m_spareparts, req.body);
            response.success(res, 'sucess add data')

        } catch (error) {
            console.log(error);
            response.failed(res, 
                "failed add sparepart data, please check your body :) ")
        }

    },
    sparepartEdit: async (req, res) => {
        try {
            let idToEdit = Number(req.query.sparepart_id)
            let modified_dt = moment().format('YYYY-MM-DD');
            req.body.modified_dt = modified_dt;
            let wCond = `where sparepart_id = ${idToEdit}`
            queryPUT(table.tb_m_spareparts, req.body, wCond)
            response.success(res, 'sucess add data')

        } catch (error) {
            console.log(error);
            response.failed(res, "failed edit sparepart data, please check your body :) ")
        }

    },
    sparepartDelete: async (req, res) => {
        try {
            let idToDelete = Number(req.query.sparepart_id)
            let deleted_by = req.body.deleted_by
            let wCond = `sparepart_id = ${idToDelete}`
            await querySoftDELETE(table.tb_m_spareparts, wCond, deleted_by)
            response.success(res, 'sucess delete data')
        } catch (error) {
            console.log(error);
            response.failed(res, "failed delete sparepart data, please check your body :) ")
        }
    }

}