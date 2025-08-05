# React Native Coding Standards

## Overview

This document outlines the coding standards and best practices for the Expense React Native application. All code must follow these guidelines to maintain consistency, readability, and high quality.

## ESLint Configuration

### Rules Overview

#### Console Statements
- **`no-console`**: Error - No console statements allowed
- **`no-debugger`**: Error - No debugger statements allowed
- Use the logger utility instead: `import { logger } from '../utils/logger';`

#### React Native Specific Rules
- **`react-native/no-unused-styles`**: Error - Remove unused styles
- **`react-native/split-platform-components`**: Error - Use platform-specific components
- **`react-native/no-inline-styles`**: Error - No inline styles allowed
- **`react-native/no-color-literals`**: Error - Use theme colors instead of hardcoded colors
- **`react-native/no-single-element-style-arrays`**: Error - Avoid single-element style arrays

#### React Rules
- **`react/jsx-key`**: Error - Keys required for list items
- **`react/jsx-no-duplicate-props`**: Error - No duplicate props
- **`react/self-closing-comp`**: Error - Self-closing components
- **`react/jsx-curly-spacing`**: Error - No spaces inside JSX curly braces
- **`react/jsx-indent`**: Error - 2-space indentation
- **`react/jsx-max-props-per-line`**: Error - Max 1 prop per line when multiline

#### TypeScript Rules
- **`@typescript-eslint/no-unused-vars`**: Error - No unused variables
- **`@typescript-eslint/no-explicit-any`**: Warning - Avoid `any` type
- **`@typescript-eslint/prefer-const`**: Error - Use const when possible
- **`@typescript-eslint/prefer-optional-chain`**: Error - Use optional chaining
- **`@typescript-eslint/prefer-nullish-coalescing`**: Error - Use nullish coalescing

#### General Code Quality
- **`max-len`**: Error - Max 100 characters per line
- **`complexity`**: Warning - Max complexity of 10
- **`max-depth`**: Warning - Max nesting depth of 4
- **`max-lines`**: Warning - Max 300 lines per file
- **`max-params`**: Warning - Max 4 parameters per function

## File Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/            # Basic UI components
├── constants/          # App constants and theme
├── context/           # React Context providers
├── hooks/             # Custom React hooks
├── navigation/        # Navigation configuration
├── screens/           # Screen components
├── service/           # API services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── assets/            # Images, fonts, etc.
```

## Naming Conventions

### Files and Directories
- Use PascalCase for component files: `LoginScreen.tsx`
- Use camelCase for utility files: `logger.ts`
- Use kebab-case for directories: `react-native`

### Variables and Functions
- Use camelCase for variables and functions: `handleLogin`, `userData`
- Use PascalCase for components and types: `LoginScreen`, `UserType`
- Use UPPER_SNAKE_CASE for constants: `BASE_URL`, `API_ENDPOINTS`

### Interfaces and Types
- Use PascalCase with descriptive names: `LoginFormData`, `ApiResponse`
- Prefix interfaces with `I` only when necessary for clarity
- Use generic types when appropriate: `ApiResponse<T>`

## Component Guidelines

### Functional Components
```typescript
interface ComponentProps {
  title: string;
  onPress: () => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onPress }) => {
  // Component logic
  return <View />;
};
```

### Styling
- Use StyleSheet.create() for all styles
- Avoid inline styles
- Use theme colors instead of hardcoded values
- Create style functions for dynamic styles:

```typescript
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
  });
```

### State Management
- Use useState for local component state
- Use useReducer for complex state logic
- Use Context for global state
- Prefer immutable state updates

## Error Handling

### API Calls
```typescript
try {
  const response = await apiRequest('/endpoint', 'GET');
  return response;
} catch (error) {
  logger.error('API request failed', { error, endpoint });
  throw new Error('User-friendly error message');
}
```

### Component Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Component error', { error, errorInfo });
  }
}
```

## Performance Guidelines

### React Native Best Practices
- Use `useCallback` for function props
- Use `useMemo` for expensive calculations
- Use `React.memo` for pure components
- Avoid creating objects in render

### List Optimization
```typescript
const renderItem = useCallback(({ item }: { item: Item }) => (
  <ListItem item={item} />
), []);

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Testing Guidelines

### Unit Tests
- Test utility functions
- Test custom hooks
- Test component logic (not UI)

### Component Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('LoginScreen', () => {
  it('should handle login submission', () => {
    const mockLogin = jest.fn();
    const { getByText } = render(<LoginScreen onLogin={mockLogin} />);
    
    fireEvent.press(getByText('Log In'));
    expect(mockLogin).toHaveBeenCalled();
  });
});
```

## Security Guidelines

### Data Handling
- Never log sensitive information
- Validate all user inputs
- Sanitize data before API calls
- Use secure storage for tokens

### API Security
```typescript
// Good
const token = await SecureStore.getItemAsync('authToken');

// Bad
const token = await AsyncStorage.getItem('authToken');
```

## Accessibility

### Screen Reader Support
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Login button"
  accessibilityHint="Double tap to log in"
  onPress={handleLogin}
>
  <Text>Log In</Text>
</TouchableOpacity>
```

### Color Contrast
- Ensure sufficient color contrast ratios
- Test with color blindness simulators
- Provide alternative text for images

## Code Review Checklist

- [ ] No console statements
- [ ] No inline styles
- [ ] Proper TypeScript types
- [ ] Error handling implemented
- [ ] Performance optimizations applied
- [ ] Accessibility features added
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] ESLint passes
- [ ] Prettier formatting applied

## Common Patterns

### Custom Hooks
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Service Pattern
```typescript
export const apiService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Implementation
  },
};
```

### Theme Usage
```typescript
const { colors } = useTheme();
const styles = createStyles(colors);
```

## Git Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tool changes

### Examples
```
feat(auth): add login screen with validation
fix(api): resolve JSON parse error in login endpoint
style(components): remove inline styles from LoginScreen
```

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Accessibility Guidelines](https://reactnative.dev/docs/accessibility) 