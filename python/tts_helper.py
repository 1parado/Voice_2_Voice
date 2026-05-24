import sys
import os
import io
import wave
import numpy as np

if sys.platform == 'win32':
    import msvcrt
    msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)


def main():
    if len(sys.argv) < 3:
        print("Usage: tts_helper.py <lang> <voice>", file=sys.stderr)
        sys.exit(1)

    lang = sys.argv[1]
    voice = sys.argv[2]

    text = sys.stdin.buffer.read().decode('utf-8').strip()
    if not text:
        print("No text received on stdin", file=sys.stderr)
        sys.exit(1)

    from supertonic import TTS

    tts = TTS(auto_download=True)
    style = tts.get_voice_style(voice_name=voice)
    wav_data, duration = tts.synthesize(text=text, lang=lang, voice_style=style)

    sample_rate = tts.sample_rate
    samples = wav_data[0, :int(sample_rate * duration[0].item())]

    pcm = np.clip(samples, -1.0, 1.0)
    pcm = (pcm * 32767).astype(np.int16)

    buf = io.BytesIO()
    writer = wave.open(buf, 'wb')
    writer.setnchannels(1)
    writer.setsampwidth(2)
    writer.setframerate(sample_rate)
    writer.writeframes(pcm.tobytes())
    writer.close()
    sys.stdout.buffer.write(buf.getvalue())
    sys.stdout.buffer.flush()


if __name__ == '__main__':
    main()
