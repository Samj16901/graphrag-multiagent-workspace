import { render, screen } from '@testing-library/react'
import GraphViz from '../components/GraphViz'

jest.mock('socket.io-client', () => {
  return () => ({ on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() })
})

global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({ nodes: [], links: [] }) })
) as any

global.Worker = class {
  postMessage() {}
  terminate() {}
} as any

test('renders search input', async () => {
  render(<GraphViz />)
  const input = await screen.findByPlaceholderText(/Search/i)
  expect(input).toBeInTheDocument()
})
