var express = require('express');
const { getHistory, getNewItem } = require('../../controllers/tpm/history.controllers');
var router = express.Router();

router.get('/search', getHistory)
router.get('/getNewItem', getNewItem)

module.exports = router