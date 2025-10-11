import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletProvider } from '../gateway/wallet-provider';
import { useAppSelector } from '../utils';
import { GlobalSelector } from '../redux/reducer/global/selector';

const DEFAULT_LOCK_TIMEOUT = 300; // 5 minutes in seconds
const DEFAULT_CHECK_INTERVAL = 30; // 30 seconds

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll'] as const; 

/**
 * Hook to automatically lock wallet after inactivity period.
 * Starts counting immediately, resets on user activity.
 * @param {number} lockTimeoutSeconds - Time in seconds to lock wallet when inactive. Default is 300 seconds (5 minutes).
 * @param {number} checkIntervalSeconds - Interval in seconds between checks. Default is 30 seconds.
 */
export function useAutoLock(
  lockTimeoutSeconds = DEFAULT_LOCK_TIMEOUT, 
  checkIntervalSeconds = DEFAULT_CHECK_INTERVAL
) {
  const navigate = useNavigate();
  const wallet = useWalletProvider();
  const isUnlocked = useAppSelector(GlobalSelector.isUnlocked);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef<number>(lockTimeoutSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const isTabVisibleRef = useRef<boolean>(true);
  const isLockingRef = useRef<boolean>(false);

  /**
   * Function to clean up countdown timer.
   */
  const clearTimers = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  /**
   * Function to lock wallet and redirect to login.
   */
  const lockWallet = useCallback(async () => {
    // Prevent multiple simultaneous lock operations
    if (isLockingRef.current) {
      return;
    }
    
    isLockingRef.current = true;
    try {
      await wallet.lockWallet();
    } catch (error) {
      console.error('❌ Error auto-locking wallet:', error);
    } finally {
      isLockingRef.current = false;
      navigate('/login');
    }
  }, [wallet, navigate]);

  /**
   * Function to start counting time immediately.
   */
  const startCountdown = useCallback(() => {
    clearTimers();

    if (isUnlocked) {
      timeLeftRef.current = lockTimeoutSeconds;
      lastActivityRef.current = Date.now();
      
      countdownRef.current = setInterval(async () => {
        const now = Date.now();
        const timeSinceLastActivity = (now - lastActivityRef.current) / 1000;
        
        // If tab is visible, use normal countdown
        if (isTabVisibleRef.current) {
          timeLeftRef.current -= checkIntervalSeconds;
        } else {
          // If tab is hidden, calculate based on actual time passed
          timeLeftRef.current -= timeSinceLastActivity;
          lastActivityRef.current = now;
        }
        
        if (timeLeftRef.current <= 0) {
          clearTimers();
          // Double-check unlock status before locking
          const stillUnlocked = await wallet.isUnlocked();
          if (stillUnlocked) {
            lockWallet();
          }
        }
      }, checkIntervalSeconds * 1000);
    }
  }, [isUnlocked, clearTimers, lockTimeoutSeconds, checkIntervalSeconds, lockWallet]);

  /**
   * Function called when user activity is detected.
   */
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    if (isUnlocked) {
      startCountdown();
    } else {
      clearTimers();
    }

    return () => {
      clearTimers();
    };
  }, [isUnlocked, startCountdown, clearTimers]);

  // Memoize event handler to avoid re-creation
  const handleActivity = useMemo(() => {
    return () => {
      updateActivity();
    };
  }, [updateActivity]);

  useEffect(() => {
    if (!isUnlocked) return;

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [handleActivity, isUnlocked]);

  // Handle tab visibility changes
  useEffect(() => {
    if (!isUnlocked) return;

    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        // Tab became visible, update last activity time
        lastActivityRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked]);

  return {
    updateActivity,
  };
}