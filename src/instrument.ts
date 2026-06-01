import React from "react";
import * as Sentry from "@sentry/react";
import {
  createRoutesFromChildren, matchRoutes,
  useLocation, useNavigationType,
} from "react-router-dom";

Sentry.init({
  dsn: "https://b0d2bda48c55000365a41169aee16c03@o4511471270363136.ingest.de.sentry.io/4511471307784272",
  environment: import.meta.env.MODE,
  
  sendDefaultPii: true,

  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Tracing
  tracesSampleRate: 1.0, // Adjust lower for production in the future
  tracePropagationTargets: ["localhost", /^https:\/\/yourapi\.io/],

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
