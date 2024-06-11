const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom, queryBulkPOST, queryDELETE, querySoftDELETE } = require('../../helpers/query')
const response = require('../../helpers/response')
const { groupFunction } = require('../../functions/groupFunction')
const queryHandler = require('../queryhandler.function')
const getLastIdData = require('../../helpers/getLastIdData')
const {getCurrentDateTime} = require('../../functions/getCurrentDateTime')
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
            let dataParts = (await queryGET(table.tb_m_spareparts))
            console.log(dataParts);
            response.success(res, "success", dataParts)
        } catch (error) {
            console.log(error);
            response.failed(res, "failed get sparepart data")
        }
    },

    sparepartsGetDetail: async (req, res) => {
        try {
            let filter = req.query
            console.log(filter);
            let q = `
                select 
                tms.*
                from tb_r_ledger_spareparts trls
                join tb_m_spareparts tms on tms.sparepart_id = trls.sparepart_id
                where trls.ledger_id = ${filter.ledger_id}
            `

            let dataSparepart = (await queryCustom(q)).rows
            console.log(dataSparepart);
            response.success(res, "success to get data", dataSparepart)
        } catch (error) {
            console.log(error);
            response.failed(res, "failed get sparepart data")
        }
    },

    sparepartAdd: async (req, res) => {
        try {
            let data = req.query

            let dataSparepart = {
                sparepart_id: getLastIdData(table.tb_m_spareparts, 'sparepart_id'),
                sparepart_nm: data.sparepart_nm,
                stock: data.stock,
                created_dt: getCurrentDateTime(),
                created_by: 'USER',
                changed_dt: getCurrentDateTime(),
                changed_by: 'USER',
            }

            await queryPOST(table.tb_m_spareparts, dataSparepart);
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
    },

    itemSparepartAdd: async (req, res) => {
        try {
            
        } catch (error) {
            
        }
    }

}