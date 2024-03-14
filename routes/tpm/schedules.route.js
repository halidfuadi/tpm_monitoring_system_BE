var express = require('express');
const schedulesControllers = require('../../controllers/tpm/schedules.controllers');
var router = express.Router();

router.get('/search', schedulesControllers.getSchedule)
router.post('/add/pic', schedulesControllers.addPlanPic)


module.exports = router