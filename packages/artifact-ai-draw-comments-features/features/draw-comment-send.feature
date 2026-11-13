Feature: Annotate and Send a Draw Comment
  A user can select a region on the artifact, draw shapes on a transparent overlay,
  add a comment, and send the annotated PNG to Claude via the window.claude API.

  @P1
  Scenario: Draw Comment button is visible on load
    Given the artifact is loaded with the Draw Comment widget mounted
    When the user views the artifact
    Then the "Draw Comment" button is visible at the top of the artifact

  @P1
  Scenario: Clicking Draw Comment activates crosshair selection mode
    Given the artifact is loaded with the Draw Comment button visible
    When the user clicks the "Draw Comment" button
    Then the cursor changes to a crosshair selection mode

  @P1
  Scenario: Drag-selecting a region shows a selection indicator
    Given selection mode is active
    When the user click-drags across a region of the artifact
    Then a rectangular selection indicator is shown over that region

  @P1
  Scenario: Confirming a selection shows the drawing canvas and toolbar
    Given a region has been selected by drag
    When the selection is confirmed
    Then a transparent drawing canvas overlay appears on top of the selected region
    And a drawing toolbar is visible adjacent to the canvas

  @P1
  Scenario: Drawing a rectangle on the canvas keeps underlying content visible
    Given the canvas is active with the rectangle tool selected
    When the user click-drags on the canvas to draw a rectangle
    Then a rectangle shape is drawn on the overlay
    And the underlying artifact content remains fully visible through the canvas

  @P1
  Scenario: Clicking Send generates PNG and transmits to Claude
    Given the user has drawn at least one shape on the canvas
    When the user clicks the "Send" button
    Then a PNG image is generated combining the region capture and the drawn shapes
    And the PNG and comment are sent to Claude via window.claude.complete
    And the drawing canvas switches to read-only mode

