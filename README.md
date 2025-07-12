# TypeScript Boilerplate Project

A modern TypeScript boilerplate project with comprehensive tooling and best practices.

## Features

- ⚡ **TypeScript 5.3** with strict configuration
- 🧪 **Jest** for unit testing with TypeScript support
- 📝 **ESLint** with TypeScript rules
- 💅 **Prettier** for code formatting
- 🔧 **ts-node** for development
- 📦 **Modern Node.js** support (>=18.0.0)

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point
│   └── utils/
│       ├── calculator.ts      # Calculator utility class
│       ├── logger.ts          # Logger utility class
│       └── __tests__/         # Test files
├── dist/                     # Compiled JavaScript output
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd typescript-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the project in development mode:
```bash
npm run dev
```

### Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

Run the compiled version:
```bash
npm start
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Code Quality

Lint the code:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

Format code with Prettier:
```bash
npm run format
```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run dev` - Run TypeScript directly with ts-node
- `npm run watch` - Watch for changes and recompile
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run clean` - Remove compiled files

## Example Usage

The project includes example utilities:

### Calculator

```typescript
import { Calculator } from './src/utils/calculator';

const calc = new Calculator();
console.log(calc.add(5, 3));      // 8
console.log(calc.multiply(4, 7)); // 28
console.log(calc.power(2, 3));    // 8
```

### Logger

```typescript
import { Logger, LogLevel } from './src/utils/logger';

const logger = new Logger(LogLevel.DEBUG);
logger.info('Application started');
logger.debug('Debug information');
logger.warn('Warning message');
logger.error('Error occurred', new Error('Something went wrong'));
```

## Configuration

### TypeScript

The project uses strict TypeScript configuration with:
- ES2022 target
- CommonJS modules
- Strict type checking
- Source maps for debugging
- Declaration files generation

### ESLint

Configured with TypeScript-specific rules and Prettier integration.

### Prettier

Consistent code formatting with:
- Single quotes
- 2-space indentation
- 80 character line width
- Trailing commas

### Jest

Configured for TypeScript testing with:
- ts-jest preset
- Coverage reporting
- Test file patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 