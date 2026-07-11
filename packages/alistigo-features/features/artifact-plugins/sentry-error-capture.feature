@platform
@artifact-plugins
@capability:plugins
@actor:host
Feature: Sentry plugin captures render errors
  As the Host
  I want the Sentry plugin to observe and report uncaught render errors
  So that developers learn about failures without manual instrumentation

  @happy-path
  Scenario: Sentry plugin initializes when a DSN is configured
    Given the "@alistigo/artifact-sentry-plugin" plugin
    And a non-initialized artifact "list" with plugin configured
    When the artifact initialize
    Then the plugin should be initialized

  @happy-path
  Scenario: An uncaught render error is reported through the plugin
    Given the "@alistigo/artifact-sentry-plugin" plugin
    And an initialized artifact "list" with plugin configured
    When an uncaught render error occurs
    Then the plugin should capture the error

  @edge-case
  Scenario: Sentry plugin is a silent no-op without a DSN
    Given the "@alistigo/artifact-sentry-plugin" plugin
    And an non-initialized artifact "list" with plugin not configured
    When the artifact initialize
    Then the plugin should report itself as not initialized
    And no error should be thrown
