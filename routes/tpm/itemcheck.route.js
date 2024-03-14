var express = require('express');
const { getItemcheck } = require('../../controllers/master/itemcheck.controllers');
var router = express.Router();

router.get('/search', getItemcheck)

module.exports = router