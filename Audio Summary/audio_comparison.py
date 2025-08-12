import os

# Paths to the audio folders
vibration_audio_dir = "audio_vibration/audio"
esc50_audio_dir = "ESC-50-master/audio"

# List all .wav files in each directory
vibration_files = set(f for f in os.listdir(vibration_audio_dir) if f.endswith('.wav'))
esc50_files = set(f for f in os.listdir(esc50_audio_dir) if f.endswith('.wav'))

# Files present in both
common_files = vibration_files & esc50_files

# Files only in vibration
only_in_vibration = vibration_files - esc50_files

# Files only in ESC-50
only_in_esc50 = esc50_files - vibration_files

print(f"Total files in audio_vibration/audio: {len(vibration_files)}")
print(f"Total files in ESC-50-master/audio: {len(esc50_files)}")
print(f"Files present in both: {len(common_files)}")
print(f"Files only in audio_vibration/audio: {len(only_in_vibration)}")
print(f"Files only in ESC-50-master/audio: {len(only_in_esc50)}")

if only_in_vibration:
    print("\nFiles only in audio_vibration/audio:")
    for f in sorted(only_in_vibration):
        print(f)

if only_in_esc50:
    print("\nFiles only in ESC-50-master/audio:")
    for f in sorted(only_in_esc50):
        print(f)