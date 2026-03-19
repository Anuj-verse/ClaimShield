const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { uploadClaim, getClaims, getClaimById, getRecentClaims } = require('../controllers/claimsController');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${path.basename(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', auth, upload.array('files', 10), uploadClaim);
router.get('/recent', auth, getRecentClaims);
router.get('/', auth, getClaims);
router.get('/:id', auth, getClaimById);

module.exports = router;
