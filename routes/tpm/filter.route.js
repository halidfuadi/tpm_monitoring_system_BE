var express = require('express');
const { inchargeTpmOpt, machineTpmOpt, lineTpmOpt } = require('../../helpers/filterHelper.controller');
var router = express.Router();


router.post('/incharge', inchargeTpmOpt)
router.post('/machine', machineTpmOpt)
router.post('/line', lineTpmOpt)

module.exports = router