# Capybara Kart Racing Game

A browser-based 2D racing game inspired by Mario Kart, with a capybara character instead of Mario, built using React.js and containerized with Docker.

## Features

- Capybara as the playable character (sprite-based)
- A simple looping race track with obstacles
- Keyboard controls (arrow keys for movement)
- Basic physics (acceleration, turning, collision detection)
- Modern UI with a start screen and score tracking

## Tech Stack

- React.js for the frontend and game logic
- HTML5 Canvas for rendering the game
- Docker for containerization

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Docker and Docker Compose (for containerized setup)

### Running Locally

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open your browser to http://localhost:3000

### Running with Docker

1. Build and run with Docker Compose:
   ```
   docker-compose up
   ```
2. Or build and run the Docker container directly:
   ```
   docker build -t capybara-kart .
   docker run -p 3000:3000 capybara-kart
   ```
3. Open your browser to http://localhost:3000

## How to Play

- Use arrow keys to control your capybara:
  - ↑ Accelerate
  - ↓ Brake
  - ← Turn Left
  - → Turn Right
- Avoid obstacles and track boundaries
- Race for as long as you can to increase your score

## Game Structure

- **App.js**: Main component handling game state (start, playing, game over)
- **GameCanvas.js**: Core game logic and rendering
- **StartScreen.js**: Initial screen with game instructions
- **GameOverScreen.js**: End screen showing final score

## Development

### React DevTools 

For a better development experience, install the React DevTools browser extension:
- [Chrome Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
- [Edge Extension](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

### Troubleshooting

**Missing Icons Error**

If you see errors about missing icons (e.g., `logo192.png`), you can:

1. Add the missing icons to the `public` directory, or
2. Update the `manifest.json` file to remove references to non-existent icons

**Adding a Custom Favicon**

To add a proper favicon for your game:
1. Use an online favicon generator like [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Place the generated favicon.ico file in the `public` directory
3. For PWA support, add properly sized PNG icons and update the manifest.json accordingly

## License

MIT

## Acknowledgments

- Inspired by Mario Kart
- Built with React.js