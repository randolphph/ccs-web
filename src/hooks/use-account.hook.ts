import React, { useReducer } from 'react'
import { defaultReducer } from '../reducer/defaultReducer'
import { query, mutate, tx, currentUser } from '@onflow/fcl'
import { SessionUser } from './use-current-user.hook'
import { IS_ACCOUNT_INITIALIZED } from '../flow/is_account_initialized.script'
import { INITIALIZED_ACCOUNT } from '../flow/initialized-account.tx'
import { useLocalStorageState } from 'ahooks'
import { useTx } from '../providers/TxProvider'
import { ActionType } from '../reducer/txReducer'
import { formatError } from '../utils'

export default function useAccount(user: SessionUser) {
  const [state, dispatch] = useReducer(defaultReducer, {
    loading: true,
    error: false,
    data: null
  })

  const { state: txState, dispatch: txDispatch } = useTx()

  const [accountInitStatus, setAccountInitStatus] = useLocalStorageState<{
    [address: string]: boolean
  }>('accountInitStatus')

  const isAccountInitialized = async () => {
    if (
      user !== undefined &&
      accountInitStatus != undefined &&
      user!.addr !== undefined &&
      accountInitStatus![user!.addr!] === true
    ) {
      console.log(user!.addr, 'already initiate')
      dispatch({ type: 'SUCCESS', payload: true })
      return
    }

    dispatch({ type: 'PROCESSING' })

    try {
      const response = await query({
        cadence: IS_ACCOUNT_INITIALIZED,
        args: (arg: any, t: any) => [arg(user?.addr, t.Address)]
      })
      dispatch({ type: 'SUCCESS', payload: response })
      return response as boolean
    } catch (err) {
      dispatch({ type: 'ERROR' })
    }
  }

  const initializeAccount = async () => {
    txDispatch({ type: ActionType.AddProccesing })

    try {
      const transaction = await mutate({
        cadence: INITIALIZED_ACCOUNT,
        limit: 100
      })
      await tx(transaction).onceSealed()
      const newStorageUsers = { ...accountInitStatus, [user!.addr!]: true }
      setAccountInitStatus(newStorageUsers)
      txDispatch({
        type: ActionType.AddSuccess,
        payload: { txID: transaction }
      })
      await isAccountInitialized()
    } catch (err) {
      txDispatch({
        type: ActionType.AddError,
        payload: {
          error: err as string
        }
      })
    }
  }

  return {
    ...state,
    isAccountInitialized,
    initializeAccount
  }
}
