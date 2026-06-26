@m1
@core
@capability:list
@capability:loading
Feature: Display a list
  As a User opening the list
  I want to see all elements of the list
  So that I know what is in it

  @happy-path
  @smoke
  Scenario: An empty list shows an empty state
    Given an empty list
    When I open the list
    Then the list should be empty
    And an empty-state message should be visible

  @happy-path
  Scenario: A populated list shows every element
    Given a list:
      | Buy bread |
      | Call mom  |
    When I open the list
    Then the list should be:
      | Buy bread |
      | Call mom  |

  Scenario: Duplicate text appears as separate elements
    Given a list:
      | Buy bread |
      | Call mom  |
      | Buy bread |
    When I open the list
    Then the list should be:
      | Buy bread |
      | Call mom  |
      | Buy bread |
