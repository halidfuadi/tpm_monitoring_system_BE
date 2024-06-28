const table = require("../../config/table");
const {
  queryPOST,
  queryPUT,
  queryGET,
  queryCustom,
  queryBulkPOST,
} = require("../../helpers/query");

const response = require("../../helpers/response");
const { groupFunction } = require("../../functions/groupFunction");
const queryHandler = require("../queryhandler.function");
const getLastIdData = require("../../helpers/getLastIdData");
const { v4 } = require("uuid");
const { getRounds } = require("bcryptjs");
let timestampDay = 24 * 60 * 60 * 1000;

async function uuidToId(table, col, uuid) {
  console.log(`SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`);
  // `SELECT ${col} FROM ${table} WHERE uuid = '${uuid}'`
  let rawId = await queryGET(table, `WHERE uuid = '${uuid}'`, [col]);
  return rawId[0][col];
}

function getPreviousMonthRange() {
  let now = new Date();
  let firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let firstDayOfPreviousMonth = new Date(
    firstDayOfCurrentMonth.setMonth(firstDayOfCurrentMonth.getMonth() - 1)
  );
  let lastDayOfPreviousMonth = new Date(
    firstDayOfPreviousMonth.getFullYear(),
    firstDayOfPreviousMonth.getMonth() + 1,
    0
  );

  // Format the dates as 'YYYY-MM-DD'
  let formatDate = (date) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) month = "0" + month;
    if (day < 10) day = "0" + day;
    return `${year}-${month}-${day}`;
  };

  return {
    firstDay: formatDate(firstDayOfPreviousMonth),
    lastDay: formatDate(lastDayOfPreviousMonth),
  };
}

