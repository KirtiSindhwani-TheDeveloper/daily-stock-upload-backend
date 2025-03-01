import express from 'express';
const router= express.Router();
import utilitesRoutes from '../routes/utilities/utilities.route.js';
import stockUploadMappingRoutes from '../routes/stock-upload-mapping/stock-upload-mapping.route.js';
router.use('/utilities',utilitesRoutes)
router.use('/st-mapping',stockUploadMappingRoutes)
export default router;