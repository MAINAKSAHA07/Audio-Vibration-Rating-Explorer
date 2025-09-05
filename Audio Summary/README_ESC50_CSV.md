# ESC-50 Format CSV Generator for Audio-Vibration Dataset

This script generates CSV files for the `audio_vibration` folder following the ESC-50 dataset format.

## 📁 File Structure

The script processes files from:
- `audio_vibration/audio/` - Original audio files
- `audio_vibration/vibration/` - Generated vibration files

## 🏷️ Naming Convention

### Audio Files
Format: `{FOLD}-{CLIP_ID}-{TAKE}-{TARGET}.wav`
- `{FOLD}` - Cross-validation fold index (1-5)
- `{CLIP_ID}` - Original Freesound clip ID
- `{TAKE}` - Letter disambiguating fragments (A, B, C, etc.)
- `{TARGET}` - Class in numeric format [0, 49]

Example: `1-100038-A-14.wav`

### Vibration Files
Format: `{FOLD}-{CLIP_ID}-{TAKE}-{TARGET}-vib-{TYPE}.wav`
- Same base format as audio files
- `-vib-{TYPE}` - Vibration type (freqshift, hapticgen, percept, pitchmatch)

Example: `1-100038-A-14-vib-freqshift.wav`

## 🎯 ESC-50 Target Classes (0-49)

| Class | Category | Sound |
|-------|----------|-------|
| 0-9 | Animals | dog, rooster, pig, cow, frog, cat, hen, insects, sheep, crow |
| 10-19 | Natural Soundscapes | rain, sea_waves, crackling_fire, crickets, chirping_birds, water_drops, wind, pouring_water, toilet_flush, thunderstorm |
| 20-29 | Human Non-Speech | crying_baby, sneezing, clapping, breathing, coughing, footsteps, laughing, brushing_teeth, snoring, drinking_sipping |
| 30-39 | Interior/Domestic | door_wood_knock, mouse_click, keyboard_typing, door_wood_creaks, can_opening, washing_machine, vacuum_cleaner, clock_alarm, clock_tick, glass_breaking |
| 40-49 | Exterior/Urban | helicopter, chainsaw, siren, car_horn, engine, train, church_bells, airplane, fireworks, hand_saw |

## 📊 Generated CSV Files

### 1. Audio Files CSV
- **Filename**: `audio_vibration_audio_YYYYMMDD_HHMMSS.csv`
- **Columns**: filename, fold, target, category, clip_id, take, file_type, file_path
- **Content**: All audio files from `audio_vibration/audio/`

### 2. Vibration Files CSV
- **Filename**: `audio_vibration_vibration_YYYYMMDD_HHMMSS.csv`
- **Columns**: filename, fold, target, category, clip_id, take, vibration_type, file_type, file_path
- **Content**: All vibration files from `audio_vibration/vibration/`

### 3. Combined CSV (ESC-50 Format)
- **Filename**: `audio_vibration_esc50_format_YYYYMMDD_HHMMSS.csv`
- **Columns**: filename, fold, target, category, clip_id, take, file_type, vibration_type
- **Content**: Both audio and vibration files in ESC-50 format

## 🚀 Usage

```bash
# Activate virtual environment (if using one)
source venv/bin/activate

# Run the script
python3 generate_esc50_csv.py
```

## 📈 Output Statistics

The script provides detailed statistics:

- **Total files processed**: 5000
- **Audio files**: 1000 (20 files per target class)
- **Vibration files**: 4000 (4 types × 1000 audio files)
- **Unique targets**: 50 (ESC-50 classes)
- **Vibration types**: freqshift, hapticgen, percept, pitchmatch

## 📋 CSV Format Example

### Audio File Row
```csv
filename,fold,target,category,clip_id,take,file_type,vibration_type
1-100038-A-14.wav,1,14,chirping_birds,100038,A,audio,
```

### Vibration File Row
```csv
filename,fold,target,category,clip_id,take,file_type,vibration_type
1-100038-A-14-vib-freqshift.wav,1,14,chirping_birds,100038,A,vibration,freqshift
```

## 🔧 Customization

You can modify the script to:
- Add additional columns
- Filter specific target classes
- Include file metadata
- Generate different output formats
- Add validation checks

## 📝 Notes

- The script automatically detects and parses the ESC-50 naming convention
- All 50 ESC-50 target classes are represented (20 files each)
- Vibration files maintain the same target class as their corresponding audio files
- The script handles both single and multiple takes (A, B, C, etc.) per clip
