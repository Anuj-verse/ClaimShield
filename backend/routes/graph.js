const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGraph } = require('../controllers/graphController');

router.get('/:claimId', auth, getGraph);

module.exports = router;
