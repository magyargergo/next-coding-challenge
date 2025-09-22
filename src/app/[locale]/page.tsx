import { api } from '@/lib/api-client'
import HomeClient from './HomeClient'

type Props = {
  params: { locale: string }
}

export default async function LocalizedHome({ params }: Props) {
  const locale = params.locale === 'en-US' ? 'us' : 'uk'
  const currency = params.locale === 'en-US' ? 'USD' : 'GBP'
  
  const products = await api.getProducts(locale)
  
  return <HomeClient initialProducts={products} currency={currency} locale={params.locale} />
}
