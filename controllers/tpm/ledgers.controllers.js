const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom, queryBulkPOST } = require('../../helpers/query')

const response = require('../../helpers/response')
const { groupFunction } = require('../../functions/groupFunction')
const queryHandler = require('../queryhandler.function')
const getLastIdData = require('../../helpers/getLastIdData')
const { v4 } = require('uuid')
const { uuid } = require('uuidv4')

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}


module.exports = {
    getLedgers: async (req, res) => {
        try {
            let line_id = req.query.line_id
            let machine_id = req.query.machine_id
            console.log(line_id, machine_id);
            if(line_id!='null' && machine_id!='null'){
                let line_id = await uuidToId(table.tb_m_lines, 'line_id', req.query.line_id)            
                let machine_id = await uuidToId(table.tb_m_machines, 'machine_id', req.query.machine_id)
                whereCond = `AND tml.line_id=${line_id} AND tmm.machine_id=${machine_id}`
            }else if(line_id != 'null' && machine_id == 'null'){
                let line_id = await uuidToId(table.tb_m_lines, 'line_id', req.query.line_id)            
                whereCond = `AND tml.line_id=${line_id}`
            }else if(line_id == 'null' && machine_id != 'null'){
                let machine_id = await uuidToId(table.tb_m_machines, 'machine_id', req.query.machine_id)
                whereCond = `AND tmm.machine_id=${machine_id}`
            }else if(machine_id == 'null' && line_id == 'null'){
                whereCond = ``
            }
            console.log(whereCond);
            let q = `
            SELECT
                trli.ledger_id,
                tmm.machine_nm,
                tml.line_id,
                tml.line_nm,
                trli.approval,
                COUNT(trli.ledger_id)::int AS num_item_checks
            FROM
                tb_m_machines tmm 
            JOIN
                tb_r_ledger_itemchecks trli  ON trli.ledger_id = tmm.machine_id	
            JOIN
                tb_m_lines tml ON tml.line_id = tmm.line_id 
            WHERE
                trli.deleted_dt is null AND trli.approval = false ${whereCond}
            GROUP BY
                trli.ledger_id, 
                tmm.machine_nm,
                tml.line_id, 
                tml.line_nm,
                trli.approval
            ORDER BY 
                trli.ledger_id
            `
            let qtyItemcheckAtLedger = (await queryCustom(q)).rows
            response.success(res, "success to get ledgers", qtyItemcheckAtLedger)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        }
    },


    getDetail: async(req, res) => {
        try {
            let idLedger = Number(req.query.ledger_id);
        //     let q = `
        //     select 
        //     trli.ledger_id,
        //     tmi.itemcheck_id,
        //     tmi.itemcheck_nm,
        //     tmp.period_nm,
        //     tmi.val_periodic,
        //     tmi.itemcheck_loc ,
        //     tmi.method_check,
        //     tmi.period_id,
        //     tmi.duration,
        //     tmi.itemcheck_std_id,
        //     tmi.standard_measurement
            
        //     from  tb_r_ledger_itemchecks trli 
        //     join tb_m_machines tmm on trli.ledger_id = tmm.machine_id
        //     join tb_m_lines tml  on tmm.line_id = tml.line_id 
        //     join tb_m_shops tms on tml.shop_id = tms.shop_id 
        //     join tb_m_plants tmp2 on tml.shop_id = tmp2.plant_id 
        //     join tb_m_companies tmc on tmp2.company_id = tmc.company_id 
        //     join tb_m_itemchecks tmi on trli.itemcheck_id = tmi.itemcheck_id
        //     join tb_m_periodics tmp on tmi.period_id = tmp.period_id 
        //     join tb_m_itemcheck_std tmis on tmi.itemcheck_std_id = tmis.itemcheck_std_id 
        //     Where trli.ledger_id = ${idLedger}
        // `
            let q = `
                select 
                    tmm.machine_nm , 
                    tmi.itemcheck_nm, 
                    tmi.val_periodic, 
                    tmp.period_nm, 
                    tmi.duration, 
                    tmi.standard_measurement, 
                    tmi.method_check,
                    trs.plan_check_dt,
                    tmi.itemcheck_id,
                    trs.schedule_id,
                    trli.approval
                from tb_r_ledger_itemchecks trli 
                join tb_m_ledgers tml on trli.ledger_id = tml.ledger_id 
                join tb_m_machines tmm on tml.machine_id = tmm.machine_id 
                join tb_m_itemchecks tmi on trli.itemcheck_id = tmi.itemcheck_id 
                join tb_m_periodics tmp on tmi.period_id = tmp.period_id 
                join tb_r_schedules trs on trli.ledger_itemcheck_id = trs.ledger_itemcheck_id
                where tml.ledger_id = ${idLedger}
                order by tmi.itemcheck_nm
            `
            console.log(q);
            let detailsIc = (await queryCustom(q)).rows;            
            console.log(detailsIc);
            response.success(res, 'Success to get ItemChecks', detailsIc)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        }
    },
    getUpdate: async(req, res) => {
        let q = `
            select
                tmm.machine_nm,
                tmi.itemcheck_nm,
                trli.reasons,
                tmi.val_periodic,
                tmp.period_nm,
                tml.line_nm
            from tb_r_ledger_itemchecks trli
            join tb_m_machines tmm on tmm.machine_id = trli.ledger_id
            join tb_m_itemchecks tmi on tmi.itemcheck_id = trli.itemcheck_id
            join tb_m_periodics tmp on tmp.period_id = tmi.period_id
            join tb_m_lines tml on tmm.line_id = tml.line_id
            where trli.approval = true
        `
        let updateData = (await queryCustom(q)).rows
        console.log(updateData);
        response.success(res, 'succes to get updated item', updateData)
    }
}