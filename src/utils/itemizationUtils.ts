import { ExpenseDetail } from '../hooks/useExpenseDetails';

export interface ProcessedExpenseItem extends ExpenseDetail {
  hasItemized: boolean;
  itemizedCount: number;
  isParent: boolean;
  isChild: boolean;
  parentId?: string;
  children?: ProcessedExpenseItem[];
}

export interface GroupedExpenseItems {
  parentItems: ProcessedExpenseItem[];
  childItems: ProcessedExpenseItem[];
}

/**
 * Processes expense items to identify itemization relationships
 * @param items Array of expense items
 * @returns Object with parent and child items grouped
 */
export const processItemization = (items: ExpenseDetail[]): GroupedExpenseItems => {
  const parentItems: ProcessedExpenseItem[] = [];
  const childItems: ProcessedExpenseItem[] = [];
  
  // First pass: identify all items and their relationships
  const processedItems = items.map(item => {
    const isParent = item.ItemizationFlag === 'Y' && item.ItemizationParentId === '-1';
    const isChild = item.ItemizationFlag === 'Y' && item.ItemizationParentId !== '-1';
    
    return {
      ...item,
      hasItemized: isParent,
      itemizedCount: 0, // Will be calculated in next pass
      isParent,
      isChild,
      parentId: isChild ? item.ItemizationParentId : undefined,
    } as ProcessedExpenseItem;
  });
  
  // Second pass: count children for each parent and group items
  processedItems.forEach(item => {
    if (item.isParent) {
      // Find all children for this parent
      const children = processedItems.filter(child => 
        child.isChild && child.parentId === item.LineId
      );
      
      item.itemizedCount = children.length;
      item.children = children;
      parentItems.push(item);
    } else if (item.isChild) {
      childItems.push(item);
    } else {
      // Regular item (no itemization)
      parentItems.push(item);
    }
  });
  
  return { parentItems, childItems };
};

/**
 * Gets all items for a specific parent item (including the parent)
 * @param parentItem The parent item
 * @param allItems All expense items
 * @returns Array of items including parent and all its children
 */
export const getItemizedGroup = (parentItem: ExpenseDetail, allItems: ExpenseDetail[]): ProcessedExpenseItem[] => {
  const children = allItems.filter(item => 
    item.ItemizationFlag === 'Y' && 
    item.ItemizationParentId === parentItem.LineId
  );
  
  const processedParent = {
    ...parentItem,
    hasItemized: true,
    itemizedCount: children.length,
    isParent: true,
    isChild: false,
    children: children.map(child => ({
      ...child,
      hasItemized: false,
      itemizedCount: 0,
      isParent: false,
      isChild: true,
      parentId: parentItem.LineId,
    } as ProcessedExpenseItem)),
  } as ProcessedExpenseItem;
  
  return [processedParent, ...processedParent.children!];
};

/**
 * Checks if an item has itemized sub-items
 * @param item The expense item to check
 * @returns True if the item has itemized sub-items
 */
export const hasItemizedSubItems = (item: ExpenseDetail): boolean => {
  return item.ItemizationFlag === 'Y' && item.ItemizationParentId === '-1';
};

/**
 * Gets the count of itemized sub-items for a parent item
 * @param parentItem The parent item
 * @param allItems All expense items
 * @returns Number of itemized sub-items
 */
export const getItemizedCount = (parentItem: ExpenseDetail, allItems: ExpenseDetail[]): number => {
  return allItems.filter(item => 
    item.ItemizationFlag === 'Y' && 
    item.ItemizationParentId === parentItem.LineId
  ).length;
};
