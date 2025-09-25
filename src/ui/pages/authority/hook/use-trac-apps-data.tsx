import { useState, useEffect } from 'react';

// Define the type for TracApps
export type TracApps = {
  hyperfunAddress: string;
  hypermallAddress: string;
  allowed: boolean;
};

// Use a unique key for your chrome.storage data
const TRAC_APPS_STORAGE_KEY = 'ENABLE_TRAC_APPS';

export const useTracAppsData = () => {
  const [tracApps, setTracApps] = useState<TracApps>({
    hyperfunAddress: '',
    hypermallAddress: '',
    allowed: false,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await new Promise(resolve => {
          // Corrected line: create an arrow function to handle the result
          chrome.storage.local.get([TRAC_APPS_STORAGE_KEY], (items) => {
            resolve(items);
          });
        });

        const storedData = (result as { [key: string]: TracApps })[TRAC_APPS_STORAGE_KEY];

        if (storedData) {
          setTracApps(storedData);
        }
      } catch (error) {
        console.error('Failed to load Trac Apps data:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          await new Promise(resolve => {
            chrome.storage.local.set({ [TRAC_APPS_STORAGE_KEY]: tracApps }, () => {
              resolve(null);
            });
          });
        } catch (error) {
          console.error('Failed to save Trac Apps data:', error);
        }
      };
      saveData();
    }
  }, [tracApps, isLoaded]);

  return { tracApps, setTracApps };
};