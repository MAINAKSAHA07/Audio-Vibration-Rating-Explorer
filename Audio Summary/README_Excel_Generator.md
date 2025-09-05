# Audio-Vibration Excel Generator

This project contains scripts to generate comprehensive Excel sheets for the audio_vibration folder, providing detailed analysis and categorization of audio and vibration files.

## Files Generated

1. **`audio_vibration_inventory_YYYYMMDD_HHMMSS.xlsx`** - Comprehensive inventory with multiple sheets
2. **`audio_vibration_summary_YYYYMMDD_HHMMSS.xlsx`** - Simplified summary with key statistics

## Scripts

### 1. `generate_audio_vibration_excel.py`
**Comprehensive Excel Generator**

This script creates a detailed Excel file with multiple sheets:

- **All Files**: Complete list of all files with parsed information
- **Summary**: Key statistics and metrics
- **Class Statistics**: Breakdown by class (1-5)
- **Vibration Types**: Analysis of vibration file types
- **Audio Files Only**: Filtered view of audio files
- **Vibration Files Only**: Filtered view of vibration files
- **Files with Both Versions**: Files that have both audio and vibration versions

### 2. `generate_simple_excel.py`
**Simplified Excel Generator**

This script creates a cleaner Excel file with essential information:

- **Summary**: Key statistics
- **Class Breakdown**: Files per class
- **Vibration Types**: Breakdown by vibration type
- **All Files**: Complete file list

## File Naming Convention

The scripts parse files based on the following naming patterns:

### Audio Files
Format: `{class}-{id}-{variant}-{rating}.wav`
Example: `1-100038-A-14.wav`

### Vibration Files
Format: `{class}-{id}-{variant}-{rating}-vib-{type}.wav`
Example: `1-100038-A-14-vib-freqshift.wav`

## Parsed Information

For each file, the following information is extracted:

- **filename**: Original filename
- **file_type**: 'audio' or 'vibration'
- **class**: Class number (1-5)
- **file_id**: Unique file identifier
- **variant**: File variant (A, B, C, etc.)
- **rating**: Rating value
- **vibration_type**: Type of vibration (freqshift, hapticgen, percept, pitchmatch)
- **base_filename**: Corresponding audio file name
- **file_size_mb**: File size in MB
- **file_path**: Full file path

## Usage

### Prerequisites
```bash
# Install required packages
pip install pandas openpyxl
```

### Running the Scripts
```bash
# Activate virtual environment (if using one)
source venv/bin/activate

# Run comprehensive generator
python3 generate_audio_vibration_excel.py

# Run simplified generator
python3 generate_simple_excel.py
```

## Output Statistics

Based on the current dataset:

- **Total Files**: 5,000
- **Audio Files**: 1,000
- **Vibration Files**: 4,000
- **Classes**: 1, 2, 3, 4, 5
- **Vibration Types**: freqshift, hapticgen, percept, pitchmatch
- **Unique Base Files**: 1,000

## Vibration Types Explained

- **freqshift**: Frequency-shifted vibration
- **hapticgen**: Haptic-generated vibration
- **percept**: Perceptual vibration
- **pitchmatch**: Pitch-matched vibration

## File Structure

```
audio_vibration/
├── audio/          # Original audio files
│   ├── 1-100038-A-14.wav
│   ├── 1-100210-A-36.wav
│   └── ...
└── vibration/      # Generated vibration files
    ├── 1-100038-A-14-vib-freqshift.wav
    ├── 1-100038-A-14-vib-hapticgen.wav
    └── ...
```

## Customization

You can modify the scripts to:

1. Add additional file attributes
2. Change the output format
3. Add filtering options
4. Include file metadata analysis
5. Generate charts and visualizations

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError**: Install required packages
   ```bash
   pip install pandas openpyxl
   ```

2. **Permission Errors**: Ensure write permissions in the directory

3. **File Not Found**: Verify the audio_vibration folder structure

### Dependencies

- Python 3.7+
- pandas >= 1.5.0
- openpyxl >= 3.0.0

## Generated Files

The scripts will create timestamped Excel files in the current directory:

- `audio_vibration_inventory_20250806_165519.xlsx`
- `audio_vibration_summary_20250806_165553.xlsx`

These files contain comprehensive analysis of your audio-vibration dataset with proper labeling and categorization. 