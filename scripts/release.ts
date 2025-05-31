#!/usr/bin/env npx tsx

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import * as readline from 'readline'
import { tmpdir } from 'os'
import { join } from 'path'

interface PackageJson {
  version: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

class ReleaseManager {
  private rl: readline.Interface
  private currentVersion: string
  private newVersion: string = ''
  private releaseInfo: string = ''

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    // Read current version from package.json
    const packageJson: PackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    this.currentVersion = packageJson.version
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim())
      })
    })
  }

  private log(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m', // red
      reset: '\x1b[0m'
    }

    console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`)
  }

  private validateVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+$/
    return versionRegex.test(version)
  }

  private compareVersions(current: string, target: string): boolean {
    const currentParts = current.split('.').map(Number)
    const targetParts = target.split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      if (targetParts[i] > currentParts[i]) return true
      if (targetParts[i] < currentParts[i]) return false
    }
    return false // versions are equal
  }

  private updatePackageJson(): void {
    this.log(`Updating package.json version from ${this.currentVersion} to ${this.newVersion}`)

    const packageJson: PackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    packageJson.version = this.newVersion

    writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n')
    this.log('package.json updated successfully', 'success')
  }

  private updateChangelog(): void {
    this.log('Updating CHANGELOG.md')

    const changelogPath = 'CHANGELOG.md'
    let existingContent = ''

    if (existsSync(changelogPath)) {
      existingContent = readFileSync(changelogPath, 'utf8')
    }

    const newEntry = `## ${this.newVersion}\n${this.releaseInfo}\n\n`
    const updatedContent = newEntry + existingContent

    writeFileSync(changelogPath, updatedContent)
    this.log('CHANGELOG.md updated successfully', 'success')
  }

  private updateWebsite(): void {
    this.log('Updating website download links')

    const websiteFile = 'website/index.html'
    if (!existsSync(websiteFile)) {
      this.log('website/index.html not found, skipping website update', 'error')
      return
    }

    let content = readFileSync(websiteFile, 'utf8')

    // Update version display
    content = content.replace(/Version \d+\.\d+\.\d+/g, `Version ${this.newVersion}`)

    // Update download links
    content = content.replace(/paw-\d+\.\d+\.\d+\.dmg/g, `paw-${this.newVersion}.dmg`)

    writeFileSync(websiteFile, content)
    this.log('Website updated successfully', 'success')
  }

  private runBuild(): void {
    this.log('Building application for macOS...')

    try {
      // Set AWS profile for the build process
      process.env.AWS_PROFILE = 'wcy'

      execSync('npm run build:mac', {
        stdio: 'inherit',
        env: { ...process.env, AWS_PROFILE: 'wcy' }
      })

      this.log('Build completed successfully', 'success')
    } catch (error) {
      this.log('Build failed', 'error')
      throw error
    }
  }

  private uploadToS3(): void {
    this.log('Uploading build to S3...')

    const artifactPath = `dist/paw-${this.newVersion}.dmg`

    if (!existsSync(artifactPath)) {
      this.log(`Build artifact not found: ${artifactPath}`, 'error')
      throw new Error('Build artifact not found')
    }

    try {
      const s3Command = `aws s3 cp "${artifactPath}" "s3://paw-cwang-io/paw-${this.newVersion}.dmg"`

      execSync(s3Command, {
        stdio: 'inherit',
        env: { ...process.env, AWS_PROFILE: 'wcy' }
      })

      this.log(`Successfully uploaded ${artifactPath} to S3`, 'success')
    } catch (error) {
      this.log('S3 upload failed', 'error')
      throw error
    }
  }

  private commitAndTag(): void {
    this.log('Committing changes and creating tag...')

    try {
      // Add all changes
      execSync('git add package.json CHANGELOG.md website/index.html')

      // Commit with release message
      const commitMessage = `chore: release v${this.newVersion}\n\n${this.releaseInfo}`

      const temporaryCommitMessagePath = join(tmpdir(), 'commit-msg.txt')
      writeFileSync(temporaryCommitMessagePath, commitMessage)

      execSync(`git commit -F "${temporaryCommitMessagePath}"`)

      // Create tag
      execSync(`git tag -a v${this.newVersion} -m "Release v${this.newVersion}"`)

      this.log(`Committed changes and created tag v${this.newVersion}`, 'success')
    } catch (error) {
      this.log('Git operations failed', 'error')
      throw error
    }
  }

  private async getUserInput(): Promise<void> {
    this.log(`Current version: ${this.currentVersion}`)

    // Get new version
    while (!this.newVersion) {
      const version = await this.prompt('Enter new version (e.g., 1.0.4): ')

      if (!this.validateVersion(version)) {
        this.log('Invalid version format. Use semantic versioning (e.g., 1.0.4)', 'error')
        continue
      }

      if (!this.compareVersions(this.currentVersion, version)) {
        this.log(
          `New version (${version}) must be greater than current version (${this.currentVersion})`,
          'error'
        )
        continue
      }

      this.newVersion = version
    }

    // Get release information
    while (!this.releaseInfo) {
      const info = await this.prompt('Enter release information (what changed?): ')

      if (!info.trim()) {
        this.log('Release information is required', 'error')
        continue
      }

      this.releaseInfo = info
    }

    // Confirm release
    this.log('\n--- Release Summary ---')
    this.log(`Version: ${this.currentVersion} → ${this.newVersion}`)
    this.log(`Release info: ${this.releaseInfo}`)
    console.log()

    const confirm = await this.prompt('Proceed with release? (y/N): ')
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      this.log('Release cancelled', 'info')
      process.exit(0)
    }
  }

  async run(): Promise<void> {
    try {
      this.log('🚀 Starting release process...', 'info')

      // Get user input
      await this.getUserInput()

      // Update files
      this.updatePackageJson()
      this.updateChangelog()
      this.updateWebsite()

      // Build and upload
      this.runBuild()
      this.uploadToS3()

      // Commit and tag
      this.commitAndTag()

      this.log(`🎉 Release v${this.newVersion} completed successfully!`, 'success')
      this.log("Don't forget to push your changes and tags:", 'info')
      this.log('  git push --follow-tags', 'info')
    } catch (error) {
      this.log(`Release failed: ${error}`, 'error')
      process.exit(1)
    } finally {
      this.rl.close()
    }
  }
}

// Run the release manager
const releaseManager = new ReleaseManager()
releaseManager.run()
