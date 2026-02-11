import React, { useState } from "react";
import { langContext } from "./langContext";

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState("en-US");
  return (
    <langContext.Provider value={{ language, setLanguage }}>
      {children}
    </langContext.Provider>
  );
};

export default LanguageProvider;
