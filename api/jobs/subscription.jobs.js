import Subscription from '../models/subscription.model.js';
import { checkActiveSubscription } from '../services/subscription.service.js';

/**
 * Job to check and update expired subscriptions
 * This should be run periodically (e.g., every hour)
 */
export const updateExpiredSubscriptions = async () => {
  try {
    console.log('🔍 Checking for expired subscriptions...');
    
    const now = new Date();
    
    // Find all active subscriptions that have expired
    const expiredSubscriptions = await Subscription.find({
      status: 'active',
      endDate: { $lte: now }
    });
    
    if (expiredSubscriptions.length === 0) {
      console.log('✅ No expired subscriptions found');
      return { updated: 0 };
    }
    
    console.log(`⚠️  Found ${expiredSubscriptions.length} expired subscriptions`);
    
    // Update all expired subscriptions
    const updatePromises = expiredSubscriptions.map(async (subscription) => {
      subscription.status = 'expired';
      subscription.history.push({
        action: 'auto_expired',
        date: now,
        reason: 'Subscription period ended'
      });
      await subscription.save();
      console.log(`📝 Updated subscription ${subscription._id} to expired`);
      return subscription;
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ${expiredSubscriptions.length} subscriptions`);
    
    return {
      updated: expiredSubscriptions.length,
      subscriptions: expiredSubscriptions.map(s => s._id)
    };
  } catch (error) {
    console.error('❌ Error updating expired subscriptions:', error);
    throw error;
  }
};

/**
 * Job to notify users of upcoming subscription expirations
 * This should be run daily
 */
export const notifyExpiringSubscriptions = async () => {
  try {
    console.log('📧 Checking for expiring subscriptions...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    
    // Find subscriptions expiring in 3 days
    const expiringInThreeDays = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: threeDaysFromNow,
        $lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('userId', 'email name');
    
    // Find subscriptions expiring in 1 day
    const expiringInOneDay = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: oneDayFromNow,
        $lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('userId', 'email name');
    
    console.log(`📧 Found ${expiringInThreeDays.length} subscriptions expiring in 3 days`);
    console.log(`📧 Found ${expiringInOneDay.length} subscriptions expiring in 1 day`);
    
    // Here you would integrate with your email service (SendGrid, SES, etc.)
    // For now, we'll just log it
    
    return {
      expiringInThreeDays: expiringInThreeDays.length,
      expiringInOneDay: expiringInOneDay.length
    };
  } catch (error) {
    console.error('❌ Error notifying expiring subscriptions:', error);
    throw error;
  }
};

/**
 * Initialize all subscription jobs
 * Call this function when your server starts
 */
export const initializeSubscriptionJobs = () => {
  console.log('🔄 Initializing subscription jobs...');
  
  // Run expired subscription check every hour
  setInterval(async () => {
    try {
      await updateExpiredSubscriptions();
    } catch (error) {
      console.error('Error in expired subscription job:', error);
    }
  }, 60 * 60 * 1000); // Every hour
  
  // Run expiring notification check daily
  setInterval(async () => {
    try {
      await notifyExpiringSubscriptions();
    } catch (error) {
      console.error('Error in notification job:', error);
    }
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  // Run immediately on startup
  updateExpiredSubscriptions().catch(console.error);
  
  console.log('✅ Subscription jobs initialized');
};
