import { getTimelockProgramId, getVaultPDADecoder, VAULT_P_D_A_DISCRIMINATOR } from '@project/anchor'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useWalletUi } from '@wallet-ui/react'
import { toastTx } from '@/components/toast-tx'
import { useWalletTransactionSignAndSend } from '@/components/solana/use-wallet-transaction-sign-and-send'
import { useWalletUiSigner } from '@/components/solana/use-wallet-ui-signer'
import { Address, createSolanaClient, createTransaction, Instruction, signAndSendTransactionMessageWithSigners, SolanaClient, TransactionSigner } from 'gill'
import { BN } from 'bn.js'
import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  PublicKey
} from "@solana/web3.js";

export function useTimelockProgramId() {
  const { cluster } = useWalletUi()

  return useMemo(() => getTimelockProgramId(cluster.id), [cluster])
}

export async function processTransaction(
  signer: TransactionSigner,
  client: SolanaClient,
  instructions: Instruction[]
) {
    try {
    const { value: latestBlockhash } = await client.rpc.getLatestBlockhash().send()
    const transaction = createTransaction({
      latestBlockhash,
      feePayer: signer,
      version: 'legacy',
      instructions: instructions,
    })
    console.log('Instructions:', instructions)
    const signature = await signAndSendTransactionMessageWithSigners(transaction)
    console.log(signature)
  } catch (error) {
    console.error('Transaction error:', error)
    const errorMessage = (error instanceof Error) ? error.message : String(error)
    toast.error(`Transaction failed: ${errorMessage}`)
    throw error
  }
}

export async function getVaults(
  client: SolanaClient,
  programId: Address,
  user: PublicKey
) {
  const allAccounts = await client.rpc.getProgramAccounts(programId, {
    encoding: "base64",
  }).send()

  const decoder = getVaultPDADecoder()
  const filteredAccounts = allAccounts.filter((account) => {
    const data = Buffer.from(account.account.data[0], "base64")
    const discriminator = data.subarray(0, 8)

    if (!discriminator.equals(Buffer.from(VAULT_P_D_A_DISCRIMINATOR))) {
      return false
    }

    // decode VaultPDA to extract the stored seed, etc.
    const vaultData = decoder.decode(data)

    // rederive PDA using seed + user key
    const [expectedPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pda"),
        new BN(vaultData.seed).toArrayLike(Buffer, "le", 8),
        user.toBuffer(),
      ],
      new PublicKey(programId)
    )

    return expectedPda.equals(new PublicKey(account.pubkey))
  })

  return filteredAccounts.map((account) => ({
    address: account.pubkey,
    data: decoder.decode(Buffer.from(account.account.data[0], "base64")),
  }))
}