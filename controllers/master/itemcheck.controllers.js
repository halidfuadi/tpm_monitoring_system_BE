const table = require('../../config/table');
const scheduleGeneratorNewItem = require('../../functions/scheduleGenerator');
const getLastIdData = require('../../helpers/getLastIdData');
const { queryPOST, queryPUT, queryGET, queryCustom } = require('../../helpers/query')
const response = require('../../helpers/response')
const queryHandler = require('../queryhandler.function')
const { v4 } = require('uuid');

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
    },
    addItemCheck: async(req, res) => {
        try {            
            let itemCheckData = req.body
            itemCheckData.itemcheck_id = await getLastIdData(table.tb_m_itemchecks, 'itemcheck_id')
            itemCheckData.ledger_itemcheck_id = await getLastIdData(table.tb_r_ledger_itemchecks, 'ledger_itemcheck_id')
            itemCheckData.changed_dt = getCurrentDateTime()
            itemCheckData.created_dt = getCurrentDateTime()
            itemCheckData.changed_by = 'USER'
            itemCheckData.created_by = 'USER'
            itemCheckData.uuid_item = v4()
            itemCheckData.uuid_ledger_item = v4()

            let newItem = {
                itemcheck_id: itemCheckData.itemcheck_id,
                itemcheck_nm: itemCheckData.itemcheck_nm,
                method_check: itemCheckData.itemcheck_method,
                val_periodic: itemCheckData.val_period,
                period_id: itemCheckData.period_id,
                standard_measurement: itemCheckData.standard_measurement,
                created_by: itemCheckData.created_by,
                created_dt: itemCheckData.created_dt,
                changed_by: itemCheckData.changed_by,
                changed_dt: itemCheckData.changed_dt,
                itemcheck_std_id: 1,
                last_check_dt: getCurrentDateTime(),
                incharge_id: 0,
                initial_date: getCurrentDateTime(),
                mp: +itemCheckData.mp,
                uuid: itemCheckData.uuid_item,
                itemcheck_loc: itemCheckData.itemcheck_loc,
                duration: itemCheckData.duration
            }
            const item = await queryPOST(table.tb_m_itemchecks, newItem)

            let newLedgerItem = {
                ledger_itemcheck_id : itemCheckData.ledger_itemcheck_id,
                uuid: itemCheckData.uuid_ledger_item,
                ledger_id: itemCheckData.ledger_id,
                itemcheck_id: itemCheckData.itemcheck_id,
                created_by: itemCheckData.created_by,
                created_dt: itemCheckData.created_dt,
                changed_by: itemCheckData.changed_by,
                changed_dt: itemCheckData.changed_dt,
                last_check_dt: itemCheckData.plan_check_dt,
                approval: true,
                reasons: itemCheckData.reasons
            }
            const ledger_item = await queryPOST(table.tb_r_ledger_itemchecks, newLedgerItem)
            
            // scheduleGeneratorNewItem(itemCheckData)

            let newSchedule = {
                schedule_id: await getLastIdData(table.tb_r_schedules, 'schedule_id'),
                uuid: v4(),
                ledger_itemcheck_id: itemCheckData.ledger_itemcheck_id,
                plan_check_dt: itemCheckData.plan_check_dt,
                created_by: 'GENERATOR',
                created_dt: getCurrentDateTime(),
                status_id: 0,
                plan_duration: itemCheckData.duration
            }
            const schedule = await queryPOST(table.tb_r_schedules, newSchedule)

            response.success(res, 'sucess add data')
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add data')
        }
    },
    editItemCheck: async(req, res) => {
        try {
            console.log("berhasil");
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