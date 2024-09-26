// permissions.js

// Verify permission to access a handle
export async function verifyPermission(fileHandle, mode = 'readwrite') {
  const options = { mode };
  // Check if permission was already granted
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  // Permission was not granted
  return false;
}
