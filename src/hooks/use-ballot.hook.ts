import React, { useReducer } from 'react'
import { query, mutate, tx } from '@onflow/fcl'
import { defaultReducer } from '../reducer/defaultReducer'
import { SessionUser } from './use-current-user.hook'
import { GET_HODINGS } from '../flow/get-holdings.script'
import { BUY_BALLOTS } from '../flow/buy-ballots.tx'
import { useTx } from '../providers/TxProvider'
import { ActionType } from '../reducer/txReducer'

export default function useBallot(user: SessionUser | undefined) {
  const [state, dispatch] = useReducer(defaultReducer, {
    loading: true,
    error: false,
    data: null
  })

  const { state: txState, dispatch: txDispatch } = useTx()

  // useEffect(() => {
  //   if (txState.txStatusType === 'PROCESSING')
  //     console.log('txState useBallot loading')
  //   if (txState.txStatusType === 'ERROR')
  //     console.log('txState useBallot error', txState.errorMessage)
  //   if (txState.txStatusType === 'SUCCESS')
  //     console.log('txState useBallot success', txState.id)
  //   if (txState.txStatusType === 'NONE') console.log('txState useBallot reset')
  // }, [txState.isLoading, txState.isError])

  const getHodings = async () => {
    dispatch({ type: 'PROCESSING' })

    try {
      const response = await query({
        cadence: GET_HODINGS,
        args: (arg: any, t: any) => [arg(user?.addr, t.Address)]
      })
      dispatch({ type: 'SUCCESS', payload: response })
    } catch (err) {
      dispatch({ type: 'ERROR' })
    }
  }

  const buyBallots = async (count: number) => {
    txDispatch({ type: ActionType.AddProccesing })
    try {
      const transaction = await mutate({
        cadence: BUY_BALLOTS,
        limit: 9999,
        args: (arg: any, t: any) => [arg(count, t.Int)]
      })
      await tx(transaction).onceSealed()
      txDispatch({
        type: ActionType.AddSuccess,
        payload: { txID: transaction }
      })
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
    getHodings,
    buyBallots
  }
}
