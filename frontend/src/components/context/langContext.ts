import { useContext, createContext } from "react";

type LanguageContextType = {
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
};

export const langContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const selectedlanguage = (): LanguageContextType => {
  const context = useContext(langContext);
  if (!context) {
    throw new Error("selectedlanguage must be used within a LanguageProvider");
  }
  return context;
};
