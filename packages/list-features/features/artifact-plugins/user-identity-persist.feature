@platform
@artifact-plugins
@capability:user-identity
@todo
Feature: Persist user identity across reloads
  A User's identity survives artifact reloads when a storage plugin is active —
  they are not assigned a new generated identity every time the artifact opens.

  @happy-path @smoke
  Scenario: An edited pseudo is preserved after the artifact is reloaded
    Given an artifact with the user plugin enabled
    When I set my pseudo to "FrostyCat42"
    And I reload the list
    Then the user pseudo should be "FrostyCat42"
