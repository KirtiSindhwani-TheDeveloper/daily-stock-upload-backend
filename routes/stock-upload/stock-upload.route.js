import express from 'express';
const router=express.Router();
import multer from "multer";
import fs from 'fs';
import {uploadDataSingleLocation,getPartNotInMasterSingleLocation,allRecordsSingleLocation,uploadedDataSingleLocation} from '../../controllers/stock-upload/stock-upload.controller.js'

const uploadsDir='./mapping-uploads';
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
const upload=multer({storage:storage});

router.post('/single-location',upload.single('excelFile'),uploadDataSingleLocation)
router.post('/part-not-in-master',getPartNotInMasterSingleLocation)
router.post('/all-uploadedData',uploadedDataSingleLocation)
router.post('/all-records',allRecordsSingleLocation)
export default router