module.exports = {
  getSchedule: async (req, res) => {
    try {
      /*
                DATA MAP:
                1. GET SCHEDULES ALL BASED ON FILTER optional CURRENT MONTH, PLANT, LINE, MACHINE, INCHARGE, STATUS
                2. GROUPING ITEM CHECK IS_HAVING revision_parent_id = schedule_id
                3. GET pic from tb_r_schedule_checker schedule_id
            */
      let containerFilter = queryHandler(req.query);

      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");
      let schedulesData = await queryGET(
        table.v_schedules_monthly,
        `WHERE ${containerFilter} AND deleted_dt IS NULL ORDER BY machine_nm`
      );
      let mapSchedulesPics = await schedulesData.map(async (schedule) => {
        let schedule_id = await uuidToId(
          table.tb_r_schedules,
          "schedule_id",
          schedule.schedule_id
        ); //table, col, uuid
        let q = `SELECT 
                trsc.uuid as schedule_checker_id,
                tmu.uuid as user_id,
                tmu.user_nm,
                tmu.noreg
                FROM tb_r_schedule_checker trsc
                JOIN tb_m_users tmu ON tmu.user_id = trsc.user_id
                WHERE trsc.schedule_id = ${schedule_id}`;
        let checkers = await queryCustom(q);
        let dateOffset =
          new Date(
            schedule.val_periodic * schedule.prec_val * timestampDay
          ).getTime() +
          new Date(
            schedule.actual_check_dt
              ? schedule.actual_check_dt
              : schedule.plan_check_dt
          ).getTime();
        schedule.next_check = new Date(dateOffset);
        schedule.checkers = checkers.rows;
        return schedule;
      });
      const waitMapSchedule = await Promise.all(mapSchedulesPics);
      let keyGroup = req.query.schedule_id
        ? "schedule_id"
        : "ledger_itemcheck_id";
      const groupByItemcheck = await groupFunction(waitMapSchedule, keyGroup);
      response.success(
        res,
        "success to get today activities",
        groupByItemcheck
      );
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get today activities");
    }
  },
  getTodayActivities: async (req, res) => {
    try {
      /*
                DATA MAP:
                1. GET SCHEDULES ALL BASED ON FILTER optional CURRENT DATE, LINE, STATUS
            */
      console.log(req.body);
      let containerFilter = queryHandler(req.body);
      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");
      let schedulesData = await queryGET(
        table.v_schedules_monthly,
        `WHERE ${containerFilter} ORDER BY day_idx`
      );
      let mapSchedulesPics = await schedulesData.map(async (schedule) => {
        let schedule_id = await uuidToId(
          table.tb_r_schedules,
          "schedule_id",
          schedule.schedule_id
        ); //table, col, uuid
        let q = `SELECT 
                trsc.uuid as schedule_checker_id,
                tmu.uuid as user_id,
                tmu.user_nm,
                tmu.noreg
                FROM tb_r_schedule_checker trsc
                JOIN tb_m_users tmu ON tmu.user_id = trsc.user_id
                WHERE trsc.schedule_id = ${schedule_id}`;
        let checkers = await queryCustom(q);
        let dateOffset =
          new Date(
            schedule.val_periodic * schedule.prec_val * timestampDay
          ).getTime() +
          new Date(
            schedule.actual_check_dt
              ? schedule.actual_check_dt
              : schedule.plan_check_dt
          ).getTime();
        schedule.next_check = new Date(dateOffset);
        schedule.checkers = checkers.rows;
        return schedule;
      });
      const waitMapSchedule = await Promise.all(mapSchedulesPics);
      response.success(res, "success to get today activities", waitMapSchedule);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get today activities");
    }
  },
  addPlanPic: async (req, res) => {
    // Assign PIC convert UUID to ID
    // tb_r_schedule_checker (user_id, schedule_id)
    try {
      let { user_ids, schedule_id } = req.body;
      let containerArr = [];
      let last_checker_id = await getLastIdData(
        table.tb_r_schedule_checker,
        "schedule_checker_id"
      );
      let scheduleId = await uuidToId(
        table.tb_r_schedules,
        "schedule_id",
        schedule_id
      );
      for (let i = 0; i < user_ids.length; i++) {
        let user_id = user_ids[i];
        let userId = await uuidToId(table.tb_m_users, "user_id", user_id);
        let objUser = {
          schedule_checker_id: last_checker_id + i,
          uuid: v4(),
          schedule_id: scheduleId,
          user_id: userId,
        };
        containerArr.push(objUser);
      }
      console.log("Disini");
      console.log(containerArr);
      let instRes = await queryBulkPOST(
        table.tb_r_schedule_checker,
        containerArr
      );
      response.success(res, "success to add pic", instRes);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to add pic");
    }
  },
  editPlanDate: async (req, res) => {
    // Edit Plan Date
    //Update convert uuid to id schedule
    //Update table
    //tb_r_schedules plan_check_dt
    try {
      let { plan_check_dts, schedule_id } = req.body;
      let scheduleId = await uuidToId(
        table.tb_r_schedules,
        "schedule_id",
        schedule_id
      );

      let q = `update tb_r_schedules 
                set plan_check_dt = '${plan_check_dts}'
                WHERE schedule_id = ${scheduleId}`;
      let update = await queryCustom(q);
      let updateObj = update.rows;
      console.log(q);
      response.success(res, "success to edit plan date", q);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to edit plan date");
    }
  },

  getDelayedItem: async (rea, res) => {
    try {
      // Get the previous month date range
      let previousMonthRange = getPreviousMonthRange();
    
      // Fetch delayed data
      let delayedData = await queryGET(
        table.v_schedules_monthly,
        `WHERE status_nm = 'DELAY' AND val_periodic != 1 AND period_nm != 'Month' AND plan_check_dt >= '${previousMonthRange.firstDay}' AND plan_check_dt <= '${previousMonthRange.lastDay}'`
      );
    
      let groupedData = delayedData.reduce((acc, item) => {
        if (!acc[item.line_nm]) {
          acc[item.line_nm] = { items: [], count: 0 };
        }
        acc[item.line_nm].items.push(item);
        acc[item.line_nm].count++;
        return acc;
      }, {});
    
      let result = Object.keys(groupedData).map((key) => ({
        line_nm: key,
        items: groupedData[key].items,
        count: groupedData[key].count,
      }));
    
      // Output the result
      console.log(result);
      response.success(res, "berhasil", result);
    } catch (error) {
      console.log(error);
    }
    
    
  },

  getVisualize: async (req, res) => {
    try {
      let containerFilter = queryHandler(req.body);
      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");
      let schedulesData = await queryGET(
        table.v_schedules_monthly,
        `WHERE ${containerFilter} ORDER BY day_idx`
      );
      let mapScheduleVisualize = await schedulesData.map(async (schedule) => {
        let schedule_id = await uuidToId(
          table.tb_r_schedules,
          "schedule_id",
          schedule.schedule_id
        ); //table, col, uuid
        // Add plan_duration and actual_duration columns from tb_r_schedules table
        let scheduleData = await queryGET(
          table.tb_r_schedules,
          `WHERE schedule_id = ${schedule_id}`
        );
        if (scheduleData.length > 0) {
          schedule.plan_duration = scheduleData[0].plan_duration;
          schedule.actual_duration = scheduleData[0].actual_duration;
        } else {
          schedule.plan_duration = null;
          schedule.actual_duration = null;
        }
        return schedule;
      });
      const waitMapSchedule = await Promise.all(mapScheduleVisualize);

      let series = [
        {
          name: "actual duration",
          type: "column",
          data: [],
        },
        {
          name: "plan duration",
          type: "line",
          data: [],
        },
      ];
      let labels = [];

      waitMapSchedule.forEach((schedule) => {
        series[0].data.push(schedule.actual_duration ?? 0);
        series[1].data.push(schedule.plan_duration);
        labels.push(schedule.itemcheck_nm.slice(0, 10));
        // console.log(schedule);
      });

      const visualizeData = {
        series,
        labels,
      };

      response.success(
        res,
        "success to get visualization of item check",
        visualizeData
      );
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get visualization of item check");
    }
  },
  getVisualizeStatus: async (req, res) => {
    try {
      let containerFilter = queryHandler(req.body);
      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");

      let q = `
            SELECT 
                line_nm,
                SUM(CASE WHEN status_nm = 'DONE' THEN 1 ELSE 0 END) AS DONE,
                SUM(CASE WHEN status_nm = 'PLANNING' THEN 1 ELSE 0 END) AS PLANNING,
                SUM(CASE WHEN status_nm = 'DELAY' THEN 1 ELSE 0 END) AS DELAY,
                SUM(CASE WHEN status_nm IN ('DONE', 'PLANNING', 'DELAY') THEN 1 ELSE 0 END) AS TOTAL
            FROM 
                v_schedules_monthly vsm
            WHERE ${containerFilter}
            GROUP BY line_nm
                   
            `;
      console.log(q);
      cons = (await queryCustom(q)).rows;
      console.log(cons);
      let series = [
        {
          name: "Planned",
          type: "column",
          data: [],
        },
        {
          name: "Done",
          type: "column",
          data: [],
        },
        {
          name: "Total Item",
          type: "line",
          data: [],
        },
        {
          name: "Delay",
          type: "column",
          data: [],
        },
      ];
      let labels = [];

      cons.forEach((cons) => {
        series[0].data.push(cons.planning ?? 0);
        series[1].data.push(cons.done ?? 0);
        series[2].data.push(cons.total ?? 0);
        series[3].data.push(cons.delay ?? 0);
        labels.push(cons.line_nm);
        // console.log(schedule);
      });

      console.log(cons);

      const visualizeData = {
        series,
        labels,
      };

      response.success(res, "berhasil", visualizeData);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get visualization of item check");
    }
  },
  getVisualizeLine: async (req, res) => {
    try {
      let containerFilter = queryHandler(req.body);
      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");

      let q = `
                SELECT line_nm, 
                COUNT(*) AS item_count,
                SUM(duration) AS total_duration
                FROM v_schedules_monthly vsm
                WHERE ${containerFilter}
                GROUP BY line_nm;                        
            `;
      cons = (await queryCustom(q)).rows;

      let series = [
        {
          name: "Total Item",
          type: "column",
          data: [],
        },
        {
          name: "Total Duration",
          type: "column",
          data: [],
        },
      ];
      let labels = [];

      cons.forEach((cons) => {
        series[0].data.push(cons.item_count ?? 0);
        series[1].data.push(Math.round((cons.total_duration ?? 0) / 60));
        labels.push(cons.line_nm);
        // console.log(schedule);
      });

      const visualizeData = {
        series,
        labels,
      };

      response.success(res, "berhasil", visualizeData);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get visualization of item check");
    }
  },

  getVusualizeYearly: async (req, res) => {
    try {
      let containerFilter = queryHandler(req.body);
      console.log(containerFilter);
      containerFilter.length > 0
        ? (containerFilter = containerFilter.join(" AND "))
        : (containerFilter = "");

      let dataset = [];
      for (let i = 1; i <= 12; i++) {
        let q = `
                SELECT line_nm, 
                COUNT(*) AS item_count,                
                SUM(duration) AS total_duration
                FROM v_schedules_monthly vsm
                WHERE ${containerFilter} AND EXTRACT('month' from plan_check_dt) = ${i}
                GROUP BY line_nm;                        
            `;
        console.log(q);
        cons = (await queryCustom(q)).rows;

        let series = [
          {
            name: "Total Item",
            type: "column",
            data: [],
          },
          {
            name: "Total Duration",
            type: "column",
            data: [],
          },
        ];
        let labels = [];

        cons.forEach((cons) => {
          series[0].data.push(cons.item_count ?? 0);
          series[1].data.push(Math.round((cons.total_duration ?? 0) / 60));
          // series[2].data.push(cons.total_item_count ?? 0);
          labels.push(cons.line_nm);
        });

        const visualizeData = {
          series,
          labels,
        };
        dataset[i] = visualizeData;
      }
      response.success(res, "berhasil", dataset);
    } catch (error) {
      console.log(error);
      response.failed(res, "Error to get visualization of item check");
    }
  },
};
