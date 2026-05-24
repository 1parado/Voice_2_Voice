import sys
import os
import tempfile
import winsound

if sys.platform == 'win32':
    import msvcrt
    msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)


def main():
    data = sys.stdin.buffer.read()
    if not data:
        print("No audio data on stdin", file=sys.stderr)
        sys.exit(1)

    fd, tmp = tempfile.mkstemp(suffix='.wav')
    try:
        os.write(fd, data)
        os.close(fd)
        winsound.PlaySound(tmp, winsound.SND_FILENAME)
    finally:
        os.unlink(tmp)


if __name__ == '__main__':
    main()
