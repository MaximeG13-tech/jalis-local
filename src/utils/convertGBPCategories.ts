// Utility to convert raw GBP categories to structured format
export const convertRawCategoriesToJSON = async (): Promise<{ id: string; displayName: string }[]> => {
  try {
    const response = await fetch('/gcid_raw.txt');
    const text = await response.text();
    
    // Parse the array format from the text file
    const categoriesArray = JSON.parse(text);
    
    // Convert to structured format with id and displayName
    return categoriesArray.map((category: string) => ({
      id: `gcid:${category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      displayName: category
    }));
  } catch (error) {
    console.error('Error converting GBP categories:', error);
    return [];
  }
};
