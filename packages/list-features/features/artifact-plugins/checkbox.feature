@platform
@artifact-plugins
@capability:checkbox
Feature: Checkbox Plugin
  A User can mark list elements as checked or unchecked when the checkbox
  plugin is active. The checked state persists across artifact reloads and
  checking one element does not affect others.

  Background:
    Given the checkbox plugin is active
    And a list:
      | Buy bread   |
      | Call mom    |
      | Email Alice |

  @happy-path
  @smoke
  @actor:user
  Scenario: Check an element and reload — stays checked
    When I check "Buy bread"
    And I reload the artifact
    Then "Buy bread" is checked
    And "Call mom" is unchecked
    And "Email Alice" is unchecked

  @happy-path
  @actor:user
  Scenario: Uncheck a checked element and reload — stays unchecked
    Given "Buy bread" is checked
    When I uncheck "Buy bread"
    And I reload the artifact
    Then "Buy bread" is unchecked

  @happy-path
  @actor:user
  Scenario: Checking one element does not affect others
    When I check "Buy bread"
    Then "Call mom" is unchecked
    And "Email Alice" is unchecked

  @happy-path
  @actor:user
  Scenario: All elements start unchecked on a new list
    When the artifact is fully loaded
    Then each element is unchecked
