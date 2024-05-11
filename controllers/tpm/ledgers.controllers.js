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

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
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
            let q = `
                select 
                    tmm.machine_nm , 
                    tmi.itemcheck_nm, 
                    tmi.val_periodic, 
                    tmp.period_nm, 
                    tmi.duration, 
                    tmi.standard_measurement, 
                    tmi.method_check,
                    tmi.itemcheck_id,
                    trs.schedule_id,
                    trli.approval
                from tb_r_ledger_itemchecks trli 
                left join tb_m_ledgers tml on trli.ledger_id = tml.ledger_id 
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
    },
    newLedger: async(req, res) => {
        try {
            let ledgerData = req.body
            ledgerData.changed_dt = getCurrentDateTime()
            ledgerData.created_dt = getCurrentDateTime()
            ledgerData.machine_id = await getLastIdData(table.tb_m_machines, 'machine_id')
            ledgerData.changed_by = 'USER'
            ledgerData.created_by = 'USER'

            let newMachine = {
                machine_id: ledgerData.machine_id,
                machine_nm: ledgerData.machine_nm,
                changed_dt: getCurrentDateTime(),
                created_dt: getCurrentDateTime(),
                changed_by: 'USER',
                created_by: 'USER',
                uuid: v4(),
                line_id: ledgerData.line_id
            }

            const machine = await queryPOST(table.tb_m_machines, newMachine)

            let newLedger = {
                ledger_id: ledgerData.machine_id,
                machine_id: ledgerData.machine_id,
                changed_dt: getCurrentDateTime(),
                created_dt: getCurrentDateTime(),
                changed_by: 'USER',
                created_by: 'USER',
                uuid: v4(),
            }

            console.log(newMachine);
            console.log(newLedger);

            const ledger = await queryPOST(table.tb_m_ledgers, newLedger)

        } catch (error) {
            console.log(error);
        }
    }
}