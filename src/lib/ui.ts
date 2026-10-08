import { create } from "zustand";

export const useUi = create<{ libraryOpen: boolean }>(() => ({ libraryOpen: false }));
export const setLibraryOpen = (libraryOpen: boolean) => useUi.setState({ libraryOpen });
