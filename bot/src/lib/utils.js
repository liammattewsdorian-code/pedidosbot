export function formatMoney(amount, currency = 'DOP', isEnglish = false) {
  const formatted = Number(amount).toLocaleString('es-DO', { style: 'currency', currency });
  if (isEnglish && currency === 'DOP') {
    // Tasa de cambio (esto podrías luego leerlo de tenant.exchangeRate)
    const rate = 60; 
    const usdAmount = Number(amount) / rate;
    const usd = usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return `${formatted} (≈ ${usd})`;
  }
  return formatted;
}