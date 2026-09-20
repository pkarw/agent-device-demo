#!/bin/sh
# Repository-owned adapter around scripts/android-*.sh; invoked through the provider.
set -eu
exec bash "$(dirname "$0")/agent-device.sh" ensure-installed "$@"
