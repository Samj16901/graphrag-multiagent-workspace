import LightningFS from '@isomorphic-git/lightning-fs'
import * as git from 'isomorphic-git'

export default class BrowserFS {
  fs: LightningFS

  constructor(name = 'workspace') {
    this.fs = new LightningFS(name)
  }

  async readFile(path: string): Promise<string> {
    const data = await this.fs.promises.readFile(path, 'utf8')
    return data.toString()
  }

  async writeFile(path: string, content: string) {
    await this.fs.promises.writeFile(path, content)
  }

  async commit(dir: string, message: string, author: { name: string; email: string }) {
    await git.add({ fs: this.fs, dir, filepath: '.' })
    return await git.commit({ fs: this.fs, dir, message, author })
  }
}
