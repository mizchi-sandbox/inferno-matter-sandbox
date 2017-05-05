/* @flow */
import { delay } from 'redux-saga'
import { sync } from '../actions/battleSagaActions'
import * as battleActions from '../actions/battleActions'
import type { BattleState } from 'domain/battle'
import { processTurn, createBattleMock, isFinished } from 'domain/battle'
import { take, takeEvery, put, call, race } from 'redux-saga/effects'
import * as ResultActions from 'domain/battle/Result'
import type { Input } from 'domain/battle/Input'

let _inputQueue: Input[] = []

function hydrateInputQueue() {
  const iq = _inputQueue
  _inputQueue = []
  return iq
}

function* addInputToQueue(action: any) {
  _inputQueue = _inputQueue.concat([{ ...action.payload, id: Symbol('input') }])
  yield put(battleActions.updateInputQueue(_inputQueue))
}

function* start(_action: any) {
  let state: BattleState = createBattleMock()
  yield put(sync(state))
  while (true) {
    // Wait or Pause
    const { paused, waited } = yield race({
      waited: call(delay, 300),
      paused: take(battleActions.REQUEST_PAUSE)
    })

    // if user request pausing, wait for restart
    if (paused) {
      yield put(battleActions.paused())
      yield take(battleActions.REQUEST_RESTART)
      yield put(battleActions.restarted())
    }

    if (waited) {
      const inputQueue = hydrateInputQueue()
      yield put(battleActions.updateInputQueue([]))
      const processed = processTurn(state, inputQueue)
      state = processed.state
      for (const result of processed.results) {
        switch (result.type) {
          case ResultActions.LOG:
            yield put(battleActions.log(result.message))
            break
        }
      }

      yield put(sync(state))

      // Check finish flag
      const finshed = isFinished(state)
      if (finshed) {
        yield put(battleActions.log(`${finshed.winner} win.`))
        break
      }
    }
  }
}

export default function* battleSaga(): any {
  yield takeEvery(battleActions.REQUEST_START, start)
  yield takeEvery(battleActions.ADD_INPUT_TO_QUEUE, addInputToQueue)
}
