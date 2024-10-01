// db.js

import { API_BASE_URL } from './config.js';

// Save a setting to the server
export async function saveSetting(key, value) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) {
      throw new Error('Failed to save setting');
    }
  } catch (error) {
    console.error('Error saving setting:', error);
  }
}

// Retrieve a setting from the server
export async function getSetting(key) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/${encodeURIComponent(key)}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve setting');
    }
    const value = await response.json();
    return value;
  } catch (error) {
    console.error('Error retrieving setting:', error);
    return null;
  }
}
