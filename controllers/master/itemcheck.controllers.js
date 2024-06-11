const table = require('../../config/table');
const getLastIdData = require('../../helpers/getLastIdData');
const { queryPOST, queryPUT, queryGET, queryCustom } = require('../../helpers/query')
const response = require('../../helpers/response')
const queryHandler = require('../queryhandler.function')
const { v4 } = require('uuid');
const idToUuid = require('../../helpers/idToUuid');
const {cronGeneratorSchedule} = require('../../functions/cronGeneratorSchedule');
const {getCurrentDateTime} = require('../../functions/getCurrentDateTime')

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}

module.exports = {
    getItemchecks: async(req, res) => {
        try {
            let containerFilter = queryHandler(req.query)
            console.log(containerFilter);
            containerFilter.length > 0 ? containerFilter = 'WHERE tmi.' + containerFilter + " AND " : containerFilter = "WHERE"
            let q = `
                SELECT
                    tmi.itemcheck_id,
                    tmi.itemcheck_nm,
                    tmm.machine_nm,
                    trli.ledger_itemcheck_id ,
                    tmm.machine_id,
                    trli.ledger_id,
                    tmi.val_periodic,
                    tmp.period_nm
                FROM
                    tb_r_ledger_itemchecks trli 
                JOIN
                    tb_m_itemchecks tmi ON tmi.itemcheck_id = trli.itemcheck_id
                JOIN
                    tb_m_ledgers tml ON tml.ledger_id = trli.ledger_id
                JOIN
                    tb_m_machines tmm ON tmm.machine_id = tml.machine_id
                JOIN
                    tb_m_periodics tmp ON tmi.period_id = tmp.period_id
                
                ${containerFilter} trli.deleted_by IS NULL AND trli.deleted_dt IS NULL
                ORDER BY
                    tmi.itemcheck_nm, tmm.machine_nm;                
            `
            console.log(q);
            const itemchecks = (await queryCustom(q)).rows
            response.success(res, 'success to get itemchecks', itemchecks)
        } catch (error) {
            console.error(error)
            response.failed(res, 'Error to get itemchecks')
        }
    },
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
                condition: 'Waiting',
                upper_limit: +itemCheckData.upper_limit,
                lower_limit: +itemCheckData.lower_limit
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
                // initial_date: Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long'}).format(oldData.initial_date),
                initial_date: oldData.initial_date,
                created_by: 'SYSTEM',
                created_dt: getCurrentDateTime(),
                changed_by: 'USER',
                changed_dt: getCurrentDateTime(),
                incharge_id: oldData.incharge_id,
                standard_measurement_old: oldData.standard_measurement,
                standard_measurement_new: newData.standard_measurement,
                approval: false,
                uuid: v4(),
                // last_check_dt: Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'long'}).format(oldData.last_check_dt),
                last_check_dt: oldData.last_check_dt,
                itemcheck_std_id: oldData.itemcheck_std_id,
                ledger_id: newData.ledger_id,
                upper_limit_old: oldData.upper_limit !== null ? oldData.upper_limit : 0,
                upper_limit_new: +newData.upper_limit,
                lower_limit_old: oldData.lower_limit !== null ? oldData.lower_limit     : 0,
                lower_limit_new: +newData.lower_limit,
                reason: newData.reason     
            }

            console.log("HERE==================================");
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
                standard_measurement: data.standard_measurement_new,
                upper_limit: +data.upper_limit_new,
                lower_limit: +data.lower_limit_new
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
                standard_measurement: data.standard_measurement,
                lower_limit: +data.lower_limit || null,
                upper_limit: +data.upper_limit || null
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
                    ledger_itemcheck_id = ${ledgerItem.ledger_itemcheck_id},
                    condition = 'Approved'
                WHERE ledger_added_id = ${data.ledger_added_id}
            `    
            const updateTRLA = await queryCustom(q)
            cronGeneratorSchedule()    

        } catch (error) {
            console.log(error);
            response.error(res, error)
        }
    },
    deleteItemCheck: async(req, res) => {
        try {
            let deleteItemCheck = req.body
            console.log(deleteItemCheck);
            let q = `
                UPDATE tb_r_ledger_itemchecks
                SET deleted_by = 'HALID', deleted_dt = '${getCurrentDateTime()}', reasons = '${deleteItemCheck.reason}'
                WHERE ledger_itemcheck_id = ${deleteItemCheck.ledger_itemcheck_id};            
            `
            const deleted = await queryCustom(q)

            let deleteSchedule = `
                UPDATE tb_r_schedules
                SET deleted_by = 'HALID', deleted_dt = '${getCurrentDateTime()}'
                WHERE ledger_itemcheck_id = ${deleteItemCheck.ledger_itemcheck_id}
            `
            const deleting = await queryCustom(deleteSchedule)

            let deleteHistory = {
                ledger_deleted_id: await getLastIdData(table.tb_r_ledger_deleted),
                uuid: v4(),
                ledger_id: deleteItemCheck.ledger_id,
                itemcheck_id: deleteItemCheck.itemcheck_id,
                created_by: 'USER',
                created_dt: getCurrentDateTime(),
                changed_by: 'USER',
                changed_dt: getCurrentDateTime(),
                last_check_dt: deleteItemCheck.last_check_dt,
                reasons: deleteItemCheck.reason
            }

            console.log(deleteHistory);

            const set = await queryPOST(table.tb_r_ledger_deleted, deleteHistory)
            
            response.success(res, 'data deleted', deleted)
        } catch (error) {
            console.log(error);
        }
    },
    denyAdded: async(req, res) => {
        try {
            let deny = req.body
            let q = `
                UPDATE tb_r_ledger_added
                SET approval = TRUE, condition = 'Denied'
                WHERE ledger_added_id = ${deny.ledger_added_id}
            `
            const denied = await queryCustom(q)
            response.success(res, 'Request Denied', denied)
        } catch (error) {
            console.log(error);
            response.error(res, 'Error')
        }
    },
    denyEdit: async(req, res) => {
        try {
            let deny = req.body
            let q = `
                UPDATE tb_r_ledger_changes
                SET approval = TRUE, condition = 'Denied'
                WHERE ledger_changes_id = ${deny.ledger_changes_id}
            `
            const denied = await queryCustom(q)
            response.success(res, 'Request Denied', denied)
        } catch (error) {
            console.log(error);
            response.error(res, 'Error')
        }
    }


}