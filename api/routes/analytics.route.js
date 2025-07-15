import express from 'express'
import {
  getAnalytics,
  getAnalyticsForOutlet,
  getAnalyticsForPeriod,
  getAnalyticsForOutletAndPeriod,
  getAnalyticsForOutletAndPeriodAndDate,
} from '../controllers/analytics.controller.js'




const router = express.Router()

router.get('/', getAnalytics)
router.get('/outlet/:outletId', getAnalyticsForOutlet)
router.get('/period/:period', getAnalyticsForPeriod)
router
  .get('/outlet/:outletId/period/:period', getAnalyticsForOutletAndPeriod)
router.get('/outlet/:outletId/period/:period/date/:date', getAnalyticsForOutletAndPeriodAndDate)



export default router