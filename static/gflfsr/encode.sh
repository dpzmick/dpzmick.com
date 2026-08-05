#!/bin/sh
# The generators write wav (stdlib only, no audio deps), but wav is far too big
# to ship: ~7.3 MiB for the four demos. Run this after them to get the ogg files
# the post actually references. Stereo costs almost nothing here since both
# channels are identical (they're stereo only because Firefox played a mono file
# out of the left channel alone).
#
# Opus needs Safari 17+ (2023); every other browser has had it for years.
# .ogg rather than .opus because static hosts reliably map .ogg to audio/ogg.
set -e
cd "$(dirname "$0")"
for f in *.wav; do
    ffmpeg -v error -y -i "$f" -codec:a libopus -b:a 64k "${f%.wav}.ogg"
    rm "$f"
done
