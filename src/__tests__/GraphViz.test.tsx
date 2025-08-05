import { render, screen, act } from '@testing-library/react'
import GraphViz from '../components/GraphViz'

const handlers: Record<string, Function> = {}
jest.mock('socket.io-client', () => {
  return () => ({
    on: (event: string, cb: Function) => {
      handlers[event] = cb
    },
    emit: jest.fn(),
    disconnect: jest.fn()
  })
})

beforeEach(() => {
  ;(global.fetch as any) = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ nodes: [], links: [] }) })
  )
  Object.keys(handlers).forEach((k) => delete handlers[k])
})

global.Worker = class {
  postMessage() {}
  terminate() {}
} as any

test('renders search input', async () => {
  render(<GraphViz />)
  const input = await screen.findByPlaceholderText(/Search/i)
  expect(input).toBeInTheDocument()
})

test('shows error when fetch fails', async () => {
  ;(global.fetch as any) = jest.fn(() => Promise.reject(new Error('fail')))
  render(<GraphViz />)
  const error = await screen.findByText(/Failed to load graph/i)
  expect(error).toBeInTheDocument()
})

test('handles socket connection errors', async () => {
  render(<GraphViz />)
  act(() => {
    handlers['connect_error'] && handlers['connect_error']()
  })
  const error = await screen.findByText(/Socket connection lost/i)
  expect(error).toBeInTheDocument()
})
