# GitHub Actions: Release Version

This GitHub Action used to bump the version of a release.

## Inputs

## `apiToken`

Required GitHub API token

## Outputs

## `versionTag`

The release version to use

## Example usage

```yaml
uses: davekpatrick/action-release-version@0.1.0
with:
  apiToken: ${{ secret.GITHUB_TOKEN }}
```