# Paw

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For macOS
$ npm run build:mac
```

### Release

Before releasing, create a commit stating what has changed

```bash
$ git add -A
$ git commit -m "feat: add CRDT-based synchronization"
```

Then hit the release button with a new version & last commit message by default:

```bash
$ npm run release

[INFO] 🚀 Starting release process...
[INFO] Current version: 1.0.6
Enter new version (e.g., 1.0.4): 1.0.7
Enter release information (what changed?) (feat: add CRDT-based synchronization):
```

The script handles the automatic release procedure:

1. Build the Electron App
2. Sign and notarize
3. Upload to S3
4. Update the website link

To update the website, run:

```bash
git push --follow-tags
```
