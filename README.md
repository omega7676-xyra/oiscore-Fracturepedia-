# 🏥 Fracturepedia

AI-powered Fracture Reference Guide powered by **Gemini 3.6 Flash**

## Features

✅ **Cross-Platform Support**
- 💻 Desktop (Windows, Mac, Linux)
- 📱 Mobile Web (Responsive Design)
- 🍎 iOS App
- 🤖 Android App
- 📡 PWA (Progressive Web App)

✅ **AI-Powered**
- Real-time responses using Gemini 3.6 Flash
- Medical-grade fracture information
- Instant assistance

✅ **Offline Support**
- Works offline with cached data
- Service Worker integration
- Seamless sync when reconnected

✅ **App-Like Experience**
- Installable on home screen
- Full-screen mode
- Push notifications (coming soon)

## Quick Start

### Web App (PWA)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key

# Start development server
npm start

# Build for production
npm run build
```

Then visit `http://localhost:3000` and install as an app!

### Mobile App (React Native)

```bash
# Install React Native CLI
npm install -g react-native-cli

# Install dependencies
cd native && npm install

# Run on iOS
npm run build:ios

# Run on Android
npm run build:android
```

## Environment Setup

1. Get your Gemini API key from [Google AI Studio](https://ai.google.dev/)
2. Create `.env` file:
   ```
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```
3. Never commit `.env` file to Git

## Project Structure

```
Fracturepedia/
├── public/               # Static assets & PWA files
│   ├── manifest.json     # PWA metadata
│   ├── service-worker.js # Offline support
│   └── icons/            # App icons
├── src/                  # React source code
│   ├── app.js           # Main app component
│   ├── gemini-api.js    # Gemini integration
│   ├── index.js         # Entry point
│   └── styles.css       # Styling
├── native/              # React Native apps
│   ├── ios/            # iOS app
│   └── android/        # Android app
└── package.json        # Dependencies
```

## Deployment

### Web (Vercel/Netlify)
```bash
# Build
npm run build

# Deploy to Vercel
vercel
```

### iOS (App Store)
1. Build with Xcode
2. Submit to TestFlight
3. Release on App Store

### Android (Google Play)
1. Build APK/AAB
2. Upload to Google Play Console
3. Release to production

## Browser Support

| Browser | Support |
|---------|----------|
| Chrome  | ✅ Full  |
| Firefox | ✅ Full  |
| Safari  | ✅ Full  |
| Edge    | ✅ Full  |
| IE 11   | ❌ No    |

## Mobile App Stores

- 🍎 [iOS App Store](https://apps.apple.com) - Coming Soon
- 🤖 [Google Play Store](https://play.google.com) - Coming Soon

## Development

### Available Scripts

```bash
# Start dev server
npm start

# Build for web
npm run build

# Build iOS app
npm run build:ios

# Build Android app
npm run build:android

# Run tests
npm test
```

## API Integration

### Gemini API

Fracturepedia uses Google's Gemini 3.6 Flash model for instant, accurate responses.

```javascript
const geminiAPI = new GeminiAPI(API_KEY);
const response = await geminiAPI.askFracturepedia('What is a compound fracture?');
```

## Security

- API keys stored in environment variables
- HTTPS only in production
- No sensitive data stored locally
- Regular security updates

## Performance

- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Offline-First PWA
- Optimized bundle size: ~100KB

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your fork
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- 📧 Email: support@fracturepedia.com
- 🐛 GitHub Issues: [Report a bug](https://github.com/omega7676-xyra/oiscore-Fracturepedia-/issues)
- 💬 Discussions: [Ask a question](https://github.com/omega7676-xyra/oiscore-Fracturepedia-/discussions)

## Roadmap

- [ ] Push notifications
- [ ] Offline medical database
- [ ] Image recognition for fractures
- [ ] Multi-language support
- [ ] Voice commands
- [ ] Integration with medical imaging tools
- [ ] Character profile images for personal library

---

**Made with ❤️ by Omega7676-Xyra**
