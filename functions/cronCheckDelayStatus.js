const moment = require('moment')
const { queryGET, queryPOST, queryPUT } = require('../helpers/query')
const table = require('../config/table')


async function cronCheckDelayStatus() {
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    let itemchecks = await queryGET(table.v_schedules_monthly, ` WHERE deleted_dt IS NULL AND period_nm <> 'DAY' AND EXTRACT(MONTH FROM plan_check_dt) = ${month}
    AND EXTRACT(YEAR FROM plan_check_dt) = ${year};`)
        // console.log(itemchecks);
    for (let index = 0; index < itemchecks.length; index++) {
        const element = itemchecks[index];
        // console.log(element);
        let timePlan = new Date(element.plan_check_dt).getTime()
        let currentTime = new Date().getTime()
        const isDelay = (timePlan - currentTime) + (23 * 60 * 60 * 1000) < 0 && !element.actual_check_dt
        const schedule_id = element.schedule_id
        const findingData = await queryGET(table.v_tpm_findings, `WHERE schedule_id = '${schedule_id}'`)
        const is_any_finding = findingData.length > 0
            // 0: planning
            // 1: delay
            // 2: finding
            // 3: revisi
            // 4: done
        if (isDelay) {
            await queryPUT(table.tb_r_schedules, { status_id: 1 }, `WHERE uuid = '${schedule_id}'`)
        } else if (element.actual_check_dt && !is_any_finding) {
            await queryPUT(table.tb_r_schedules, { status_id: 4 }, `WHERE uuid = '${schedule_id}'`)
        } else if (is_any_finding) {
            await queryPUT(table.tb_r_schedules, { status_id: 2 }, `WHERE uuid = '${schedule_id}'`)
        } else {
            await queryPUT(table.tb_r_schedules, { status_id: 0 }, `WHERE uuid = '${schedule_id}'`)
        }
    }
}

module.exports = cronCheckDelayStatus