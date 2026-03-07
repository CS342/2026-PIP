// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient } from '@medplum/core';
import { checkAndDiscardExpiredPositioners, cleanupDuplicatePositioners } from './positioner';

let hasInitialized = false;

/**
 * Start periodic expiration checking and initial cleanup
 * 
 * Only runs when user is authenticated.
 * 
 * On first run after auth:
 * - Cleans up any duplicate positioners (keeps most recent, deletes others)
 * - Checks for and discards expired positioners
 * 
 * Then runs every 5 minutes:
 * - Checks for and auto-discards expired positioners
 */
export function startExpirationChecker(medplum: MedplumClient): () => void {
  // Check every 5 seconds if user is authenticated, then start the checker
  const authCheckInterval = setInterval(async () => {
    // Only proceed if user is logged in
    const profile = medplum.getProfile();
    if (!profile) {
      return; // Not logged in yet, wait
    }
    
    // Only initialize once
    if (hasInitialized) {
      return;
    }
    hasInitialized = true;
    
    console.log('User authenticated, starting expiration checker...');
    
    // Run cleanup of duplicates on startup (one-time)
    try {
      await cleanupDuplicatePositioners(medplum);
    } catch (e) {
      console.error('Error cleaning up duplicates:', e);
    }
    
    // Run expiration check immediately
    try {
      await checkAndDiscardExpiredPositioners(medplum);
    } catch (e) {
      console.error('Error checking expirations:', e);
    }
  }, 5000);

  // Then run expiration check every 5 minutes (only if authenticated)
  const expirationInterval = setInterval(async () => {
    const profile = medplum.getProfile();
    if (!profile) {
      return; // Not logged in, skip
    }
    
    try {
      await checkAndDiscardExpiredPositioners(medplum);
    } catch (e) {
      console.error('Error checking expirations:', e);
    }
  }, 5 * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(authCheckInterval);
    clearInterval(expirationInterval);
  };
}
