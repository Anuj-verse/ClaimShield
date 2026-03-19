const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadClaim, getClaims, getClaimById, getRecentClaims, getUploadUrl } = require('../controllers/claimsController');

router.get('/upload-url', auth, getUploadUrl);
router.post('/', auth, uploadClaim);
router.get('/recent', auth, getRecentClaims);
router.get('/', auth, getClaims);
router.get('/:id', auth, getClaimById);

module.exports = router;
