import { create } from "zustand";

export const useUi = create<{ libraryOpen: boolean; libraryCategory: string }>(() => ({
  libraryOpen: false,
  libraryCategory: "classical",
}));
export const setLibraryOpen = (libraryOpen: boolean) => useUi.setState({ libraryOpen });
export const setLibraryCategory = (libraryCategory: string) => useUi.setState({ libraryCategory });
