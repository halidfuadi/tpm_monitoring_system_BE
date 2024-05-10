var express = require('express');
const { getItemcheck, addItemCheck, editItemCheck, deleteItemCheck } = require('../../controllers/master/itemcheck.controllers');
var router = express.Router();

router.get('/search', getItemcheck)
router.post('/addItemCheck', addItemCheck) //add item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body
router.put('/editItemCheck', editItemCheck) ////edit item check parameter nya ledger id, lalu datanya yang akan di add disimpan di body
router.delete('/deleteItemCheck', deleteItemCheck)

module.exports = router