/**
 * Converts a 24-hour time string (e.g., "14:00:00", "09:30") to a 12-hour format with AM/PM (e.g., "02:00 PM", "09:30 AM")
 */
export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr) return ''
  
  // Split hours, minutes, and optional seconds
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  
  if (isNaN(hours)) return timeStr
  
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12 // Map hour '0' to '12'
  
  const formattedHours = hours < 10 ? `0${hours}` : hours
  return `${formattedHours}:${minutes} ${ampm}`
}
