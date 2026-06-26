@m1
@core
@capability:element
@actor:user
Feature: Delete an element from a list
  As a User
  I want to remove an element
  So that the list reflects only what I still care about

  @happy-path
  @smoke
  Scenario: Delete the only element of a list
    Given a list:
      | Buy bread |
    When I delete "Buy bread"
    Then the list should be empty

  @happy-path
  Scenario: Delete from a populated list
    Given a list:
      | Buy bread |
      | Call mom  |
    When I delete "Buy bread"
    Then the list should be:
      | Call mom |

  Scenario: Delete one occurrence of a duplicate
    Given a list:
      | Buy bread |
      | Call mom  |
      | Buy bread |
    When I delete row 1
    Then the list should be:
      | Call mom  |
      | Buy bread |
