var express = require('express');
const { sparepartAdd, sparepartsGet, sparepartEdit, sparepartDelete, sparepartsGetDetail } = require('../../controllers/master/spareparts.controller');
var router = express.Router();

router.get('/get-sparepart/search', sparepartsGet)
router.get('/get-sparepart-detail/search', sparepartsGetDetail)
router.post('/add-part', sparepartAdd)
router.put('/edit-part', sparepartEdit)
router.delete('/delete-part', sparepartDelete)


module.exports = router