import { create } from "zustand";
import { getSession, patchSession } from "./session";

export const useUi = create<{ libraryOpen: boolean; libraryCategory: string }>(() => ({
  libraryOpen: false,
  libraryCategory: getSession().libraryCategory,
}));
export const setLibraryOpen = (libraryOpen: boolean) => useUi.setState({ libraryOpen });
export const setLibraryCategory = (libraryCategory: string) => {
  useUi.setState({ libraryCategory });
  patchSession({ libraryCategory });
};
