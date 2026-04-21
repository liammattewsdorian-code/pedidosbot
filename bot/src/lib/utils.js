export function formatMoney(amount, currency = 'DOP', isEnglish = false) {
  const formatted = Number(amount).toLocaleString('es-DO', { style: 'currency', currency });
  if (isEnglish && currency === 'DOP') {
    // Tasa de cambio (esto podrías luego leerlo de tenant.exchangeRate)
    // Sugerencia: Si el tenant tiene una tasa en la DB, usarla. Si no, default 60.
    const currentRate = 60; 
    const usdAmount = Number(amount) / currentRate;
    const usd = usdAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    return `${formatted} (≈ ${usd})`;
  }
  return formatted;
}