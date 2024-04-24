var express = require('express');
const { getLedgers, getDetail } = require('../../controllers/tpm/ledgers.controllers');
var router = express.Router();

router.get('/search', getLedgers)
router.get('/detail?:id', getDetail)


module.exports = router