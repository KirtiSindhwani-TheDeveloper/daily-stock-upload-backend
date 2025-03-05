import express from 'express';
const router= express.Router();
import utilitesRoutes from '../routes/utilities/utilities.route.js';
import stockUploadMappingRoutes from '../routes/stock-upload-mapping/stock-upload-mapping.route.js';
import dealerLocationRoutes from '../routes/dealer-location-mapping/dealer-location-mapping.route.js'
router.use('/utilities',utilitesRoutes)
router.use('/st-mapping',stockUploadMappingRoutes);
router.use('/dl-mapping',dealerLocationRoutes)
export default router;