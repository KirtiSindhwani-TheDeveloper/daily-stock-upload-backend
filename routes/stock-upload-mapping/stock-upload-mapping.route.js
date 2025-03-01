import express from 'express';
const router=express.Router();
import { addColumnMapping, alreadyExistedColumnMapping, editColumnMapping, viewColumnMapping } from '../../controllers/stock-upload-mapping/stock-upload-mapping.controller.js';
router.post('/create',addColumnMapping);
router.post('/view',viewColumnMapping);
router.post('/edit',editColumnMapping);
router.post('/already-existed',alreadyExistedColumnMapping)
export default router;