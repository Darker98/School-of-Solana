import './timelock-components-style.css'
import { ellipsify, useWalletUi, useWalletUiSigner } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { ExplorerLink } from '@/components/cluster/cluster-ui'
import { useTimelockProgramId, processTransaction, getVaults } from './timelock-data-access'
import { AppModal } from '../app-modal'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { useState } from 'react'
import { getLockSolInstructionAsync, getWithdrawSolInstructionAsync, VaultPDA } from '@project/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { Address } from 'gill'
import { Plus, RefreshCw } from 'lucide-react'

export function TimelockProgramExplorerLink() {
  const programId = useTimelockProgramId()

  return <ExplorerLink address={programId.toString()} label={ellipsify(programId.toString())} />
}

function WithdrawSOL({ vaultAddress}: { vaultAddress: Address }) {
  const signer = useWalletUiSigner()
  const client = useWalletUi().client

  const withdrawSOL = async () => {
    const ix = await getWithdrawSolInstructionAsync({
      user: signer,
      vaultPda: vaultAddress,
    })

    await processTransaction(signer, client, [ix])
  }
  
  return (
    <Button 
      onClick={withdrawSOL}
      variant='outline'
      size='sm'
    >
      Withdraw
    </Button>
  )
} 

function VaultList() {
  const signer = useWalletUiSigner()
  const signerPubkey = new PublicKey(signer.address)
  const client = useWalletUi().client
  const programId = useTimelockProgramId()
  const [vaults, setVaults] = useState<Array<{address: Address, data: VaultPDA}>>([])

  const refresh = async () => {
    const vaults = await getVaults(client, programId, signerPubkey)
    setVaults(vaults)
  }

  return (
    <div className="vaults-section">
      <h3>Vaults</h3>
      <Button 
        onClick={refresh}
        variant='outline'
        size='sm'
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
      <div>
        {vaults
          .slice()
          .sort((a, b) => Number(a.data.lockedAmount) - Number(b.data.lockedAmount))
          .map((
          vault, index
        ) => {
          const unlockTime = Number(vault.data.unlockAt) * 1000;
          const now = Date.now();
          const remainingMs = unlockTime - now;

          let remainingText = "Unlocked";
          if (remainingMs > 0) {
            const seconds = Math.floor(remainingMs / 1000);
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);

            if (days > 0) {
              remainingText = `${days}d ${hours}h left`;
            } else if (hours > 0) {
              remainingText = `${hours}h ${minutes}m left`;
            } else {
              remainingText = `${minutes}m left`;
            }
          }

          return (
          <div key={index}>
            <div>
            <span>SOL Contained: {(Number(vault.data.lockedAmount) / 1_000_000_000).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</span><br />
            <span>Time to Unlock: {remainingText}</span><br />
            </div>
            <div>
              <WithdrawSOL vaultAddress={vault.address}/>
            </div>
          </div>
          )
        })}
      </div>
    </div>
    
  )
}

export function CreateVault () {
  const signer = useWalletUiSigner()
  const client = useWalletUi().client

  const [formData, setFormData] = useState({
    SOL: '',
    unlockTime: ''
  }) 

  function randomU64(): bigint {
    // Generate two 32-bit parts
    const high = BigInt(Math.floor(Math.random() * 0x100000000)); // upper 32 bits
    const low = BigInt(Math.floor(Math.random() * 0x100000000));  // lower 32 bits

    return (high << 32n) | low; // combine into a u64
  }

  const handleSubmit = async () => {
    const seed = randomU64()
    const unlockTimeSeconds = Math.round(new Date(formData.unlockTime).getTime() / 1000)

    console.log("Seed: ", seed)
    console.log("Lock SOL: ", Number(formData.SOL) * 1_000_000_000)
    console.log("Unlock time: ", Number(unlockTimeSeconds))

    const ix = await getLockSolInstructionAsync(
      {
        user: signer,
        seed,
        lockedAmount: BigInt(Number(formData.SOL) * 1_000_000_000),
        unlockAt: BigInt(unlockTimeSeconds)
      }
    )

    await processTransaction(signer, client, [ix])

    setFormData({
      SOL: "",
      unlockTime: ""
    })
  }

  return (
    <AppModal 
      title="Create a new vault"
      submit={handleSubmit}
    >
      <div className="create-vault-modal">
        <div>
          <Label htmlFor="SOL">SOL amount to Lock</Label>
          <Input 
            id='SOL'
            type='number'
            min='1'
            value={formData.SOL} 
            onChange={(e) => setFormData(prev => ({...prev, SOL: e.target.value}))}
          />
        </div>
        <div>
          <Label htmlFor="unlockTime">Time to Unlock</Label>
          <Input 
            id='unlockTime'
            type='datetime-local'
            value={formData.unlockTime} 
            onChange={(e) => setFormData(prev => ({...prev, unlockTime: e.target.value}))}
          />
        </div>
      </div>

    </AppModal>
  )
}

export function TimelockProgram() {
  return (
    <div className="timelock">
      <div>
        <CreateVault />
      </div>
      
      <br />

      <VaultList />      

    </div>
  )
}
