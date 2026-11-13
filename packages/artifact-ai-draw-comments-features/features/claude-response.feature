Feature: View Claude Response to a Draw Comment
  After sending a draw comment, Claude's response appears inline below the annotation
  without navigating away or reloading the artifact.

  @P2
  Scenario: Claude response appears below the annotation after sending
    Given a draw comment was just sent via window.claude.complete
    When Claude responds via the window.claude API
    Then Claude's response text appears below the annotation display area
    And the page does not reload

  @P2
  Scenario: Annotation PNG and comment remain visible above the response
    Given Claude's response is displayed below the annotation
    When the user reads the response
    Then the annotated PNG is still visible above the response
    And the original comment is still visible above the response

  @P2
  Scenario: Draw Comment button re-activates after Claude responds
    Given Claude's response is displayed below the annotation
    When the user looks at the top of the artifact
    Then the "Draw Comment" button is active and can be clicked to start a new annotation

