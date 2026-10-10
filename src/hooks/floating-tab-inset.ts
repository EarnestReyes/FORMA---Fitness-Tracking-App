import { createContext, useContext } from 'react';

export const FLOATING_TAB_HEIGHT = 72;
export const FLOATING_TAB_GAP = 12;
export const FloatingTabInsetContext = createContext(0);
export const useFloatingTabInset = () => useContext(FloatingTabInsetContext);
export const floatingTabBottom = (bottomInset: number) => Math.max(0, bottomInset) + FLOATING_TAB_GAP;
