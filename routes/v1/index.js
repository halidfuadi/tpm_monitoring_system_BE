var express = require('express');
var router = express.Router();
const login = require('../auth/login')
const tpm = require('../tpm/index')

router.use('/login', login)
router.use('/tpm', tpm)

module.exports = router