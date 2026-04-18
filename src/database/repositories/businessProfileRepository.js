import { getDatabase } from '../db';

/**
 * Business Profile Repository
 * Handles all CRUD operations for business profile
 */

/**
 * Create or initialize business profile
 */
export async function initializeBusinessProfile(profileData) {
  const db = getDatabase();

  const {
    businessName,
    ownerName = '',
    openingBalance = 0,
    currency = 'PKR',
    setupComplete = false
  } = profileData;

  const now = new Date().toISOString();

  try {
    // Check if profile already exists
    const existing = await db.getFirstAsync(`SELECT id FROM business_profile LIMIT 1`);

    if (existing) {
      // Update existing profile
      return updateBusinessProfile(profileData);
    } else {
      // Create new profile
      await db.runAsync(
        `INSERT INTO business_profile 
         (id, business_name, owner_name, opening_balance, currency, setup_complete, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, businessName, ownerName, openingBalance, currency, setupComplete ? 1 : 0, now, now]
      );

      return getBusinessProfile();
    }
  } catch (error) {
    console.error('Error initializing business profile:', error);
    throw error;
  }
}

/**
 * Get business profile
 */
export async function getBusinessProfile() {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync(`SELECT * FROM business_profile LIMIT 1`);
    return result ? formatProfile(result) : null;
  } catch (error) {
    console.error('Error fetching business profile:', error);
    throw error;
  }
}

/**
 * Update business profile
 */
export async function updateBusinessProfile(updateData) {
  const db = getDatabase();

  const {
    businessName,
    ownerName,
    openingBalance,
    currency,
    setupComplete,
    lastMonthlyCheckin
  } = updateData;

  const now = new Date().toISOString();

  try {
    const updates = [];
    const values = [];

    if (businessName !== undefined) { updates.push('business_name = ?'); values.push(businessName); }
    if (ownerName !== undefined) { updates.push('owner_name = ?'); values.push(ownerName); }
    if (openingBalance !== undefined) { updates.push('opening_balance = ?'); values.push(openingBalance); }
    if (currency !== undefined) { updates.push('currency = ?'); values.push(currency); }
    if (setupComplete !== undefined) { updates.push('setup_complete = ?'); values.push(setupComplete ? 1 : 0); }
    if (lastMonthlyCheckin !== undefined) { updates.push('last_monthly_checkin = ?'); values.push(lastMonthlyCheckin); }

    updates.push('updated_at = ?');
    values.push(now);

    if (updates.length === 1) {
      // Only updated_at, no changes
      return getBusinessProfile();
    }

    const query = `UPDATE business_profile SET ${updates.join(', ')} WHERE id = 1`;
    await db.runAsync(query, values);

    return getBusinessProfile();
  } catch (error) {
    console.error('Error updating business profile:', error);
    throw error;
  }
}

/**
 * Mark setup as complete
 */
export async function completeSetup() {
  return updateBusinessProfile({ setupComplete: true });
}

/**
 * Check if setup is complete
 */
export async function isSetupComplete() {
  const profile = await getBusinessProfile();
  return profile?.setupComplete || false;
}

/**
 * Update last monthly checkin date
 */
export async function updateLastMonthlyCheckin(date) {
  return updateBusinessProfile({ lastMonthlyCheckin: date });
}

/**
 * Check if monthly checkin is needed
 */
export async function isMonthlyCheckinNeeded() {
  const profile = await getBusinessProfile();

  if (!profile?.lastMonthlyCheckin) {
    return true;
  }

  const lastCheckin = new Date(profile.lastMonthlyCheckin);
  const today = new Date();

  // If last checkin was in a different month, we need to checkin
  return lastCheckin.getMonth() !== today.getMonth() || 
         lastCheckin.getFullYear() !== today.getFullYear();
}

/**
 * Format database result to profile object
 */
function formatProfile(dbResult) {
  return {
    id: dbResult.id,
    businessName: dbResult.business_name,
    ownerName: dbResult.owner_name,
    openingBalance: dbResult.opening_balance,
    currency: dbResult.currency,
    setupComplete: Boolean(dbResult.setup_complete),
    lastMonthlyCheckin: dbResult.last_monthly_checkin,
    createdAt: dbResult.created_at,
    updatedAt: dbResult.updated_at
  };
}
