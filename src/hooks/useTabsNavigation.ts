import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage active tab state and navigation for a dynamic list of tabs.
 * @param availableTabIds - An array of the current NUMERIC IDs available for tabs.
 */
export function useTabsNavigation(availableTabIds: number[]) {
    const [activeTabId, setActiveTabId] = useState<number | null>(null);

    // Effect to set the initial active tab when the list loads or changes
    useEffect(() => {
        // Convert array to string for dependency comparison
        const idsKey = JSON.stringify(availableTabIds.sort()); // Sort for stability

        if (availableTabIds.length > 0 && (activeTabId === null || !availableTabIds.includes(activeTabId))) {
            // If no active tab, or current active tab is no longer valid, set to the first available
            setActiveTabId(availableTabIds[0]);
        } else if (availableTabIds.length === 0) {
            // If the list becomes empty, set active tab to null
            setActiveTabId(null);
        }
    }, [JSON.stringify(availableTabIds.sort()), activeTabId]); // Use sorted stringified array

    /**
     * Calculates the ID of the next tab to activate after a tab is removed.
     * @param removedTabId - The NUMERIC ID of the tab that was just removed.
     * @returns The ID of the next tab to activate, or null if no tabs remain.
     */
    const getNextTabId = useCallback((removedTabId: number): number | null => {
        const currentIndex = availableTabIds.indexOf(removedTabId);
        // Create the list of remaining IDs *based on the current state when the hook runs*
        const remainingTabIds = availableTabIds.filter(id => id !== removedTabId);

        if (remainingTabIds.length === 0) {
            return null; // No tabs left
        }

        if (currentIndex === -1 || currentIndex >= remainingTabIds.length) {
            // If the removed tab wasn't found (shouldn't happen) or was the last one,
            // select the new last tab.
            return remainingTabIds[remainingTabIds.length - 1];
        } else {
            // Otherwise, select the tab that is now at the same index
            return remainingTabIds[currentIndex];
        }
    }, [JSON.stringify(availableTabIds.sort())]); // Update when sorted IDs change

    return {
        activeTabId,
        setActiveTabId,
        getNextTabId,
    };
} 