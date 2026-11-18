Feature: Annotate and Send a Draw Comment
  A user can select a region on the host artifact, draw shapes on a transparent overlay,
  add a comment, and send the annotated PNG to Claude via the window.claude API.

  Background:
    Given the draw comment widget is loaded over a host artifact

  @P1
  Scenario: Draw Comment button is visible on load
    When the user views the artifact
    Then the "Draw Comment" button is visible at the top of the artifact

  @P1
  Scenario: Clicking Draw Comment activates crosshair selection mode
    When the user clicks the "Draw Comment" button
    Then a crosshair selection overlay covers the artifact
    And the "Draw Comment" button is disabled while the session is active

  @P1
  Scenario: Drag-selecting a region shows a selection indicator
    Given selection mode is active
    When the user click-drags across a region of the artifact
    Then a rectangular selection indicator is shown over that region

  @P1
  Scenario: Confirming a selection shows the drawing canvas and toolbar
    Given selection mode is active
    When the user confirms a region by releasing the drag
    Then a drawing canvas overlay appears on top of the selected region
    And a drawing toolbar is visible adjacent to the canvas

  @P1
  Scenario: Drawing a rectangle on the canvas keeps underlying content visible
    Given the canvas is active with the rectangle tool selected
    When the user click-drags on the canvas to draw a rectangle
    Then the annotation becomes ready to send
    And the host artifact content remains visible behind the canvas

  @P1
  Scenario: Clicking Send generates PNG and transmits to Claude
    Given the user has drawn at least one shape on the canvas
    And the user has typed the comment "Look at this area"
    When the user clicks the "Send" button
    Then the annotated image appears in the conversation
    And Claude receives the annotation and answers

  @P1
  Scenario: Cancel button in selection overlay dismisses the annotation session
    Given selection mode is active
    When the user clicks the "Cancel selection" button
    Then the selection overlay is dismissed
    And the "Draw Comment" button is re-enabled

  @P1
  Scenario: Cancel button in drawing panel dismisses the annotation session
    Given the drawing phase is active with the canvas visible
    When the user clicks the "Cancel annotation" button in the drawing panel
    Then the drawing canvas and toolbar are dismissed
    And the "Draw Comment" button is re-enabled

  # Guards the harness as much as the widget: the playground keeps the selected
  # artifact in memory only, so a reload that does not re-select it lands on a
  # different artifact — where there is no "Draw Comment" button to re-enable.
  @P1
  Scenario: Reloading the artifact discards an in-progress annotation
    Given the drawing phase is active with the canvas visible
    When the user reloads the artifact
    Then the drawing canvas and toolbar are dismissed
    And the "Draw Comment" button is re-enabled
