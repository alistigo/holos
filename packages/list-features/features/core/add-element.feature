@m1
@core
@capability:element
@actor:user
Feature: Add an element to a list
  As a User
  I want to add a text element to the list
  So that I can capture something into it

  @happy-path
  @smoke
  Scenario: Add to an empty list
    Given an empty list
    When I add "Buy bread"
    Then the list should be:
      | Buy bread |

  @happy-path
  Scenario: Add to a populated list
    Given a list:
      | Buy bread |
    When I add "Call mom"
    Then the list should be:
      | Buy bread |
      | Call mom  |

  Scenario: Add an element with the same text as an existing one
    Given a list:
      | Buy bread |
    When I add "Buy bread"
    Then the list should be:
      | Buy bread |
      | Buy bread |
