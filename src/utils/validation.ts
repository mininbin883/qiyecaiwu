export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateRequired(value: string, label: string): ValidationResult {
  if (!value.trim()) return { valid: false, message: `请填写${label}` };
  return { valid: true };
}

export function validateMoney(value: number, label: string): ValidationResult {
  if (!Number.isFinite(value) || value < 0) {
    return { valid: false, message: `${label}不能为负数` };
  }
  return { valid: true };
}

export function validateNotGreater(part: number, total: number, partLabel: string, totalLabel: string): ValidationResult {
  if (part > total) {
    return { valid: false, message: `${partLabel}不能大于${totalLabel}` };
  }
  return { valid: true };
}

