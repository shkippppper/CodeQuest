import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "push-apns-role-mcq",
    type: "mcq",
    prompt: "In the push flow, which party has the persistent, always-on connection directly to the user's device?",
    options: [
      "APNs — your backend never connects to the device directly",
      "Your backend server, which keeps an always-on TLS connection open to each registered device to deliver messages",
      "The App Store, which relays push payloads through its existing software update infrastructure to conserve connections",
      "The device connects directly to another user's device using a peer-to-peer protocol negotiated at registration time",
    ],
    answer: 0,
    explanation:
      "**APNs** (Apple Push Notification service) is the only party with a live connection to the device. Your backend only ever talks to APNs, never to the phone itself.",
  },
  {
    id: "push-flow-order-predict",
    type: "predict",
    prompt: "Ada sends Bob a chat message while Bob's app is closed. Put the delivery path in the correct order.",
    code: `// A: APNs delivers to Bob's device
// B: Ada's app sends the message to the backend
// C: The backend sends a push request to APNs`,
    options: [
      "B, then C, then A — Ada's app to backend, backend to APNs, APNs to Bob's device",
      "A, then B, then C — APNs reserves a slot first, then the backend fills it, then the app triggers the send",
      "B, then A, then C — Ada's backend tells APNs to open a channel, then the device connects, then the backend sends",
      "Ada's device pushes directly to Bob's device using the token as an address, skipping APNs and the backend entirely",
    ],
    answer: 0,
    explanation:
      "The message goes app-to-backend first (a normal API call), then backend-to-APNs (a push request), then APNs-to-device. No party skips a hop — the backend never talks to Bob's phone directly.",
  },
  {
    id: "push-device-token-fill",
    type: "fill",
    prompt: "The opaque identifier APNs generates for a specific app install on a specific device, which your backend stores to address future pushes, is called a device ___.",
    answers: ["token"],
    hint: "Received in didRegisterForRemoteNotificationsWithDeviceToken.",
    explanation:
      "The **device token** is the only address your backend needs to reach a specific installed app on a specific device — APNs itself has no concept of 'which user' it belongs to.",
  },
  {
    id: "push-silent-push-mcq",
    type: "mcq",
    prompt: "What distinguishes a silent push from a regular alert push?",
    options: [
      "It carries `content-available: 1` with no alert/sound/badge, waking the app briefly in the background to run code without showing anything to the user",
      "It uses an entirely different underlying protocol from APNs, routing through a separate dedicated Apple infrastructure channel reserved for background delivery",
      "It can only be sent to iPads because iPhones require explicit user permission before any background wake is allowed by the OS",
      "It guarantees delivery within one second because APNs prioritizes silent pushes above visible alert pushes in its internal delivery queue",
    ],
    answer: 0,
    explanation:
      "A **silent push** has no visible `alert`, `sound`, or `badge` — just `content-available: 1` — and is meant purely to wake the app quietly to sync data in the background.",
  },
  {
    id: "push-extensions-multi",
    type: "multi",
    prompt: "Select **all** true statements about the two push-related app extensions.",
    options: [
      "A Notification Service Extension can modify a notification's content (e.g. attach a downloaded image) before it's displayed",
      "A Notification Content Extension customizes the visible UI shown when a notification is expanded or long-pressed",
      "A Notification Service Extension has an unlimited time budget to run",
      "The two extensions are interchangeable and do the same job",
    ],
    answers: [0, 1],
    explanation:
      "Service extensions enrich payload content under a strict time budget before display (option 2 is false — the budget is tight, a few seconds). Content extensions customize the expanded UI. They serve different jobs (option 3 is false).",
  },
  {
    id: "push-reliability-flashcard",
    type: "flashcard",
    prompt: "Explain why push notifications should never be treated as a guaranteed data-delivery mechanism. Answer aloud, then reveal.",
    modelAnswer:
      "APNs delivery is **best-effort**, not guaranteed — a push can be delayed, coalesced with other pushes, or dropped entirely, whether from a bad network, a powered-off device, or iOS deciding not to spend battery/background budget on it. This means an app can never assume 'I sent a push' equals 'the user's app state is now up to date' — the recipient's device might never receive it. The correct design keeps the server as the actual **source of truth**: a push (visible or silent) is only a hint that nudges the app to sync sooner, never the transport for the real data. Any feature the user depends on needs a fallback that doesn't rely on the push arriving, such as syncing on every foreground launch.",
    keyPoints: [
      "APNs delivery is best-effort — can be delayed, coalesced, or dropped",
      "Never assume a sent push means the device received it",
      "Push is a wake-up hint, not the data transport itself",
      "Always keep a non-push fallback (e.g. sync on foreground) for correctness",
    ],
    explanation:
      "A strong answer states best-effort delivery plainly and names the concrete fallback (sync on foreground) rather than just saying 'it might fail'.",
  },
  {
    id: "push-token-rotation-senior",
    type: "mcq",
    prompt: "A backend keeps sending pushes to a device token for a user who uninstalled the app eight months ago. What's the correct long-term handling?",
    options: [
      "APNs reports invalid/expired tokens back to the sender, and the backend should listen for that signal and prune the dead token rather than retrying forever",
      "Keep retrying indefinitely — APNs queues undelivered pushes for up to 30 days and delivers them automatically once the device reinstalls the app and registers again",
      "Device tokens never expire or become invalid once issued, so the backend can safely continue sending to any token it has stored",
      "Ask the user to manually delete their old token from Settings, then re-register by reinstalling the app to obtain a valid new token",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "APNs explicitly signals when a token is no longer valid (uninstall, reinstall producing a new token, etc). A production backend needs to consume that feedback and stop sending to dead tokens — both for correctness and to avoid wasting send volume.",
  },
  {
    id: "push-payload-size-senior",
    type: "predict",
    prompt: "Trick question: can you put a full 10 KB chat message body directly inside the push payload's `aps.alert` so the notification banner shows the complete text?",
    code: `// aps.alert payload has a strict size limit (a few KB per push)`,
    options: [
      "No — the payload is capped at a small size meant for display text; real content should be fetched from the server after the tap or during sync, not embedded in the push",
      "Yes — APNs payloads have no enforced size limit at all, so embedding the complete message body is a recommended pattern for offline support and reduced server round trips",
      "Yes, but only for silent pushes, because the OS routes silent-push payloads through a separate higher-capacity APNs channel",
      "No — alert payloads can only contain a single emoji character because APNs encodes the alert field as a two-byte Unicode scalar",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The push payload is small by design — it's meant to carry display text and light metadata (like an ID to look up), not serve as a data-transport channel. Oversized or rejected payloads are a common real-world APNs failure mode.",
  },
];

export default quiz;
