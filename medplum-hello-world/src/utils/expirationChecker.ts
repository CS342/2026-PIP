// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { MedplumClient } from '@medplum/core';
import { checkAndDiscardExpiredPositioners, cleanupDuplicatePositioners } from './positioner';

/**
 * Start periodic expiration checking and initial cleanup
 * 
 * On startup:
 * - Cleans up any duplicate positioners (keeps most recent, deletes others)
 * - Checks for and discards expired positioners
 * 
 * Then runs every 5 minutes:
 * - Checks for and auto-discards expired positioners
 */
export function startExpirationChecker(medplum: MedplumClient): () => void {
  // Run cleanup of duplicates on startup (one-time)
  cleanupDuplicatePositioners(medplum);
  
  // Run expiration check immediately
  checkAndDiscardExpiredPositioners(medplum);

  // Then run expiration check every 5 minutes
  const interval = setInterval(() => {
    checkAndDiscardExpiredPositioners(medplum);
  }, 5 * 60 * 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
