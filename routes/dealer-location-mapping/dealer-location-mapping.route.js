import express from 'express';
const router=express.Router();
import addDealerLocationMapping from '../../controllers/dealer-location-mapping/dealer-location-mapping.controller.js';
import fs from 'fs'
import multer from 'multer';
// import {multer} from 'multer';
const uploadsDir = './mapping-uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
router.post('/create',upload.single('excelFile'),addDealerLocationMapping)

export default router;