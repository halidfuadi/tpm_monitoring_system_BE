const { duration } = require('moment');
const table = require('../../config/table');
const scheduleGeneratorNewItem = require('../../functions/scheduleGenerator');
const getLastIdData = require('../../helpers/getLastIdData');
const { queryPOST, queryPUT, queryGET, queryCustom } = require('../../helpers/query')
const response = require('../../helpers/response')
const queryHandler = require('../queryhandler.function')
const { v4 } = require('uuid');
const idToUuid = require('../../helpers/idToUuid');
const { checkout } = require('../../app');
const cronGeneratorSchedule = require('../../functions/cronGeneratorSchedule');

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
                ledger_added_id: await getLastIdData(table.tb_r_ledger_added, 'ledger_added_id'),
                ledger_itemcheck_id : itemCheckData.ledger_itemcheck_id,
                uuid: itemCheckData.uuid_item,
                ledger_id: itemCheckData.ledger_id,
                itemcheck_id: itemCheckData.itemcheck_id,                
                created_by: itemCheckData.created_by,
                created_dt: itemCheckData.created_dt,
                changed_by: itemCheckData.changed_by,
                changed_dt: itemCheckData.changed_dt,
                last_check_dt: itemCheckData.plan_check_dt,                
                approval: false,
                reasons: itemCheckData.reasons,
                period_id: itemCheckData.period_id,
                itemcheck_nm: itemCheckData.itemcheck_nm,
                itemcheck_loc: itemCheckData.itemcheck_loc,
                method_check: itemCheckData.itemcheck_method,
                duration: itemCheckData.duration,
                mp: +itemCheckData.mp,
                val_periodic: itemCheckData.val_period,
                initial_date: itemCheckData.plan_check_dt,
                itemcheck_std_id: 1,
                standard_measurement: itemCheckData.standard_measurement,
                incharge_id: 0,
            }
            console.log(newItem);
            const item = await queryPOST(table.tb_r_ledger_added, newItem)

            response.success(res, 'sucess add data')
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add data')
        }
    },
    editItemCheck: async(req, res) => {
        try {
            let newData = req.body
            console.log(newData);            
            let oldData = await queryGET(table.tb_m_itemchecks, `WHERE itemcheck_id = ${newData.itemcheck_id}`)
            console.log(oldData);
            oldData = oldData[0]
            let joinData = {
                ledger_changes_id: await getLastIdData(table.tb_r_ledger_changes, 'ledger_changes_id'),
                itemcheck_id: oldData.itemcheck_id,
                itemcheck_nm_old: oldData.itemcheck_nm,
                itemcheck_nm_new: newData.itemcheck_nm,
                itemcheck_loc: oldData.itemcheck_loc,
                mp_old: oldData.mp,
                mp_new: +newData.mp,
                period_id_old: oldData.period_id,
                period_id_new: +newData.period_id,
                method_check_old: oldData.method_check,
                method_check_new: newData.method_check,
                duration_old: oldData.duration,
                duration_new: +newData.duration,
                val_periodic_old: oldData.val_periodic,
                val_periodic_new: +newData.val_periodic,
                initial_date: Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long'}).format(oldData.initial_date),
                created_by: 'SYSTEM',
                created_dt: getCurrentDateTime(),
                changed_by: 'USER',
                changed_dt: getCurrentDateTime(),
                incharge_id: oldData.incharge_id,
                standard_measurement_old: oldData.standard_measurement,
                standard_measurement_new: newData.standard_measurement,
                approval: false,
                uuid: v4(),
                last_check_dt: Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long'}).format(oldData.last_check_dt),
                itemcheck_std_id: oldData.itemcheck_std_id,
                ledger_id: newData.ledger_id            
            }

            console.log(joinData);

            const insert = await queryPOST(table.tb_r_ledger_changes, joinData)

            console.log(joinData);
            
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to Edit data')
        }
    },   
    approveItemCheck: async(req, res) => {
        try {
            let item = req.body
            let q = `
                UPDATE tb_r_ledger_itemchecks
                SET
                    approval = false
                WHERE ledger_itemcheck_id = ${item.ledger_itemcheck_id}
            `
            let hasil = await queryCustom(q)
            response.success(res, 'data approved')
        } catch (error) {
            
        }
    },
    getUpdate: async(req, res) => {
        try {
            let q = `
                SELECT
                    trlc.*,
                    tmm.machine_nm
                FROM tb_r_ledger_changes trlc
                JOIN tb_m_machines tmm ON tmm.machine_id = trlc.ledger_id
                WHERE trlc.approval = false
            `
            let updated = (await queryCustom(q)).rows
            console.log("disini");
            console.log(updated);
            response.success(res, 'succes to get updated item', updated)
        } catch (error) {
            console.log(error);
        }
    },
    approvedItem: async(req, res) =>{
        try {
            let data = req.body
            
            let newData = {
                period_id: data.period_id_new,
                uuid: await idToUuid(table.tb_m_itemchecks, 'itemcheck_id', data.itemcheck_id),
                itemcheck_nm: data.itemcheck_nm_new,
                itemcheck_loc: data.itemcheck_loc,
                method_check: data.method_check_new,
                duration: data.duration_new,
                mp: data.mp_new,
                val_periodic: data.val_periodic_new,
                initial_date: data.initial_date,
                changed_by: 'USER',
                changed_dt: getCurrentDateTime(),
                incharge_id: 0,
                standard_measurement: data.standard_measurement_new
            }

            const updated = await queryPUT(table.tb_m_itemchecks, newData, `WHERE itemcheck_id = ${data.itemcheck_id}`)            
            let approve = {
                approval : true
            }
            const history = await queryPUT(table.tb_r_ledger_changes, approve, `WHERE ledger_changes_id = ${data.ledger_changes_id}`)
            
            response.success(res, 'Success to Update Data', updated)

        } catch (error) {
            console.log(error);
        }
    },
    approvedNewItem: async(req, res) =>{
        try {
            let data = req.body
            console.log(data);
    
            let item = {
                itemcheck_id: await getLastIdData(table.tb_m_itemchecks, 'itemcheck_id'),
                period_id: data.period_id,
                uuid: v4(),
                itemcheck_nm: data.itemcheck_nm,
                itemcheck_loc: data.itemcheck_loc,
                method_check: data.method_check,
                duration: data.duration,
                mp: data.mp,
                val_periodic: data.val_periodic,
                initial_date: data.initial_date,
                created_by: 'SYSTEM',
                created_dt: getCurrentDateTime(),
                changed_by: 'SYSTEM',
                changed_dt: getCurrentDateTime(),
                incharge_id: 0,
                last_check_dt: data.last_check_dt,
                itemcheck_std_id: data.itemcheck_std_id,
                standard_measurement: data.standard_measurement
            }
            const updateItemcheck = await queryPOST(table.tb_m_itemchecks, item)
    
            let ledgerItem = {
                ledger_itemcheck_id: await getLastIdData(table.tb_r_ledger_itemchecks, 'ledger_itemcheck_id'),
                uuid: v4(),
                ledger_id: data.ledger_id,
                itemcheck_id: item.itemcheck_id,
                created_by: 'SYSTEM',
                created_dt: getCurrentDateTime(),
                changed_by: 'SYSTEM',
                changed_dt: getCurrentDateTime(),
                last_check_dt: data.last_check_dt,
            }
            const updatedLedger = await queryPOST(table.tb_r_ledger_itemchecks, ledgerItem)
    
            let q = `
                UPDATE tb_r_ledger_added
                SET
                    approval = true,
                    itemcheck_id = ${item.itemcheck_id},
                    ledger_itemcheck_id = ${ledgerItem.ledger_itemcheck_id}
                WHERE ledger_added_id = ${data.ledger_added_id}
            `    
            const updateTRLA = await queryCustom(q)
            await cronGeneratorSchedule()    

        } catch (error) {
            
        }
    },
    deleteItemCheck: async(req, res) => {
        try {
            let deleteItemCheck = req.body
            let q = `
                UPDATE tb_r_ledger_itemchecks
                SET deleted_by = 'HALID'
                WHERE ledger_itemcheck_id = ${deleteItemCheck.ledger_itemcheck_id};            
            `
            const deleted = await queryCustom(q)

            let deleteSchedule = `
                UPDATE tb_r_schedules
                SET deleted_by = 'HALID'
                WHERE ledger_itemcheck_id = ${deleteItemCheck.ledger_itemcheck_id}
            `

            const deleting = await queryCustom(deleteSchedule)

            let deleteItem = `
                UPDATE tb_m_itemchecks
                SET deleted_by = 'HALID'
                WHERE itemcheck_id = ${deleteItemCheck.itemcheck_id}
            `

            const deletedItem = await queryCustom(deleteItem)
            
            response.success(res, 'data deleted', deleted)
        } catch (error) {
            console.log(error);
        }
    }


}