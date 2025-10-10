# GitHub Repository Setup Guide

This guide will help you set up a GitHub repository for MIC Browser Ultimate with automated builds and releases.

## 📋 Prerequisites

Before setting up the repository, ensure you have:

- [x] GitHub account
- [x] Git installed locally
- [x] Node.js 18+ installed
- [x] npm or yarn package manager
- [x] Write access to create repositories

## 🚀 Repository Setup Steps

### 1. Create GitHub Repository

1. **Go to GitHub** and create a new repository:
   - Repository name: `mic-browser-ultimate`
   - Description: `Advanced Cross-Platform Browser with AI-Powered Analysis`
   - Visibility: Public (recommended) or Private
   - Initialize with README: ✅ (or use the one we created)
   - Add .gitignore: Node
   - Choose a license: MIT

2. **Clone the repository locally:**
   ```bash
   git clone https://github.com/yourusername/mic-browser-ultimate.git
   cd mic-browser-ultimate
   ```

### 2. Initialize Project Files

1. **Copy your project files** into the cloned repository directory
2. **Update repository URL** in `package.json`:
   ```json
   {
     "repository": {
       "type": "git", 
       "url": "https://github.com/yourusername/mic-browser-ultimate.git"
     },
     "homepage": "https://github.com/yourusername/mic-browser-ultimate"
   }
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

### 3. Configure GitHub Actions Secrets

For automated releases, you need to set up repository secrets:

1. **Go to your repository** → Settings → Secrets and variables → Actions
2. **Add the following secrets:**

   | Secret Name | Description | Required For |
   |-------------|-------------|--------------|
   | `GITHUB_TOKEN` | Automatically provided by GitHub | Releases, artifacts |
   | `GH_TOKEN` | Personal Access Token for releases | electron-builder publishing |

#### Creating a Personal Access Token (GH_TOKEN):

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `write:packages` (Upload packages to GitHub Package Registry)
4. Copy the token and add it as `GH_TOKEN` secret

### 4. Update Build Configuration

Update the `publish` section in `package.json` build configuration:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "yourusername",        // ← Update with your username
        "repo": "mic-browser-ultimate", // ← Update with your repo name
        "releaseType": "release"
      }
    ]
  }
}
```

### 5. Create Initial Commit

```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit: MIC Browser Ultimate with GitHub Actions"

# Push to GitHub
git push origin main
```

## 🔧 GitHub Actions Workflows

### Build Workflow (`.github/workflows/build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**What it does:**
- Builds on Windows, macOS, and Linux
- Runs tests and security scans
- Uploads build artifacts
- Validates code quality

### Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Git tags matching `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

**What it does:**
- Creates GitHub release
- Builds for all platforms
- Uploads release assets:
  - Windows: `.exe` installer and portable
  - macOS: `.dmg` disk image
  - Linux: `.AppImage`, `.deb`, and `.rpm`
- Generates auto-updater files

## 📦 Creating Releases

### Method 1: Git Tags (Recommended)

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Method 2: Manual Workflow Dispatch

1. Go to **Actions** tab in your repository
2. Select **Release** workflow
3. Click **Run workflow**
4. Enter version (e.g., `v1.0.0`)
5. Click **Run workflow**

### Method 3: GitHub CLI (if installed)

```bash
# Create a release with gh CLI
gh release create v1.0.0 --title "MIC Browser Ultimate v1.0.0" --notes "Release notes here"
```

## 🛠️ Local Development Setup

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/mic-browser-ultimate.git
   cd mic-browser-ultimate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development Commands

```bash
# Start in development mode
npm run dev

# Run with debugging
npm run start -- --inspect=5858

# Build for current platform
npm run build

# Build for all platforms
npm run build:all

# Run tests
npm test

# Code formatting
npm run format

# Linting
npm run lint
```

### Testing Builds Locally

```bash
# Test Windows build (on Windows)
npm run build:win

# Test macOS build (on macOS)
npm run build:mac

# Test Linux build (on Linux)
npm run build:linux
```

## 🔍 Troubleshooting

### Common Issues

#### Build Fails with Missing Icons
```bash
# Generate required icons
npm run create-icons
npm run prepare-icons
```

#### Permission Denied on macOS
```bash
# Add executable permissions
chmod +x scripts/*.js
```

#### Node Modules Issues
```bash
# Clean reinstall
npm run reinstall
```

#### GitHub Actions Failing
1. Check secrets are properly configured
2. Verify repository permissions
3. Check build logs in Actions tab
4. Ensure all required files are committed

### Debugging GitHub Actions

1. **View build logs:**
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed step logs

2. **Common fixes:**
   - Update Node.js version in workflow
   - Check file paths and permissions
   - Verify secrets configuration
   - Ensure all dependencies are included

## 📊 Monitoring Releases

### Release Assets Structure

Each release will include:

```
Release v1.0.0/
├── MIC-Browser-Ultimate-Setup-v1.0.0.exe     # Windows Installer
├── MIC-Browser-Ultimate-Portable-v1.0.0.exe  # Windows Portable
├── MIC-Browser-Ultimate-v1.0.0.dmg           # macOS Disk Image
├── MIC-Browser-Ultimate-v1.0.0.AppImage      # Linux AppImage
├── mic-browser-ultimate_v1.0.0_amd64.deb     # Debian/Ubuntu Package
├── mic-browser-ultimate-v1.0.0.x86_64.rpm    # RedHat/Fedora Package
├── latest-win32.yml                          # Windows Update Info
├── latest-darwin.yml                         # macOS Update Info
└── latest-linux.yml                          # Linux Update Info
```

### Auto-Updater Integration

The auto-updater will automatically:
- Check for updates from GitHub releases
- Download updates in background
- Notify users of available updates
- Apply updates with user consent

## 🎯 Next Steps

After setting up the repository:

1. **Customize branding:**
   - Update app name and description
   - Replace placeholder icons
   - Modify color scheme and styling

2. **Configure integrations:**
   - Set up analytics (if needed)
   - Configure error reporting
   - Add crash reporting

3. **Documentation:**
   - Create user guides
   - Document API endpoints
   - Add developer documentation

4. **Quality assurance:**
   - Set up automated testing
   - Add code coverage reports
   - Implement continuous integration

## 📞 Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/yourusername/mic-browser-ultimate/issues)
2. Review [GitHub Actions Documentation](https://docs.github.com/en/actions)
3. Consult [electron-builder Documentation](https://www.electron.build/)

---

**Ready to deploy!** 🚀 Your MIC Browser Ultimate is now configured for professional GitHub hosting with automated builds and releases.