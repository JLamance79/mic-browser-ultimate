# Analytics & Telemetry Configuration Guide

## Overview
MIC Browser Ultimate now includes comprehensive analytics and telemetry tracking using Google Analytics (Universal Analytics) to understand usage patterns and improve the application.

## Package Used
- **universal-analytics**: Reliable Node.js library for Google Analytics tracking
- **Installation**: `npm install universal-analytics`

## Setup Instructions

### 1. Get Google Analytics Tracking ID

1. Visit [Google Analytics](https://analytics.google.com/)
2. Create a new property or use an existing one
3. Get your tracking ID (format: `UA-XXXXXXXXX-X` or `G-XXXXXXXXXX`)

### 2. Configure Tracking ID

In `main.js`, replace the placeholder tracking ID:

```javascript
const ua = require('universal-analytics');
const ga = ua('UA-XXXXXXXX-X'); // Replace with your actual tracking ID
```

### 3. Test Analytics

Run the test script to verify everything is working:

```bash
node test-analytics.js
```

## Events Being Tracked

### Application Lifecycle
- **App Started**: Tracks when the application starts with version info
- **Session Started**: Tracks session start with platform info
- **Window Created**: Tracks main window creation with resolution
- **Window Closed**: Tracks when the main window is closed
- **App Shutdown**: Tracks application shutdown
- **Session Ended**: Tracks session completion

### Feature Usage
- **Chat System Initialized**: Success/failure of chat system startup
- **Learning System Initialized**: Success/failure of learning system startup
- **AI Request**: Tracks AI command usage
- **Chat Message**: Tracks chat message types
- **Document Scan**: Tracks OCR usage with language

### Error Tracking
- **Feature Initialization Failures**: Tracks when systems fail to start
- **Chat System Errors**: Tracks chat-related failures
- **Learning System Errors**: Tracks learning system failures

## Analytics Dashboard Setup

### Key Metrics to Monitor
1. **Daily Active Users**: Track user engagement
2. **Feature Adoption**: Which features are used most
3. **Session Duration**: How long users spend in the app
4. **Error Rates**: System reliability metrics
5. **Platform Distribution**: Windows/Mac/Linux usage

### Recommended Goals
1. **Feature Usage**: Track specific feature interactions
2. **Session Quality**: Measure meaningful user sessions
3. **Error Reduction**: Monitor system stability

## Privacy Considerations

### Data Collection
- No personal information is collected
- Only application usage patterns are tracked
- All data is anonymized

### User Control
Consider adding user preferences to:
- Opt out of analytics
- Control what data is shared
- View privacy policy

### Implementation Example
```javascript
// In settings or preferences
const analyticsEnabled = await storage.get('analytics-enabled', true);
if (analyticsEnabled) {
    ga.event('Usage', 'FeatureUsed', featureName).send();
}
```

## Event Categories

### Category: "App"
- Actions: Started, Shutdown
- Labels: Version, Platform, Reason

### Category: "Session"
- Actions: Started, Ended
- Labels: Platform, Duration, Type

### Category: "Feature"
- Actions: [FeatureName]Initialized, [FeatureName]Used
- Labels: Success/Failed, Configuration

### Category: "Usage"
- Actions: AIRequest, ChatMessage, DocumentScan
- Labels: Type, Language, Context

### Category: "Window"
- Actions: Created, Closed, Resized
- Labels: Resolution, State

## Best Practices

### 1. Event Naming Convention
- Use consistent category/action/label structure
- Keep names descriptive but concise
- Use PascalCase for consistency

### 2. Performance
- Analytics calls are non-blocking
- Minimal impact on application performance
- Failed analytics don't affect app functionality

### 3. Data Quality
- Include meaningful context in labels
- Track both success and failure states
- Use appropriate data types

## Troubleshooting

### Common Issues
1. **Events not appearing**: Check tracking ID format
2. **Network errors**: Verify internet connection
3. **Missing data**: Ensure proper event structure

### Debug Mode
Enable debug logging:
```javascript
// Add to main.js for debugging
if (isDev) {
    console.log('Analytics event:', category, action, label);
}
```

## Sample Analytics Queries

### Google Analytics 4 (GA4)
```
// Most used features
event_name = "Usage"
event_label != "(not set)"
Group by: event_label

// Session quality
event_name = "Session"
action = "Ended"
Average session duration

// Error tracking
event_name = "Feature"
event_label = "Failed"
Group by: action
```

## Future Enhancements

### Planned Metrics
- User journey tracking
- Performance metrics
- Feature completion rates
- A/B testing support

### Advanced Features
- Custom dimensions for user segments
- Enhanced ecommerce tracking (if applicable)
- Real-time analytics dashboard
- Automated error reporting

## Support

For questions or issues with analytics:
1. Check Google Analytics documentation
2. Verify npm package installation
3. Test with the provided test script
4. Review console logs for errors