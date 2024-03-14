var express = require('express');
const { getHistory } = require('../../controllers/tpm/history.controllers');
var router = express.Router();

router.get('/search', getHistory)

module.exports = router