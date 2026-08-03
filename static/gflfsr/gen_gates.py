#!/usr/bin/env python3
"""Synthesize the "boots and cats" gate-sequence demo (kick/snare/hihat) as a
wav file, using real drum samples from the Dirt-Samples (Tidal/SuperDirt)
pack. Stdlib only (struct), no audio deps. Re-run if the pattern changes.

Tidal could play these patterns, but getting a wav file back out of it is a
pain, so the sequences are just hardcoded here.

These wav generator scripts are fully AI generated.
"""
import struct
import wave

SR = 44100
STEP_DUR = 0.28  # seconds per gate/step
LOOPS = 8

KICK = "1000"
SNARE = "0010"
HIHAT = "0101"

DIRT_SAMPLES = (
    "/Users/dpzmick/Library/Application Support/SuperCollider/"
    "downloaded-quarks/Dirt-Samples"
)
KICK_SAMPLE = f"{DIRT_SAMPLES}/drum/000_drum1.wav"
SNARE_SAMPLE = f"{DIRT_SAMPLES}/drum/001_drum2.wav"
HIHAT_SAMPLE = f"{DIRT_SAMPLES}/drum/002_drum3.wav"


def load_sample(path, target_sr=SR):
    """Read a wav file (PCM16 or IEEE-float, mono or stereo) into a mono
    list of floats in [-1, 1]. No resampling: assumes target_sr matches."""
    with open(path, "rb") as f:
        data = f.read()
    assert data[0:4] == b"RIFF" and data[8:12] == b"WAVE"
    pos = 12
    fmt = None
    pcm = None
    while pos < len(data):
        cid = data[pos:pos + 4]
        size = struct.unpack("<I", data[pos + 4:pos + 8])[0]
        body = data[pos + 8:pos + 8 + size]
        if cid == b"fmt ":
            fmt = struct.unpack("<HHIIHH", body[:16])
        elif cid == b"data":
            pcm = body
        pos += 8 + size + (size & 1)

    tag, channels, sr, _, _, bits = fmt
    assert abs(sr - target_sr) <= 4, f"{path} is {sr}Hz, expected ~{target_sr}Hz"

    if tag == 1 and bits == 16:
        n = len(pcm) // 2
        vals = struct.unpack("<%dh" % n, pcm)
        vals = [v / 32768.0 for v in vals]
    elif tag == 3 and bits == 32:
        n = len(pcm) // 4
        vals = struct.unpack("<%df" % n, pcm)
    else:
        raise ValueError(f"unsupported format tag={tag} bits={bits}")

    if channels == 1:
        return list(vals)
    frames = len(vals) // channels
    return [
        sum(vals[i * channels:(i + 1) * channels]) / channels
        for i in range(frames)
    ]


def render(pattern, hit, total_samples):
    buf = [0.0] * total_samples
    step_samples = int(SR * STEP_DUR)
    for loop in range(LOOPS):
        for i, b in enumerate(pattern):
            if b != "1":
                continue
            start = loop * len(pattern) * step_samples + i * step_samples
            for j, v in enumerate(hit):
                if start + j < total_samples:
                    buf[start + j] += v
    return buf


def write_wav(mixed, path):
    # trim trailing silence (the padding exists only so the final hit's decay
    # tail isn't cut off, not to leave dead air at the end)
    threshold = 1e-3
    last = 0
    for i in range(len(mixed) - 1, -1, -1):
        if abs(mixed[i]) > threshold:
            last = i
            break
    mixed = mixed[:last + 1]

    # short fade-out so the trim doesn't produce an audible click
    fade_samples = min(len(mixed), int(SR * 0.01))
    for i in range(fade_samples):
        mixed[len(mixed) - 1 - i] *= i / fade_samples

    peak = max(1e-9, max(abs(x) for x in mixed))
    scale = 0.9 / peak
    samples = [int(max(-1.0, min(1.0, x * scale)) * 32767) for x in mixed]

    # write explicit stereo (mono duplicated to both channels) rather than
    # relying on the player to upmix a mono file — that upmixing turned out
    # to be inconsistent in practice
    stereo = [0] * (len(samples) * 2)
    stereo[0::2] = samples
    stereo[1::2] = samples

    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(struct.pack("<%dh" % len(stereo), *stereo))


def main():
    kick_hit = load_sample(KICK_SAMPLE)
    snare_hit = load_sample(SNARE_SAMPLE)
    hihat_hit = load_sample(HIHAT_SAMPLE)

    total_samples = int(SR * STEP_DUR * len(KICK) * LOOPS) + max(
        len(kick_hit), len(snare_hit), len(hihat_hit)
    )
    kick_buf = render(KICK, kick_hit, total_samples)
    snare_buf = render(SNARE, snare_hit, total_samples)
    hihat_buf = render(HIHAT, hihat_hit, total_samples)
    mixed = [k + s + h for k, s, h in zip(kick_buf, snare_buf, hihat_buf)]

    write_wav(mixed, "gates_demo.wav")


if __name__ == "__main__":
    main()
