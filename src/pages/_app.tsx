import React from 'react'
import Chatbot from '@/src/components/chatbot';
import ScraperForm from '@/src/components/scrapForm';
import type { AppProps } from 'next/app';
import '../src/app/global.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}