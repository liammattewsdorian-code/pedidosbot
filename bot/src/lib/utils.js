export function formatMoney(amount, currency = 'DOP', isEnglish = false, tenantExchangeRate = null) {
  const formatted = Number(amount).toLocaleString('es-DO', { style: 'currency', currency });
  if (isEnglish && currency === 'DOP') {
    // Usa la tasa pasada (del tenant) o el default de 60
    const currentRate = tenantExchangeRate ? Number(tenantExchangeRate) : 60; 
    const usdAmount = Number(amount) / currentRate;
    const usd = usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return `${formatted} (≈ ${usd})`;
  }
  return formatted;
}