# Learning GitHub Actions: Javascript Hello World

This action prints a greeting message to the log.

## Inputs

## `greetingType`

**Optional** The type of the greeting to provided. Default `"Hello"`.

## Outputs

## `greetingMessage`

The super cool greeting

## Example usage

```yaml
uses: davekpatrick/action-learn-javascript-helloworld@0.1.0
with:
  greetingType: 'Hello'
```