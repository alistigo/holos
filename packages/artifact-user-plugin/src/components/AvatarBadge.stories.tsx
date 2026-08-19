import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserProvider } from "../context.js";
import { generateDefaultUser } from "../generate.js";
import { AvatarBadge } from "./AvatarBadge.js";

const mockUser = generateDefaultUser();

const meta: Meta<typeof AvatarBadge> = {
  title: "artifact-user-plugin/AvatarBadge",
  component: AvatarBadge,
  decorators: [
    (Story) => (
      <UserProvider initialUser={mockUser}>
        <Story />
      </UserProvider>
    ),
  ],
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AvatarBadge>;

export const Default: Story = {
  args: { onToggle: () => undefined },
};
