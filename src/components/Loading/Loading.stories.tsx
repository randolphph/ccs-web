import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { Loading } from '.'

export default {
  title: 'Project/Loading',
  component: Loading
} as ComponentMeta<typeof Loading>

const Template: ComponentStory<typeof Loading> = args => <Loading />

export const DEFAULT = Template.bind({})
