import { useState, useEffect, useCallback } from 'react';

export interface VaultCustomization {
  address: string;
  name?: string;
  description?: string;
  category?: string;
  customUnlockMessage?: string;
  color?: string;
  emoji?: string;
  tags?: string[];
  createdAt: number;
  lastModified: number;
}

const STORAGE_KEY = 'vault_customizations';

export const useVaultCustomization = () => {
  const [customizations, setCustomizations] = useState<VaultCustomization[]>([]);

  // Load customizations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomizations(parsed);
      } catch (error) {
        console.error('Error parsing vault customizations:', error);
        setCustomizations([]);
      }
    }
  }, []);

  // Save customizations to localStorage whenever they change
  const saveCustomizations = useCallback((newCustomizations: VaultCustomization[]) => {
    setCustomizations(newCustomizations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCustomizations));
  }, []);

  // Get customization for a specific vault
  const getVaultCustomization = useCallback((vaultAddress: string): VaultCustomization | null => {
    return customizations.find(c => c.address.toLowerCase() === vaultAddress.toLowerCase()) || null;
  }, [customizations]);

  // Update or create customization for a vault
  const updateVaultCustomization = useCallback((
    vaultAddress: string, 
    updates: Partial<Omit<VaultCustomization, 'address' | 'createdAt' | 'lastModified'>>
  ) => {
    const now = Date.now();
    const existing = customizations.find(c => c.address.toLowerCase() === vaultAddress.toLowerCase());
    
    if (existing) {
      // Update existing customization
      const updated = customizations.map(c => 
        c.address.toLowerCase() === vaultAddress.toLowerCase()
          ? { ...c, ...updates, lastModified: now }
          : c
      );
      saveCustomizations(updated);
    } else {
      // Create new customization
      const newCustomization: VaultCustomization = {
        address: vaultAddress,
        createdAt: now,
        lastModified: now,
        ...updates
      };
      saveCustomizations([...customizations, newCustomization]);
    }
  }, [customizations, saveCustomizations]);

  // Delete customization for a vault
  const deleteVaultCustomization = useCallback((vaultAddress: string) => {
    const filtered = customizations.filter(c => c.address.toLowerCase() !== vaultAddress.toLowerCase());
    saveCustomizations(filtered);
  }, [customizations, saveCustomizations]);

  // Get all customizations by category
  const getCustomizationsByCategory = useCallback((category: string) => {
    return customizations.filter(c => c.category === category);
  }, [customizations]);

  // Get all unique categories
  const getAllCategories = useCallback(() => {
    const categories = new Set(customizations.map(c => c.category).filter(Boolean));
    return Array.from(categories);
  }, [customizations]);

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const tags = new Set(customizations.flatMap(c => c.tags || []).filter(Boolean));
    return Array.from(tags);
  }, [customizations]);

  // Search customizations
  const searchCustomizations = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return customizations.filter(c => 
      c.name?.toLowerCase().includes(lowercaseQuery) ||
      c.description?.toLowerCase().includes(lowercaseQuery) ||
      c.category?.toLowerCase().includes(lowercaseQuery) ||
      c.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [customizations]);

  // Export customizations (for backup)
  const exportCustomizations = useCallback(() => {
    const dataStr = JSON.stringify(customizations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault_customizations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [customizations]);

  // Import customizations (from backup)
  const importCustomizations = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            // Merge with existing customizations, keeping newer ones
            const merged = [...customizations];
            imported.forEach((importedCustomization: VaultCustomization) => {
              const existingIndex = merged.findIndex(c => 
                c.address.toLowerCase() === importedCustomization.address.toLowerCase()
              );
              if (existingIndex >= 0) {
                // Keep the newer one
                if (importedCustomization.lastModified > merged[existingIndex].lastModified) {
                  merged[existingIndex] = importedCustomization;
                }
              } else {
                merged.push(importedCustomization);
              }
            });
            saveCustomizations(merged);
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }, [customizations, saveCustomizations]);

  return {
    customizations,
    getVaultCustomization,
    updateVaultCustomization,
    deleteVaultCustomization,
    getCustomizationsByCategory,
    getAllCategories,
    getAllTags,
    searchCustomizations,
    exportCustomizations,
    importCustomizations,
  };
};

export default useVaultCustomization; 