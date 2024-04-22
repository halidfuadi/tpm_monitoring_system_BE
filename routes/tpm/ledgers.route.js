var express = require('express');
const { getLedgers } = require('../../controllers/tpm/ledgers.controllers');
var router = express.Router();

router.get('/get', getLedgers)


module.exports = router