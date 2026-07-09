@platform
@artifact-plugins
@capability:plugins
@actor:host
@todo
Feature: Sentry plugin captures render errors
  As the Host
  I want the Sentry plugin to observe and report uncaught render errors
  So that developers learn about failures without manual instrumentation

  @happy-path
  Scenario: Sentry plugin initializes when a DSN is configured
    Given an artifact host with the Sentry plugin enabled and a DSN configured
    When the host boots
    Then the Sentry plugin should report itself as initialized

  @happy-path
  Scenario: An uncaught render error is reported through the plugin
    Given an artifact host with the Sentry plugin enabled and a DSN configured
    And the host has completed booting
    When an uncaught render error occurs
    Then the host should emit an "error:uncaught" event
    And the Sentry plugin should capture the error

  @edge-case
  Scenario: Sentry plugin is a silent no-op without a DSN
    Given an artifact host with the Sentry plugin enabled but no DSN configured
    When the host boots
    Then the Sentry plugin should report itself as not initialized
    And no error should be thrown

  @edge-case
  Scenario: A render error is not reported when the Sentry plugin is not enabled
    Given an artifact host with no plugins enabled
    And the host has completed booting
    When an uncaught render error occurs
    Then the host should emit an "error:uncaught" event
    And no plugin should capture the error
