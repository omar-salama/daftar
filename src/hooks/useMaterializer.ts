import { useEffect, useRef } from 'react';
import { useRecurrenceRules, useAppendRecurrenceRule, createRecurrenceRule } from '@/features/recurrence/hooks';
import { useAppendTx, createTxVersion } from '@/features/ledger/hooks/useLedger';
import { pendingMaterializationDates, materializationTxId, divideInstallments } from '@/kernel';
import { getTodayString } from '@/kernel/date';

export function useMaterializer() {
  const { data: rules } = useRecurrenceRules();
  const appendTxMutation = useAppendTx();
  const appendRuleMutation = useAppendRecurrenceRule();
  
  const materializedSet = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!rules) return;
    
    const today = getTodayString();
    
    for (const rule of rules) {
      if (!rule.isActive) continue;
      
      const pendingDates = pendingMaterializationDates(rule, today);
      if (pendingDates.length === 0) continue;
      
      let newMaterializedCount = rule.materializedCount;
      let lastMaterializedDate = rule.lastMaterializedDate;
      
      let installmentAmounts: number[] = [];
      if (rule.mode === 'installment' && rule.originalTotalMinor && rule.totalInstallments) {
        installmentAmounts = divideInstallments(rule.originalTotalMinor, rule.totalInstallments);
      }
      
      for (const date of pendingDates) {
        const txId = materializationTxId(rule.recurrenceId, date);
        
        if (materializedSet.current.has(txId)) {
          continue;
        }
        
        materializedSet.current.add(txId);
        
        let installmentNumber: number | undefined = undefined;
        const lines = [...rule.lines];
        
        if (rule.mode === 'installment' && rule.totalInstallments) {
          installmentNumber = newMaterializedCount + 1;
          const currentInstallmentAmount = installmentAmounts[installmentNumber - 1];
          if (lines.length > 0) {
            lines[0] = { ...lines[0], amountMinor: currentInstallmentAmount };
          }
        }
        
        const tx = createTxVersion({
          txId,
          type: rule.type,
          accountId: rule.accountId,
          transferAccountId: rule.transferAccountId,
          occurredAt: date,
          payee: rule.payee,
          note: rule.note,
          exchangeRate: rule.exchangeRate,
          lines,
          recurrenceId: rule.recurrenceId,
          installmentNumber,
          totalInstallments: rule.totalInstallments,
        });
        
        appendTxMutation.mutate(tx);
        
        newMaterializedCount++;
        lastMaterializedDate = date;
      }
      
      const shouldDeactivate = rule.mode === 'installment' && rule.totalInstallments && newMaterializedCount >= rule.totalInstallments;
      
      if (newMaterializedCount > rule.materializedCount) {
        const updatedRule = createRecurrenceRule({
          recurrenceId: rule.recurrenceId,
          mode: rule.mode,
          type: rule.type,
          accountId: rule.accountId,
          transferAccountId: rule.transferAccountId,
          lines: rule.lines, // Keep original lines in the rule
          payee: rule.payee,
          note: rule.note,
          exchangeRate: rule.exchangeRate,
          dayOfMonth: rule.dayOfMonth,
          startDate: rule.startDate,
          totalInstallments: rule.totalInstallments,
          originalTotalMinor: rule.originalTotalMinor,
          lastMaterializedDate,
          materializedCount: newMaterializedCount,
          isActive: !shouldDeactivate,
        });
        
        appendRuleMutation.mutate(updatedRule);
      }
    }
  }, [rules, appendTxMutation, appendRuleMutation]);
}
