
import users from '../models/users.model.js';
import Analytics from '../models/analytics.model.js';


export const getAnalytics = async (req, res) => {
  try {
    const { period, outletId } = req.query;
    const analytics = await Analytics.find({
      period,
      outletId,
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getAnalyticsForOutlet = async (req, res) => {
  try {
    const { outletId } = req.params;
    const { period } = req.query;
    const analytics = await Analytics.find({
      period,
      outletId,
    });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getAnalyticsForPeriod = async (req, res) => {
  try {
    const { period } = req.params;
    const analytics = await Analytics.find({
      period,
    }).populate('outletId');
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getAnalyticsForOutletAndPeriod = async (req, res) => {
  try {
    const { outletId, period } = req.params;
    const analytics = await Analytics.find({
      period,
      outletId,
    }).populate('outletId');
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getAnalyticsForOutletAndPeriodAndDate = async (req, res) => {
  try {
    const { outletId, period, date } = req.params;
    const analytics = await Analytics.find({
      period,
      outletId,
      date,
    }).populate('outletId');
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

