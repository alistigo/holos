@platform
@artifact-plugins
@capability:user-identity
@todo
Feature: Display user identity
  A User always has a visible identity (pseudo and avatar) in the artifact when the
  user plugin is enabled — whether the identity is freshly generated or loaded from
  storage.

  @happy-path @smoke
  Scenario: A user identity is always visible when the artifact is fully loaded
    Given an artifact with the user plugin enabled
    When the artifact is fully loaded
    Then a user identity should be visible
