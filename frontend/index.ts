import { registerRootComponent } from 'expo';

import App from './App';
import { AppRegistry } from 'react-native';

// Prevents "No task registered for key StripeKeepJsAwakeTask" warning on Android
AppRegistry.registerHeadlessTask('StripeKeepJsAwakeTask', () => async () => {
    // This task is required for Stripe's specialized background processing
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
