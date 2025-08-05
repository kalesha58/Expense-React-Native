/**
 * Format date from API format (e.g., "15-FEB-23") to readable format
 */
export const formatTransactionDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Handle API date format like "15-FEB-23"
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      
      // Convert month abbreviation to number
      const monthMap: { [key: string]: string } = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      
      const monthNum = monthMap[month.toUpperCase()];
      if (monthNum) {
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(`${fullYear}-${monthNum}-${day.padStart(2, '0')}`);
        return date.toLocaleDateString();
      }
    }
    
    // Fallback: try to parse as regular date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    
    // If all else fails, return the original string
    return dateString;
  } catch (error) {
    // Return original string if parsing fails
    return dateString;
  }
}; 