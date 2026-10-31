import { describe, it, expect } from 'vitest';
import { requiresPriceApproval, requiresDiscountApproval, APPROVAL_RULES } from '../config/approvalRules';

describe('SPI Approval Rules Business Logic', () => {
  it('correctly approves or flags price changes based on percentage threshold (>10%)', () => {
    const basePrice = 10000000; // 10 juta

    // 5% change -> no approval needed
    expect(requiresPriceApproval(basePrice, 10500000)).toBe(false);

    // 12% change -> requires SPI approval
    expect(requiresPriceApproval(basePrice, 11200000)).toBe(true);
  });

  it('flags nominal price changes exceeding threshold (>Rp 2.000.000)', () => {
    const basePrice = 50000000; // 50 juta

    // Rp 1.500.000 change (3% < 10% and 1.5jt < 2jt) -> no approval
    expect(requiresPriceApproval(basePrice, 51500000)).toBe(false);

    // Rp 2.500.000 change (5% < 10% BUT 2.5jt > 2jt nominal threshold) -> requires SPI approval
    expect(requiresPriceApproval(basePrice, 52500000)).toBe(true);
  });

  it('flags discount changes exceeding threshold (>15%)', () => {
    expect(requiresDiscountApproval(10)).toBe(false);
    expect(requiresDiscountApproval(15)).toBe(false);
    expect(requiresDiscountApproval(16)).toBe(true);
    expect(requiresDiscountApproval(25)).toBe(true);
  });

  it('maintains strict rule constants', () => {
    expect(APPROVAL_RULES.PRICE_CHANGE_PERCENT_THRESHOLD).toBe(10);
    expect(APPROVAL_RULES.PRICE_CHANGE_NOMINAL_THRESHOLD).toBe(2000000);
    expect(APPROVAL_RULES.DISCOUNT_PERCENT_THRESHOLD).toBe(15);
  });
});

