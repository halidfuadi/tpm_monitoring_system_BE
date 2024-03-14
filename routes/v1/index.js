var express = require('express');
var router = express.Router();
const login = require('../auth/login')
const tpm = require('../tpm/index')

router.use('/login', login)
router.use('/v1', tpm)

module.exports = router