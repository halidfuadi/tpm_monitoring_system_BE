const moment = require('moment')
const { queryGET, queryPOST } = require('../helpers/query')
const table = require('../config/table')
const getLastIdData = require('../helpers/getLastIdData')
const { v4 } = require('uuid');
async function cronGeneratorSchedule() {
    /*
        1. GET VIEW v_generate_itemcheck WHERE forecase one month before AND IS not DAILY
        2. Generate True: 
            DECLARE offsettime = last_check_dt + (val_periodic * prec_vals)
            IF current_date <= offsettime THEN
                DECLARE dataAvail = GET tb_r_schedules WHERE plant_check_dt <> offsettime AND actual_check_dt IS NULL
                IF dataAvail length IS 0 THEN
                    GET LastId
                    CREATE tb_r_schedules ledger_itemcheck_id, status_id = 0
    */
    // IMPORTANT: if any revision ledger STILL NOT HANDLED

    let itemchecks = await queryGET(table.v_generator_itemchecks, ` WHERE deleted_dt IS NULL AND period_nm <> 'DAY'`)
    let successCreatedCount = 0
    let mapItemCheck = await itemchecks.map(async(itemcheck, i) => {
        // console.log(itemcheck);
        const timemilisecOffset = 1000 * 60 * 60 * 24
        const forecaseSubsOneMonth = timemilisecOffset * 30 // for advance generator one month before
        let offsettime = new Date(itemcheck.last_check_dt).getTime() + (timemilisecOffset * +itemcheck.val_periodic * +itemcheck.prec_val)
        let timeLastCheck = new Date().getTime() - forecaseSubsOneMonth
        const isDateGB = offsettime >= timeLastCheck // GB = Greatherthen Before
        // console.log(itemcheck.itemcheck_id);
        if (isDateGB) {
            const formattedDate = moment(offsettime).format('YYYY-MM-DD')
            // console.log(formattedDate);
            let scheduleData = await queryGET(table.tb_r_schedules, `WHERE plan_check_dt = '${formattedDate}' AND actual_check_dt IS NULL AND ledger_itemcheck_id = '${itemcheck.ledger_itemcheck_id}'`)
            // console.log(scheduleData);
            const scheduleNotYetCreated = scheduleData.length == 0
            if(itemcheck.itemcheck_id == 831) {
                console.log(scheduleData);
                console.log(itemcheck);
                console.log(offsettime, timeLastCheck);
            }
            if (scheduleNotYetCreated) {
                let newSchedule = {
                    schedule_id: await getLastIdData(table.tb_r_schedules, 'schedule_id') + i,
                    uuid: v4(),
                    ledger_itemcheck_id: itemcheck.ledger_itemcheck_id,
                    plan_duration: itemcheck.duration,
                    plan_check_dt: formattedDate,
                    status_id: 0,
                    created_by: 'GENERATOR'
                }

                const resp = await queryPOST(table.tb_r_schedules, newSchedule)
                console.log('DATA INSERTED');

                successCreatedCount += 1
                return successCreatedCount
            }
        }
    })
    const waitmap = await Promise.all(mapItemCheck)
    if (waitmap) console.log(`DATA INSERTED TOTAL: ${successCreatedCount}`);
}

module.exports = cronGeneratorSchedule