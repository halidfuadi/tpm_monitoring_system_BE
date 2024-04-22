const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom, queryBulkPOST } = require('../../helpers/query')

const response = require('../../helpers/response')
const { groupFunction } = require('../../functions/groupFunction')
const queryHandler = require('../queryhandler.function')
const getLastIdData = require('../../helpers/getLastIdData')
const { v4 } = require('uuid')

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}


module.exports = {
    getLedgers: async(req, res) => {
        try {                                                
                let q = `select 
                    tmi.itemcheck_nm, 
                    tmm.machine_nm, 
                    tmp.period_nm, 
                    tmi.val_periodic,
                    trli.last_check_dt
                
                    from tb_r_ledger_itemchecks trli
                    join tb_m_itemchecks tmi on tmi.itemcheck_id = trli.itemcheck_id  
                    join tb_m_machines tmm  on tmm.machine_id = trli.ledger_id 
                    join tb_m_periodics tmp on tmp.period_id = tmi.period_id
                `
                let checkers = await queryCustom(q)                                
                let ledgerData = checkers.rows
            response.success(res, "success to get schedules", ledgerData)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        } 
    },
}