// Simple layout worker: assigns random positions to nodes.
// In a real system this could run a force-directed algorithm.
export interface WorkerInput {
  nodes: { id: string }[]
}

export interface WorkerOutput {
  nodes: { id: string; x: number; y: number; z: number }[]
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const nodes = e.data.nodes.map((n) => ({
    ...n,
    x: (Math.random() - 0.5) * 50,
    y: (Math.random() - 0.5) * 50,
    z: (Math.random() - 0.5) * 50
  }))
  const out: WorkerOutput = { nodes }
  // @ts-expect-error WebWorker context
  self.postMessage(out)
}
