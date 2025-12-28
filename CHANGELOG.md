# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-28

### 🎉 Initial Release

#### Added

##### Core Architecture
- ✨ Micro-kernel plugin-based architecture
- ✨ Event-driven system with pub/sub pattern
- ✨ Plugin registry for managing extensions
- ✨ Zero-dependency implementation

##### Core Plugins
- ✨ **token-store** - Token state management with expiration tracking
- ✨ **token-decoder** - JWT decoding and validation
- ✨ **refresh-engine** - Automatic token refresh with retry logic and queuing
- ✨ **fetch-interceptor** - HTTP request interception with auth header injection
- ✨ **storage-memory** - In-memory storage implementation

##### Token Management
- ✨ Set, get, and clear authentication tokens
- ✨ Token expiration tracking and validation
- ✨ JWT payload decoding and claim extraction
- ✨ Support for `expiresIn` and `expiresAt` token formats

##### Auto-Refresh
- ✨ Smart automatic token refresh before expiration
- ✨ Configurable refresh threshold
- ✨ Request queuing during refresh (prevents concurrent refreshes)
- ✨ Retry logic with exponential backoff
- ✨ Manual refresh support

##### HTTP Interception
- ✨ Automatic Authorization header injection
- ✨ 401 response handling with auto-retry
- ✨ URL pattern matching (include/exclude)
- ✨ Custom header support
- ✨ Request/response lifecycle hooks

##### Utilities
- ✨ Base64URL encoding/decoding (for JWT)
- ✨ Cookie parsing and serialization
- ✨ Crypto utilities (SHA-256, random bytes)
- ✨ JWT parsing without verification
- ✨ Storage adapters and helpers
- ✨ Time formatting and calculations

##### TypeScript Support
- ✨ Full TypeScript implementation
- ✨ Comprehensive type definitions
- ✨ Generic support for custom token payloads
- ✨ Strict mode compatibility

##### Testing
- ✨ 541 comprehensive tests
- ✨ 99.83% code coverage
- ✨ 100% function coverage
- ✨ Unit and integration test suites
- ✨ Edge case coverage
- ✨ Fast execution (~2.5s)

##### Documentation
- 📚 Comprehensive README
- 📚 API documentation
- 📚 Testing guide
- 📚 Architecture documentation
- 📚 Usage examples

#### Technical Details

##### Dependencies
- Zero runtime dependencies
- Pure TypeScript implementation
- Node.js 18+ and modern browsers supported

##### Bundle
- Tree-shakeable ES modules
- CommonJS compatibility
- TypeScript declarations included
- Optimized bundle size

##### Coverage Report
```
Files:         100% (all core modules)
Statements:    99.83%
Branches:      99.24%
Functions:     100%
Lines:         99.83%
```

##### Test Statistics
```
Test Files:    16 files
Tests:         541 tests
Pass Rate:     100%
Execution:     ~2.5 seconds
```

### Security

- ✅ No known vulnerabilities
- ✅ Zero dependencies
- ✅ Secure token storage patterns
- ✅ XSS protection in cookie handling
- ✅ CSRF protection support

### Performance

- ⚡ Fast initialization (<1ms)
- ⚡ Optimized token refresh (queuing prevents duplicate requests)
- ⚡ Efficient event system
- ⚡ Minimal memory footprint

---

## Development

### Build Process
```bash
npm run build        # Build for production
npm run dev          # Development mode with watch
npm run typecheck    # Type checking
npm run lint         # Linting
npm run format       # Code formatting
```

### Testing
```bash
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run with coverage report
```

### Quality Metrics
- ✅ TypeScript strict mode
- ✅ ESLint configured
- ✅ Prettier formatting
- ✅ Vitest for testing
- ✅ V8 coverage reporting

---

**For full documentation, see [README.md](README.md)**

**For testing details, see [TESTING.md](TESTING.md)**

[1.0.0]: https://github.com/ersinkoc/authkeeper/releases/tag/v1.0.0
