// Utility function to format milliseconds to mm:ss format
export function formatDuration(milliseconds) {
  if (!milliseconds || isNaN(milliseconds)) return '00:00';
  
  // Convert to seconds
  const totalSeconds = Math.floor(milliseconds / 1000);
  
  // Calculate minutes and seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Add leading zeros if needed
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
}