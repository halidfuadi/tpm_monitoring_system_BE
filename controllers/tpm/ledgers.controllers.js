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
            let containerFilter = queryHandler(req.query)
            containerFilter.length > 0 ? containerFilter = containerFilter.join(" AND ") : containerFilter = ""
            let ledgersData = await queryGET(table.tb_m_ledgers, `${containerFilter == '' ? '' : 'WHERE ' + containerFilter} ORDER BY ledger_id`)
            let mapLedgers = await ledgersData.map(async ledger => {
                let ledger_id = ledger.ledger_id
                let q = `                
                    SELECT
                        trli.ledger_id,
                        tmm.machine_nm,
                        tml.line_nm,
                        COUNT(trli.itemcheck_id)::int AS num_item_checks
                    FROM
                        tb_m_machines tmm 
                    JOIN
                        tb_r_ledger_itemchecks trli  ON trli.ledger_id = tmm.machine_id	
                    JOIN
                        tb_m_lines tml ON tml.line_id = tmm.line_id
                    WHERE
                        trli.ledger_id = ${ledger_id}
                    GROUP BY
                        trli.ledger_id, tmm.machine_nm, tml.line_nm
                    `
                let retrieve = await queryCustom(q)
                return retrieve.rows[0]
            })
            const waitMapLedger = await Promise.all(mapLedgers)
            response.success(res, "success to get ledgers", waitMapLedger)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        }
    },

    getDetail: async(req, res) => {
        try {
            let idLedger = Number(req.query.ledger_id);
            let q = `
            select 
            trli.ledger_id,
            tmi.itemcheck_id,
            tmi.itemcheck_nm,
            tmp.period_nm,
            tmi.val_periodic,
            tmi.itemcheck_loc ,
            tmi.method_check,
            tmi.period_id,
            tmi.duration,
            tmi.mp,
            tmi.initial_date,
            tmi.changed_by,
            tmi.changed_dt,
            tmi.incharge_id,
            tmi.last_check_dt,
            tmi.itemcheck_std_id,
            tmi.standard_measurement
            
            from  tb_r_ledger_itemchecks trli 
            join tb_m_machines tmm on trli.ledger_id = tmm.machine_id
            join tb_m_lines tml  on tmm.line_id = tml.line_id 
            join tb_m_shops tms on tml.shop_id = tms.shop_id 
            join tb_m_plants tmp2 on tml.shop_id = tmp2.plant_id 
            join tb_m_companies tmc on tmp2.company_id = tmc.company_id 
            join tb_m_itemchecks tmi on trli.itemcheck_id = tmi.itemcheck_id
            join tb_m_periodics tmp on tmi.period_id = tmp.period_id 
            join tb_m_itemcheck_std tmis on tmi.itemcheck_std_id = tmis.itemcheck_std_id 
            Where trli.ledger_id = ${idLedger}
        `
            console.log(q);
            let detailsIc = (await queryCustom(q)).rows;
            response.success(res, 'Success to get ItemChecks', detailsIc)

        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        }
    },
    addItemCheck: async(req, res) => {
        try {

            queryPOST(table.tb_m_itemchecks, req.body)
            response.success(res, 'sucess add data')

        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add data')
        }
    },
    editItemCheck: async(req, res) => {
        try {
            let idToEdit = Number(req.query.itemcheck_id) //pastikan item check id adalah number 
            let update = req.body //isi dari apa apa yang akan di ubah

            await queryPUT(table.tb_m_itemchecks, update);
            response.success(res, 'Sucess update data')

        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to Edit data')
        }
    },
    deleteItemCheck: async(req, res) => {
        try {

            let idToDelete = Number(req.query.itemcheck_id) //pastikan item check id adalah number 
            let deleteDetails = req.body
            let q = `
                UPDATE tb_m_itemchecks
                SET 
                    deleted_by = '${deleteDetails.deleted_by}',
                    deleted_dt = '${deleteDetails.deleted_dt}'
                where itemcheck_id = ${idToDelete}
            `

            await queryCustom(q);
            let sucessDelete = deleteDetails
            sucessDelete.itemcheck_id = idToDelete

            response.success(res, 'sucess to delete data', sucessDelete);

            console.log(q);

        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to deleted data')
        }
    }
}