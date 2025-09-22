import { ReactNode } from 'react'
import { useWalletUi } from '@wallet-ui/react'
import { WalletButton } from '@/components/solana/solana-provider'
import { AppHero } from '../app-hero'

export default function AccountFeatureIndex({ redirect }: { redirect: (path: string) => ReactNode }) {
  const { account } = useWalletUi()

  if (account) {
    return redirect(`/account/${account.address.toString()}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AppHero title="Connect your wallet" />
        <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8">
    
          {/* Centered button */}
          <div className="flex justify-center -mt-10">
            <WalletButton />
          </div>
        </div>
    </div>
  )
}
