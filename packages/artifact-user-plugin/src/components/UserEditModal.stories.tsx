import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserProvider } from "../context.js";
import { generateDefaultUser } from "../generate.js";
import { UserEditModal } from "./UserEditModal.js";

const mockUser = generateDefaultUser();

const meta: Meta<typeof UserEditModal> = {
  title: "artifact-user-plugin/UserEditModal",
  component: UserEditModal,
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
type Story = StoryObj<typeof UserEditModal>;

export const Default: Story = {
  args: { onClose: () => undefined },
};
