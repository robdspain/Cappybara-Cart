module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Suppress specific warnings
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    
    // Ignore warnings for mediapipe source map
    'import/no-anonymous-default-export': 'warn'
  },
  ignorePatterns: [
    'node_modules/**',
    'build/**',
    'public/**',
    '*.test.js',
    '*.spec.js'
  ]
}; 