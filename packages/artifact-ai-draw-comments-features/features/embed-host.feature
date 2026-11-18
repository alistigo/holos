# The widget's composite PNG is built from the overlay region's own subtree, so it
# carries the drawn shapes but not the host content behind them. No scenario here
# asserts the PNG's pixels for that reason; see this package's README, "Known gap".
Feature: Embed the Draw Comment Widget in a Host Artifact
  A developer can include the ai-draw-comments bundle in their Claude artifact
  to gain draw-comment capability with a single script tag and no extra configuration.

  @P3
  @todo
  Scenario: Draw Comment button appears in a host artifact on load
    Given a host artifact that has included the ai-draw-comments bundle via script tag
    When the host artifact loads
    Then the "Draw Comment" button is visible at the top of the host artifact UI

  @P3
  Scenario: Annotated PNG captures a region of the host artifact
    Given the draw comment widget is loaded over a host artifact
    When the user completes a draw comment cycle selecting a region of the host content
    Then the annotated image appears in the conversation
    And the host artifact content was visible beneath the overlay throughout
