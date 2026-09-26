# Guardian Live Safety setup

## Required deployment

1. Set `EXPO_PUBLIC_EAS_PROJECT_ID` and the existing Firebase/Maps variables.
2. Configure Android and iOS push credentials with `eas credentials`.
3. Build a development client or production app; Expo Go cannot receive this
   remote-push flow or run background location reliably.
4. Deploy the backend:

   ```sh
   firebase deploy --only functions,firestore:rules,firestore:indexes
   ```

The client uses Expo Push Service. Firestore stores Expo push tokens on the
signed-in user's private profile. A guardian receives in-app delivery only
after accepting the one-time invite link.

## Delivery behavior

- Connected guardian with a working push token: push plus an in-app Alerts
  record, deep-linked to the authorized live viewer.
- Pending guardian, missing token, push rejection, or online start failure:
  SafeRoute opens the device's prefilled SMS composer. The walker must confirm
  Send; mobile platforms do not permit silent SMS from this app.
- Because the composer needs user interaction, an SMS-only guardian cannot
  receive an automatic arrival text while the walker app is backgrounded.
  Automatic background arrival delivery is available only to connected
  guardians through push.
- Safe Walk writes foreground coordinates at most every five seconds and
  requests background updates every ten seconds. The OS may defer background
  updates, especially on iOS.
- Firestore access is limited to the session owner and accepted guardian UIDs.
  Completed sessions reject further event updates and stale active sessions are
  expired by a scheduled function.

## Two-device acceptance checklist

1. Install the same dev/production build on walker and guardian devices and
   sign in with different accounts.
2. On the walker, add a guardian and send the invitation SMS.
3. On the guardian, tap the `saferoute://GuardianInvite` link and accept.
4. Confirm the walker's Guardian card changes from `SMS fallback` to
   `Connected`.
5. Start a Safe Walk. Confirm a push arrives on the guardian device and opens
   `LiveWalkViewer`.
6. Move the walker device and confirm the marker updates and stale warning
   clears.
7. Trigger and confirm a safety check-in; then test a failed check-in and SOS.
8. Complete a walk near its destination and confirm the guardian receives
   `<walker name> arrived safely.`
9. Add a second, unconnected phone-only guardian and verify the start event
   opens a prefilled SMS containing only the required start and map-pin text.
10. Revoke the accepted guardian and confirm they can no longer read a newly
    created session.
