'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const GraphViz = dynamic(() => import('../components/GraphViz'), { ssr: false })

export default function Home() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!input.trim()) return
    const msg = input
    setMessages((m) => [...m, `You: ${msg}`])
    setInput('')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed')
      setMessages((m) => [...m, `Bot: ${json.response}`])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    // placeholder for upload logic
    alert(`Selected file: ${file.name}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">DMSMS Intelligence Dashboard</h1>
      <GraphViz />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Chat</h2>
          <div className="h-40 overflow-y-auto mb-2 border border-gray-700 p-2">
            {messages.map((m, i) => (
              <div key={i} className="mb-1">{m}</div>
            ))}
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <input
            className="text-black p-1 w-full mb-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 px-4 py-1 rounded text-white disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Upload Document</h2>
          <form onSubmit={handleUpload}>
            <input
              type="file"
              className="mb-2"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="submit"
              className="bg-green-600 px-4 py-1 rounded text-white"
            >
              Upload
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

