# Contributing to MIC Browser Ultimate

Thank you for your interest in contributing to MIC Browser Ultimate! This guide will help you get started with contributing to the project.

## 🤝 How to Contribute

### Ways to Contribute

- 🐛 **Bug Reports**: Report issues and bugs
- 💡 **Feature Requests**: Suggest new features and improvements
- 📖 **Documentation**: Improve documentation and guides
- 🔧 **Code Contributions**: Submit pull requests with fixes and features
- 🧪 **Testing**: Help test new features and report issues
- 🌐 **Translations**: Help translate the app to other languages

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/mic-browser-ultimate.git
   cd mic-browser-ultimate
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/originalowner/mic-browser-ultimate.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```
5. **Start development server:**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Making Changes

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes:**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(analysis): add SEO score calculation
fix(updater): resolve auto-update notification issue
docs(readme): update installation instructions
```

## 🏗️ Code Standards

### JavaScript Style Guide

- Use ES6+ features where appropriate
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Structure

```
src/
├── components/          # Reusable UI components
├── services/           # Business logic and services
├── utils/              # Utility functions
├── styles/             # CSS and styling
└── assets/             # Images, icons, fonts
```

### Code Examples

**Good:**
```javascript
// Clear, descriptive function name
async function analyzePage(url) {
  try {
    const analysis = await pageAnalyzer.analyze(url);
    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error('Page analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Bad:**
```javascript
// Unclear function name, poor error handling
function doStuff(u) {
  const result = analyzer.run(u);
  return result;
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for new functions
- Add integration tests for features
- Test error conditions and edge cases
- Use descriptive test names

**Test Example:**
```javascript
describe('PageAnalyzer', () => {
  test('should analyze page SEO correctly', async () => {
    const mockUrl = 'https://example.com';
    const result = await pageAnalyzer.analyzeSEO(mockUrl);
    
    expect(result).toHaveProperty('score');
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
```

## 🐛 Bug Reports

### Before Submitting

1. **Search existing issues** to avoid duplicates
2. **Update to latest version** to see if bug is fixed
3. **Test in development mode** to isolate the issue

### Bug Report Template

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g. Windows 11, macOS 12, Ubuntu 20.04]
- Browser Version: [e.g. v1.0.0]
- Node.js Version: [e.g. 18.17.0]

**Screenshots**
Add screenshots if applicable.

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Explain why this feature would be useful.

**Proposed Solution**
Describe how you think this should work.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context, mockups, or examples.
```

## 📖 Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date with code changes
- Use proper Markdown formatting

### Types of Documentation

- **API Documentation**: Function and method documentation
- **User Guides**: How-to guides for end users
- **Developer Guides**: Technical documentation for contributors
- **Changelog**: Record of changes between versions

## 🔍 Code Review Process

### For Contributors

- Ensure your PR description clearly explains the changes
- Link related issues in your PR description
- Respond promptly to review feedback
- Keep PRs focused and reasonably sized

### Review Criteria

- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code readable and maintainable?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Testing**: Are there adequate tests?
- **Documentation**: Is documentation updated if needed?

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Feature freeze** for upcoming release
2. **Testing** on all supported platforms
3. **Update changelog** with new features and fixes
4. **Create release tag** and publish
5. **Update documentation** as needed

## 🌐 Internationalization

### Adding Translations

1. **Create language file** in `src/locales/`
2. **Follow existing structure** from `en.json`
3. **Test translations** in the application
4. **Submit PR** with translation files

### Translation Guidelines

- Keep text concise and clear
- Consider cultural context
- Test with different text lengths
- Use proper Unicode encoding

## 📞 Getting Help

### Community Support

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community discussions
- **Documentation**: Check existing documentation first

### Development Questions

If you have questions about:
- **Architecture decisions**: Create a GitHub Discussion
- **Implementation details**: Comment on related issues/PRs
- **Best practices**: Check existing code patterns

## 🏆 Recognition

Contributors will be recognized in:
- **README.md**: Contributors section
- **Release notes**: Major contributions highlighted
- **GitHub**: Contributor badges and recognition

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete
- [ ] No merge conflicts with main branch
- [ ] Feature works on target platforms

## 📄 License

By contributing to MIC Browser Ultimate, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to MIC Browser Ultimate!** 🎉

Your contributions help make this project better for everyone.