var express = require('express');
const schedulesControllers = require('../../controllers/tpm/schedules.controllers');
var router = express.Router();

router.get('/search', schedulesControllers.getSchedule)
router.get('/today-activities', schedulesControllers.getTodayActivities)
router.post('/add/pic', schedulesControllers.addPlanPic)
router.post('/edit/plandate', schedulesControllers.editPlanDate)


module.exports = router