/* @flow */
import React from 'react'
import BattleContainer from '../containers/BattleContainer'
import type { AppContainerProps } from '../containers/AppContainer'
import Layout from './Layout'

export default function App(props: AppContainerProps) {
  const frontScene = props.sceneStack[props.sceneStack.length - 1]
  return (
    <Layout>
      {(() => {
        switch (frontScene.sceneId) {
          case 'battle':
            return <BattleContainer />
        }
        return <h1>App</h1>
      })()}
    </Layout>
  )
}
