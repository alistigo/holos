@platform
@artifact-plugins
@capability:plugins
@actor:host
@todo
Feature: PostHog plugin tracks widget display
  As the Host
  I want the PostHog plugin to record a widget_displayed event on first mount
  So that product usage is measurable without coupling core to a specific vendor

  @happy-path
  @smoke
  Scenario: PostHog plugin captures widget_displayed on first mount
    Given an artifact host with the PostHog plugin enabled and an API key configured
    When the host completes its first mount
    Then the host should emit a "widget:displayed" event with the locale, storage type, and version
    And the PostHog plugin should capture a "widget_displayed" event with those properties

  @edge-case
  Scenario: PostHog plugin does not double-report on remount
    Given an artifact host with the PostHog plugin enabled and an API key configured
    And the host has already completed its first mount
    When the host is mounted again on the same container
    Then the host should not emit a second "widget:displayed" event

  @edge-case
  Scenario: PostHog plugin is a silent no-op without an API key
    Given an artifact host with the PostHog plugin enabled but no API key configured
    When the host completes its first mount
    Then the PostHog plugin should report itself as not initialized
    And the PostHog plugin should not capture any event
