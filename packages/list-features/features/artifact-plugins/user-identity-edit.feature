@platform
@artifact-plugins
@capability:user-identity
Feature: Edit user identity
  A User can update their pseudo through the user editor, and the change is
  reflected immediately in the artifact — no explicit save action required.

  @happy-path
  Scenario: Editing the pseudo is reflected immediately in the artifact
    Given an artifact with the user plugin enabled
    When I open the user editor
    And I set my pseudo to "FrostyCat42"
    Then the user pseudo should be "FrostyCat42"
