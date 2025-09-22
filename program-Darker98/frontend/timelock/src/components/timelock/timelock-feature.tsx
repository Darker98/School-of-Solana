import { WalletButton } from '../solana/solana-provider'
import { TimelockProgram, TimelockProgramExplorerLink } from './timelock-ui'
import { AppHero } from '../app-hero'
import { useWalletUi } from '@wallet-ui/react'
import Link from 'next/link'
import { Button } from '../ui/button'

export default function TimelockFeature() {
  const { account } = useWalletUi()

  if (!account) {
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

  return (
    <div className="page">
      <AppHero title="Timelock" subtitle={'Lock your SOL for safe-keeping'}>
      </AppHero>
      <TimelockProgram />
    </div>
  )
}
