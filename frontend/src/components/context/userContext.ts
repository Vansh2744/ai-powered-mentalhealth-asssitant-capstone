import { createContext, useContext } from "react";
import { type CurrentUser } from "@/types";

export const UserContext = createContext({
  user: {} as CurrentUser | null,
  fetchCurrentUser: () => {},
  clearUser: () => {}
});

export const useCurrentUser = () => {
  return useContext(UserContext);
};

