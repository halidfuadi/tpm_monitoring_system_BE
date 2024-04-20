var express = require('express');
const { inchargeTpm, inchargeTpmOpt, machineTpmOpt, lineTpmOpt } = require('../../helpers/filterHelper.controller');
var router = express.Router();inchargeTpm


router.post('/incharge', inchargeTpmOpt)
router.post('/machine', machineTpmOpt)
router.post('/line', lineTpmOpt)

module.exports = router