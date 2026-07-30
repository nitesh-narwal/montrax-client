export const CURRENCY_SYMBOL = '₹';

export const EMOJI_OPTIONS = [
  // Money & Finance
  '💰', '💵', '💴', '💶', '💷', '💳', '🏦', '💼', '📈', '📉',
  // Shopping & Food
  '🛒', '🛍️', '🍔', '🍕', '☕', '🍽️', '🥗', '🍜', '🎂', '🍰',
  // Transport
  '🚗', '⛽', '🚌', '🚕', '✈️', '🚆', '🚲', '🛵', '🚇', '⛴️',
  // Home & Utilities
  '🏠', '💡', '🔌', '📺', '🛋️', '🧹', '🔧', '🪴', '🚿', '🛏️',
  // Entertainment
  '🎬', '🎮', '🎵', '🎤', '🎭', '🎪', '🎯', '📚', '🎨', '🎸',
  // Health & Fitness
  '💊', '🏥', '🏋️', '🧘', '🏃', '🚴', '🏊', '⚽', '🎾', '🥊',
  // Clothing & Beauty
  '👕', '👗', '👟', '👜', '💄', '💇', '👓', '⌚', '💍', '🎩',
  // Tech & Work
  '📱', '💻', '🖥️', '📷', '🎧', '📝', '📊', '📁', '✏️', '📌',
  // Gifts & Special
  '🎁', '🎈', '🎉', '💐', '🌹', '🎄', '🎃', '💝', '🧧', '🪄',
  // Other
  '📦', '🌐', '🔑', '🏆', '⭐', '❤️', '🔔', '📅', '🎓', '✨',
];

export const BANK_OPTIONS = [
  { value: 'SBI', label: 'State Bank of India' },
  { value: 'HDFC', label: 'HDFC Bank' },
  { value: 'ICICI', label: 'ICICI Bank' },
  { value: 'AXIS', label: 'Axis Bank' },
  { value: 'KOTAK', label: 'Kotak Mahindra Bank' },
  { value: 'GENERIC', label: 'Other (Generic CSV)' },
];

export const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
