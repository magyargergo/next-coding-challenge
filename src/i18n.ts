export type AppLocale = 'en-GB' | 'en-US';

export async function getMessages(locale: AppLocale) {
  if (locale === 'en-US') {
    return (await import('./messages/en-US.json')).default;
  }
  return (await import('./messages/en-GB.json')).default;
}


