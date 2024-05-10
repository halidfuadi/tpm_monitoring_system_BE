var express = require('express');
const { getLedgers, getDetail, getUpdate } = require('../../controllers/tpm/ledgers.controllers');
var router = express.Router();

router.get('/search', getLedgers)
router.get('/detail/search', getDetail) // //delete item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body
router.get('/new_data', getUpdate)

module.exports = router