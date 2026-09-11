import { TxLine, TxVersion } from '@/kernel';
import { Minor, minorFromDigits, appendDigit, digitsFromMinor } from '@/kernel/money';
import { useState, useMemo, useEffect } from 'react';

export type EditorLine = {
  id: string; // unique internal id
  categoryId: string;
  digits: string;
  isPristine: boolean;
};

export interface UseSplitEditorProps {
  totalMinor: Minor;
  initialCategoryIds?: string[];
  editingTx?: TxVersion;
  onSave: (lines: TxLine[]) => void;
}

export function applyPristineDistribution(lines: EditorLine[], totalMinor: Minor): EditorLine[] {
  const pristineLines = lines.filter(l => l.isPristine);
  const nonPristineLines = lines.filter(l => !l.isPristine);

  if (pristineLines.length === 0) return lines;

  const allocatedNonPristine = nonPristineLines.reduce(
    (sum, line) => sum + (minorFromDigits(line.digits) || 0),
    0
  );

  let remainder = totalMinor - allocatedNonPristine;
  if (remainder < 0) remainder = 0; // Don't assign negative values to pristine lines

  const baseShare = Math.floor(remainder / pristineLines.length);
  let leftOver = remainder - (baseShare * pristineLines.length);

  return lines.map(line => {
    if (!line.isPristine) return line;
    
    let share = baseShare;
    if (leftOver > 0) {
      share += 1;
      leftOver -= 1;
    }

    const digits = digitsFromMinor(share as Minor);
    
    return { ...line, digits };
  });
}

export function useSplitEditor({ totalMinor, initialCategoryIds, editingTx, onSave }: UseSplitEditorProps) {
  const [lines, setLines] = useState<EditorLine[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [justFocusedLineId, setJustFocusedLineId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize lines
  useEffect(() => {
    if (isInitialized) return;

    if (editingTx && editingTx.lines.length > 1) {
      const initialLines = editingTx.lines.map((l, i) => {
        return {
          id: `line-${i}`,
          categoryId: l.categoryId,
          digits: digitsFromMinor(l.amountMinor),
          isPristine: false,
        };
      });
      setLines(initialLines);
      if (initialLines.length > 0) {
        setActiveLineId(initialLines[0].id);
        setJustFocusedLineId(initialLines[0].id);
      }
      setIsInitialized(true);
    } else if (initialCategoryIds && initialCategoryIds.length > 0) {
      const initialLines = initialCategoryIds.map((catId, i) => ({
        id: `line-${i}`,
        categoryId: catId,
        digits: '0',
        isPristine: true,
      }));
      setLines(applyPristineDistribution(initialLines, totalMinor));
      if (initialLines.length > 0) {
        setActiveLineId(initialLines[0].id);
        setJustFocusedLineId(initialLines[0].id);
      }
      setIsInitialized(true);
    } else {
      setIsAddingCategory(true);
      setIsInitialized(true);
    }
  }, [editingTx, initialCategoryIds, isInitialized, totalMinor]);

  const allocatedMinor = useMemo(() => {
    return lines.reduce((sum, line) => sum + (minorFromDigits(line.digits) || 0), 0) as Minor;
  }, [lines]);

  const remainingMinor = (totalMinor - allocatedMinor) as Minor;
  const canSave = remainingMinor === 0 && lines.length > 0;

  const handleFocusLine = (id: string) => {
    setActiveLineId(id);
    setJustFocusedLineId(id);
  };

  const handleDigit = (d: string) => {
    if (!activeLineId) return;
    setLines(prev => {
      const nextLines = prev.map(line => {
        if (line.id !== activeLineId) return line;
        
        const isFreshFocus = justFocusedLineId === line.id;
        const shouldOverwrite = isFreshFocus || line.isPristine;
        
        const newDigits = shouldOverwrite 
          ? appendDigit('', d)
          : appendDigit(line.digits, d);
          
        return { ...line, digits: newDigits, isPristine: false };
      });
      return applyPristineDistribution(nextLines, totalMinor);
    });
    
    if (justFocusedLineId === activeLineId) {
      setJustFocusedLineId(null);
    }
  };

  const handleBackspace = () => {
    if (!activeLineId) return;
    setLines(prev => {
      const nextLines = prev.map(line => {
        if (line.id !== activeLineId) return line;
        
        const isFreshFocus = justFocusedLineId === line.id;
        
        if (line.isPristine || isFreshFocus) {
          return { ...line, digits: '', isPristine: false };
        }
        return { ...line, digits: line.digits.slice(0, -1), isPristine: false };
      });
      return applyPristineDistribution(nextLines, totalMinor);
    });
    
    if (justFocusedLineId === activeLineId) {
      setJustFocusedLineId(null);
    }
  };

  const handleAddCategory = (categoryId: string) => {
    const newId = `line-${Date.now()}`;
    setLines(prev => {
      const nextLines = [
        ...prev,
        { id: newId, categoryId, digits: '0', isPristine: true }
      ];
      return applyPristineDistribution(nextLines, totalMinor);
    });
    setActiveLineId(newId);
    setJustFocusedLineId(newId);
    setIsAddingCategory(false);
  };

  const handleRemoveLine = (id: string) => {
    setLines(prev => {
      const next = prev.filter(l => l.id !== id);
      if (activeLineId === id && next.length > 0) {
        setActiveLineId(next[0].id);
        setJustFocusedLineId(next[0].id);
      } else if (next.length === 0) {
        setActiveLineId(null);
        setJustFocusedLineId(null);
      }
      return applyPristineDistribution(next, totalMinor);
    });
  };

  const handleSave = () => {
    if (remainingMinor !== 0) return;
    const txLines: TxLine[] = lines
      .map(l => ({
        categoryId: l.categoryId,
        amountMinor: minorFromDigits(l.digits) as Minor,
      }))
      .filter(l => l.amountMinor > 0);
      
    if (txLines.length > 0) {
      onSave(txLines);
    }
  };

  return {
    lines,
    activeLineId,
    isAddingCategory,
    remainingMinor,
    canSave,
    setIsAddingCategory,
    handleFocusLine,
    handleDigit,
    handleBackspace,
    handleAddCategory,
    handleRemoveLine,
    handleSave
  };
}
