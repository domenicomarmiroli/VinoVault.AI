
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AnalysisStyle = 'pop' | 'sommelier';

interface AnalysisStyleContextType {
  analysisStyle: AnalysisStyle;
  setAnalysisStyle: (style: AnalysisStyle) => void;
}

const AnalysisStyleContext = createContext<AnalysisStyleContextType | undefined>(undefined);

export const AnalysisStyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getSavedStyle = (): AnalysisStyle => {
    const saved = localStorage.getItem('vinovault_analysis_style');
    return saved === 'sommelier' ? 'sommelier' : 'pop';
  };

  const [analysisStyle, setAnalysisStyleState] = useState<AnalysisStyle>(getSavedStyle());

  const setAnalysisStyle = (style: AnalysisStyle) => {
    setAnalysisStyleState(style);
    localStorage.setItem('vinovault_analysis_style', style);
  };

  return (
    <AnalysisStyleContext.Provider value={{ analysisStyle, setAnalysisStyle }}>
      {children}
    </AnalysisStyleContext.Provider>
  );
};

export const useAnalysisStyle = () => {
  const context = useContext(AnalysisStyleContext);
  if (!context) {
    throw new Error('useAnalysisStyle must be used within an AnalysisStyleProvider');
  }
  return context;
};
