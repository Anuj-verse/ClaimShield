const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { uploadClaim, getClaims, getClaimById, getRecentClaims } = require('../controllers/claimsController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
});
const upload = multer({ storage });

router.post('/', auth, upload.array('files', 10), uploadClaim);
router.get('/recent', auth, getRecentClaims);
router.get('/', auth, getClaims);
router.get('/:id', auth, getClaimById);

module.exports = router;
