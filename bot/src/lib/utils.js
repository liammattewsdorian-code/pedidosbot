/**
 * Formatea dinero y opcionalmente muestra la conversión a USD para turistas.
 */
export function formatMoney(amount, currency = 'DOP', isEnglish = false, exchangeRate = 60) {
  const dopAmount = Number(amount);
  const dopFormatted = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
  }).format(dopAmount);

  if (isEnglish && currency === 'DOP') {
    const usdAmount = dopAmount / Number(exchangeRate);
    const usdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdAmount);
    return `${dopFormatted} (approx. ${usdFormatted})`;
  }

  return dopFormatted;
}