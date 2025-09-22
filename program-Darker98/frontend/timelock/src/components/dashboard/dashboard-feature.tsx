import { AppHero } from '@/components/app-hero'
import Link from 'next/link';
import { Button } from '../ui/button';

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Solana Faucet', href: 'https://faucet.solana.com/' },
  { label: 'Solana Cookbook', href: 'https://solana.com/developers/cookbook/' },
  { label: 'Solana Stack Overflow', href: 'https://solana.stackexchange.com/' },
  { label: 'Solana Developers GitHub', href: 'https://github.com/solana-developers/' },
]

export function DashboardFeature() {
  return (
    <div>
      <AppHero title="gm" subtitle="Welcome to Timelock." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">

        {/* Centered button */}
        <div className="-mt-10">
          <Link href="/timelock">
            <Button
              variant='outline'
              size='lg'
            >
              Head to dashboard
            </Button>
          </Link>
        </div>
      </div>
</div>
  )
}
