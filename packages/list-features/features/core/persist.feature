@m1
@core
@capability:persistence
Feature: Persist a list across reloads
  As a User
  I want my list to survive a reload
  So that I do not lose its content when the list is reopened

  @happy-path
  @smoke
  Scenario: An added element is still there after a reload
    Given an empty list
    When I add "Buy bread"
    And I reload the list
    Then the list should be:
      | Buy bread |

  @happy-path
  @smoke
  Scenario: A deleted element stays deleted after a reload
    Given a list:
      | Buy bread |
      | Call mom  |
    When I delete "Buy bread"
    And I reload the list
    Then the list should be:
      | Call mom |
