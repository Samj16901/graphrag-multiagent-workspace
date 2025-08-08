import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, author } = body

    if (!message) {
      return NextResponse.json({ error: 'Commit message is required' }, { status: 400 })
    }

    const repoPath = process.cwd()
    const authorName = author?.name || 'Workspace User'
    const authorEmail = author?.email || 'workspace@example.com'

    // Set git config for this commit
    const gitConfigCmd = [
      `cd "${repoPath}"`,
      `git config user.name "${authorName}"`,
      `git config user.email "${authorEmail}"`,
    ].join(' && ')

    // Stage all changes and commit
    const gitCommitCmd = [
      `cd "${repoPath}"`,
      `git add .`,
      `git commit -m "${message.replace(/"/g, '\\"')}"`,
    ].join(' && ')

    try {
      execSync(gitConfigCmd, { encoding: 'utf8' })
      const output = execSync(gitCommitCmd, { encoding: 'utf8' })
      
      // Get the commit SHA
      const shaCmd = `cd "${repoPath}" && git rev-parse HEAD`
      const sha = execSync(shaCmd, { encoding: 'utf8' }).trim()

      return NextResponse.json({
        success: true,
        sha,
        message,
        output: output.trim()
      })
    } catch (gitError) {
      // Check if it's because there are no changes to commit
      const errorMessage = (gitError as Error).message
      if (errorMessage.includes('nothing to commit')) {
        return NextResponse.json({
          success: false,
          error: 'No changes to commit',
          message: 'Working directory is clean'
        }, { status: 409 })
      }
      throw gitError
    }
  } catch (error) {
    console.error('Error in /api/git/commit:', error)
    return NextResponse.json({ 
      error: 'Failed to commit changes',
      details: (error as Error).message 
    }, { status: 500 })
  }
}