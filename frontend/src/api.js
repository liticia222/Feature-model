/**
 * api.js — Communication with the backend solver
 */

const API_BASE = '/api';

/**
 * Validate a configuration against the feature model constraints.
 * @param {Object} model  — serialized graph model
 * @param {Object} config — { selectedFeatures: string[] }
 * @returns {Promise<{valid: boolean, message: string, conflicts?: string[]}>}
 */
export async function validateConfiguration(model, config) {
  try {
    const res = await fetch(`${API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, config }),
    });
    if (!res.ok) {
      return { valid: false, message: `Server error: ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return { valid: false, message: `Connection error: ${err.message}` };
  }
}
