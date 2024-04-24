var express = require('express');
const { getLedgers, getDetail, addItemCheck, deleteItemCheck, editItemCheck } = require('../../controllers/tpm/ledgers.controllers');
var router = express.Router();

router.get('/search', getLedgers)
router.get('/detail?:id', getDetail)
router.post('/addItemCheck', addItemCheck) //add item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body
router.put('/editItemCheck', editItemCheck) ////edit item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body
router.delete('/deleteItemCheck', deleteItemCheck) // //delete item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body

module.exports = router