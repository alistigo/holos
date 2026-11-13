Feature: Embed the Draw Comment Widget in a Host Artifact
  A developer can include the ai-draw-comments bundle in their Claude artifact
  to gain draw-comment capability with a single script tag and no extra configuration.

  @P3 @jsdom-required
  Scenario: Draw Comment button appears in a host artifact on load
    Given a host artifact that has included the ai-draw-comments bundle via script tag
    When the host artifact loads
    Then the "Draw Comment" button is visible at the top of the host artifact UI

  @P3
  Scenario: Annotated PNG captures the host artifact content
    Given the draw comment widget is embedded in a host artifact
    When the user completes a draw comment cycle selecting a region of the host content
    Then the annotated PNG captures the host artifact content visible through the transparent overlay

