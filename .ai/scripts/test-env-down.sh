#!/bin/sh
set -eu
exec bash "$(dirname "$0")/agent-device.sh" close
