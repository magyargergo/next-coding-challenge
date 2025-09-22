import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: React.ReactNode
  params: { locale: string }
}

const locales = ['en-US', 'en-GB']

async function getMessages(locale: string) {
  try {
    return (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: params.locale === 'en-US' ? 'Michael\'s Awesome Web Store' : 'Michael\'s Amazing Web Store',
    description: 'Next.js E-commerce with i18n support',
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(params.locale)) notFound()

  const messages = await getMessages(params.locale)

  return (
    <html lang={params.locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
