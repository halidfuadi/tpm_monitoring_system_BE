const table = require('../../config/table')
const { queryPOST, queryPUT, queryGET, queryCustom, queryBulkPOST } = require('../../helpers/query')

const response = require('../../helpers/response')
const { groupFunction } = require('../../functions/groupFunction')
const queryHandler = require('../queryhandler.function')
const getLastIdData = require('../../helpers/getLastIdData')
const { v4 } = require('uuid')
let timestampDay = 24 * 60 * 60 * 1000

async function uuidToId(table, col, uuid) {
    console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
    // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
    let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col])
    return rawId[0][col]
}


module.exports = {
    getSchedule: async(req, res) => {
        try {
            /*
                DATA MAP:
                1. GET SCHEDULES ALL BASED ON FILTER optional CURRENT MONTH, PLANT, LINE, MACHINE, INCHARGE, STATUS
                2. GROUPING ITEM CHECK IS_HAVING revision_parent_id = schedule_id
                3. GET pic from tb_r_schedule_checker schedule_id
            */
            let containerFilter = queryHandler(req.query)

            containerFilter.length > 0 ? containerFilter = containerFilter.join(" AND ") : containerFilter = ""
            let schedulesData = await queryGET(table.v_schedules_monthly, `WHERE ${containerFilter} ORDER BY day_idx`)
            let mapSchedulesPics = await schedulesData.map(async schedule => {
                let schedule_id = await uuidToId(table.tb_r_schedules, 'schedule_id', schedule.schedule_id) //table, col, uuid
                let q = `SELECT 
                trsc.uuid as schedule_checker_id,
                tmu.uuid as user_id,
                tmu.user_nm,
                tmu.noreg
                FROM tb_r_schedule_checker trsc
                JOIN tb_m_users tmu ON tmu.user_id = trsc.user_id
                WHERE trsc.schedule_id = ${schedule_id}`
                let checkers = await queryCustom(q)
                let dateOffset = new Date(((schedule.val_periodic * schedule.prec_val) * timestampDay)).getTime() + new Date(schedule.actual_check_dt ? schedule.actual_check_dt : schedule.plan_check_dt).getTime()
                schedule.next_check = new Date(dateOffset)
                schedule.checkers = checkers.rows
                return schedule
            })
            const waitMapSchedule = await Promise.all(mapSchedulesPics)
            let keyGroup = req.query.schedule_id ? 'schedule_id' : 'ledger_itemcheck_id'
            const groupByItemcheck = await groupFunction(waitMapSchedule, keyGroup)
            response.success(res, "success to get today activities", groupByItemcheck)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get today activities')
        }
    },

    // Disini nanti untuk today activities
    getTodayActivities: async(req, res) => {
        try {
            /*
                DATA MAP:
                1. GET SCHEDULES ALL BASED ON FILTER optional CURRENT DATE, LINE, STATUS
            */
            console.log(req.body);
            let containerFilter = queryHandler(req.body)
            containerFilter.length > 0 ? containerFilter = containerFilter.join(" AND ") : containerFilter = ""
            let schedulesData = await queryGET(table.v_schedules_monthly, `WHERE ${containerFilter} ORDER BY day_idx`)
            let mapSchedulesPics = await schedulesData.map(async schedule => {
                let schedule_id = await uuidToId(table.tb_r_schedules, 'schedule_id', schedule.schedule_id) //table, col, uuid
                let q = `SELECT 
                trsc.uuid as schedule_checker_id,
                tmu.uuid as user_id,
                tmu.user_nm,
                tmu.noreg
                FROM tb_r_schedule_checker trsc
                JOIN tb_m_users tmu ON tmu.user_id = trsc.user_id
                WHERE trsc.schedule_id = ${schedule_id}`
                let checkers = await queryCustom(q)
                let dateOffset = new Date(((schedule.val_periodic * schedule.prec_val) * timestampDay)).getTime() + new Date(schedule.actual_check_dt ? schedule.actual_check_dt : schedule.plan_check_dt).getTime()
                schedule.next_check = new Date(dateOffset)
                schedule.checkers = checkers.rows
                return schedule
            })
            const waitMapSchedule = await Promise.all(mapSchedulesPics)
            response.success(res, "success to get schedules", waitMapSchedule)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to get schedules')
        }
    },
    addPlanPic: async(req, res) => {
        // Assign PIC convert UUID to ID
        // tb_r_schedule_checker (user_id, schedule_id)
        try {
            let { user_ids, schedule_id } = req.body
            let containerArr = []
            let last_checker_id = await getLastIdData(table.tb_r_schedule_checker, 'schedule_checker_id')
            let scheduleId = await uuidToId(table.tb_r_schedules, 'schedule_id', schedule_id)
            for (let i = 0; i < user_ids.length; i++) {
                let user_id = user_ids[i]
                let userId = await uuidToId(table.tb_m_users, 'user_id', user_id)
                let objUser = {
                    schedule_checker_id: last_checker_id + i,
                    uuid: v4(),
                    schedule_id: scheduleId,
                    user_id: userId
                }
                containerArr.push(objUser)
            }
            console.log('Disini');
            console.log(containerArr);
            let instRes = await queryBulkPOST(table.tb_r_schedule_checker, containerArr)
            response.success(res, "success to add pic", instRes)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to add pic')
        }
    },
    editPlanDate: async(req, res) => {
        // Edit Plan Date
        //Update convert uuid to id schedule
        //Update table
        //tb_r_schedules plan_check_dt
        try {
            let { plan_check_dts, schedule_id } = req.body
            let scheduleId = await uuidToId(table.tb_r_schedules, 'schedule_id', schedule_id)

            let q = `update tb_r_schedules 
                set plan_check_dt = '${plan_check_dts}'
                WHERE schedule_id = ${scheduleId}`
            let update = await queryCustom(q)
            let updateObj = update.rows
            console.log(q);
            response.success(res, "success to edit plan date", q)
        } catch (error) {
            console.log(error);
            response.failed(res, 'Error to edit plan date')
        }
    }
}