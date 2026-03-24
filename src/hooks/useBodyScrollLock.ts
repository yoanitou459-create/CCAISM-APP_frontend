import { useEffect } from 'react';

let lockCount = 0;

export const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      lockCount++;
      document.body.style.overflow = 'hidden';
      return () => {
        lockCount--;
        if (lockCount === 0) {
          document.body.style.overflow = 'unset';
        }
      };
    }
  }, [isOpen]);
};
