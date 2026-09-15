import React from "react";
import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
  decorators: [
    (Story, context) => {
      if (context.tags.includes("playground")) {
        return (
          <div
            id="host-root"
            style={{ height: "100vh", width: "100%", overflow: "hidden", margin: 0, padding: 0 }}
          >
            <Story />
          </div>
        );
      }
      return <Story />;
    },
  ],
};

export default preview;
