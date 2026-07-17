import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Rend les modales dans document.body pour passer au-dessus de la navbar / overflow parents. */
export function ModalPortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
