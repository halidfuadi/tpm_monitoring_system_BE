var express = require('express');
const { sparepartAdd, sparepartsGet, sparepartEdit, sparepartDelete } = require('../../controllers/master/spareparts.controller');
var router = express.Router();

router.get('/get-sparepart', sparepartsGet)
router.post('/add-part', sparepartAdd)
router.put('/edit-part', sparepartEdit)
router.delete('/delete-part', sparepartDelete)


module.exports = router