import type { CapacitorConfig } from '@capacitor/cli'

/**
 * The native shell around the existing web build.
 *
 * `appId` is permanent once an app is published — it cannot be changed on
 * either store without shipping a new listing and losing the install base.
 * Change it to a domain you control before the first submission.
 */
const config: CapacitorConfig = {
  appId: 'com.twohomes.app',
  appName: 'Twohomes',
  webDir: 'dist',

  // The web build already uses relative asset paths and hash routing, so it
  // runs from the local file server Capacitor provides with no changes.
  android: {
    backgroundColor: '#faf8f4',
  },
  ios: {
    backgroundColor: '#faf8f4',
    // The schedule is the point of the app; it should never bounce.
    scrollEnabled: false,
    contentInset: 'never',
  },
}

export default config
