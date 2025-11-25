/**
 * Utility Functions
 * Helper functions used across the application
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Calculate project estimate based on requirements
 */
export function calculateEstimate(
  numPages: number,
  features: string[],
  designComplexity: string
): { devinOutCost: number; agencyCost: number } {
  const hasPayment = features.some(f => 
    f.toLowerCase().includes('payment') || f.toLowerCase().includes('checkout')
  );
  const hasAuth = features.some(f => 
    f.toLowerCase().includes('login') || f.toLowerCase().includes('auth')
  );
  const hasAdmin = features.some(f => 
    f.toLowerCase().includes('admin') || f.toLowerCase().includes('dashboard')
  );
  
  let baseEstimate = 35000 + (numPages * 1500);
  baseEstimate *= hasPayment ? 1.3 : 1;
  baseEstimate *= hasAuth ? 1.2 : 1;
  baseEstimate *= hasAdmin ? 1.25 : 1;
  
  if (designComplexity === 'advanced') {
    baseEstimate *= 1.4;
  } else if (designComplexity === 'moderate') {
    baseEstimate *= 1.2;
  }
  
  const devinOutCost = Math.round(baseEstimate);
  const agencyCost = Math.round(devinOutCost * 1.6);
  
  return { devinOutCost, agencyCost };
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

