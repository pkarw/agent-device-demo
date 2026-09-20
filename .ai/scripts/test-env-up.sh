#!/bin/sh
# Repository-owned adapter around scripts/android-*.sh; invoked through the provider.
# history: 2026-09-20 Recover only the observed System UI startup ANR; app ANRs fail.
set -eu
exec bash "$(dirname "$0")/agent-device.sh" ensure-installed "$@"
