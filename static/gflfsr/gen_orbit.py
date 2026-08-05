#!/usr/bin/env python3
"""Audio for the two ways of reading a Galois orbit. Run from this directory.

Writes three files:
  orbit_demo.wav        one kick walking the orbit, an element per bar
  orbit_stack_demo.wav  kick/snare/hihat, each entering the orbit elsewhere
  lanes_demo.wav        the transpose: one instrument per bit position

The first sounds fine on its own, the second doesn't add up to a rhythm
section, and the third is the one the post is actually about.

The orbits are hardcoded rather than computed: Tidal could play them, but
getting a wav file back out of Tidal is a pain.

These wav generator scripts are fully AI generated.
"""
import sys

# this whole directory is published verbatim, so don't leave __pycache__ in it
sys.dont_write_bytecode = True

from gen_gates import (HIHAT_SAMPLE, KICK_SAMPLE, SNARE_SAMPLE, SR, STEP_DUR,
                       load_sample, write_wav)

ORBIT = ["001", "010", "100", "101", "111", "011", "110"]


def rotate(orbit, k):
    """Starting at a different element of the same orbit is just a rotation."""
    return orbit[k:] + orbit[:k]


def lanes(orbit):
    """Each bit position, read down the orbit."""
    return ["".join(el[i] for el in orbit) for i in range(len(orbit[0]))]


def render(pattern, hit, total, loops):
    buf = [0.0] * total
    step_samples = int(SR * STEP_DUR)
    for loop in range(loops):
        for i, b in enumerate(pattern):
            if b != "1":
                continue
            start = (loop * len(pattern) + i) * step_samples
            for j, v in enumerate(hit):
                if start + j < total:
                    buf[start + j] += v
    return buf


def mix(parts, hits, loops):
    total = int(SR * STEP_DUR) * len(parts[0]) * loops + max(map(len, hits))
    bufs = [render(p, h, total, loops) for p, h in zip(parts, hits)]
    return [sum(vals) for vals in zip(*bufs)]


def main():
    hits = [load_sample(p) for p in (KICK_SAMPLE, SNARE_SAMPLE, HIHAT_SAMPLE)]

    # elements as patterns: one element per bar, 2 trips around the orbit
    write_wav(mix(["".join(ORBIT)], hits[:1], 2), "orbit_demo.wav")
    write_wav(mix(["".join(ORBIT), "".join(rotate(ORBIT, 2)),
                   "".join(rotate(ORBIT, 4))], hits, 2), "orbit_stack_demo.wav")

    # lanes as patterns: the whole orbit is one 7 step pattern per instrument
    write_wav(mix(lanes(ORBIT), hits, 6), "lanes_demo.wav")


if __name__ == "__main__":
    main()
