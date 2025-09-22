// Here we export some useful types and functions for interacting with the Anchor program.
import { address } from 'gill'
import { SolanaClusterId } from '@wallet-ui/react'
import { TIMELOCK_PROGRAM_ADDRESS } from './client/js'
import TimelockIDL from '../target/idl/timelock.json'

// Re-export the generated IDL and type
export { TimelockIDL }

// This is a helper function to get the program ID for the Timelock program depending on the cluster.
export function getTimelockProgramId(cluster: SolanaClusterId) {
  switch (cluster) {
    case 'solana:devnet':
    case 'solana:testnet':
      // This is the program ID for the Timelock program on devnet and testnet.
      return address('81eTCSx3zoUi8Q2ewTPJgfiJk32AR1mXnSTj6BJ5aKa')
    case 'solana:mainnet':
    default:
      return TIMELOCK_PROGRAM_ADDRESS
  }
}

export * from './client/js'
