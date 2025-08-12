#!/usr/bin/env python3
"""
Generate ESC-50 format CSV for audio_vibration folder
Follows the naming convention: {FOLD}-{CLIP_ID}-{TAKE}-{TARGET}.wav
"""

import os
import csv
from datetime import datetime
from collections import Counter

def generate_esc50_csv():
    """Generate ESC-50 format CSV for audio_vibration folder"""
    
    audio_dir = 'audio_vibration/audio'
    vibration_dir = 'audio_vibration/vibration'
    
    # ESC-50 target class mapping (0-49)
    target_classes = {
        0: 'dog', 1: 'rooster', 2: 'pig', 3: 'cow', 4: 'frog',
        5: 'cat', 6: 'hen', 7: 'insects', 8: 'sheep', 9: 'crow',
        10: 'rain', 11: 'sea_waves', 12: 'crackling_fire', 13: 'crickets',
        14: 'chirping_birds', 15: 'water_drops', 16: 'wind', 17: 'pouring_water',
        18: 'toilet_flush', 19: 'thunderstorm', 20: 'crying_baby', 21: 'sneezing',
        22: 'clapping', 23: 'breathing', 24: 'coughing', 25: 'footsteps',
        26: 'laughing', 27: 'brushing_teeth', 28: 'snoring', 29: 'drinking_sipping',
        30: 'door_wood_knock', 31: 'mouse_click', 32: 'keyboard_typing',
        33: 'door_wood_creaks', 34: 'can_opening', 35: 'washing_machine',
        36: 'vacuum_cleaner', 37: 'clock_alarm', 38: 'clock_tick', 39: 'glass_breaking',
        40: 'helicopter', 41: 'chainsaw', 42: 'siren', 43: 'car_horn', 44: 'engine',
        45: 'train', 46: 'church_bells', 47: 'airplane', 48: 'fireworks', 49: 'hand_saw'
    }
    
    print("🔍 Processing audio_vibration folder...")
    
    # Process audio files
    audio_files = []
    if os.path.exists(audio_dir):
        print(f"📁 Processing {len(os.listdir(audio_dir))} files in {audio_dir}")
        for filename in os.listdir(audio_dir):
            if filename.endswith('.wav'):
                # Parse filename: 1-100038-A-14.wav
                parts = filename.replace('.wav', '').split('-')
                if len(parts) >= 4:
                    fold = parts[0]
                    clip_id = parts[1]
                    take = parts[2]
                    target = int(parts[3])
                    
                    audio_files.append({
                        'filename': filename,
                        'fold': fold,
                        'target': target,
                        'category': target_classes.get(target, 'unknown'),
                        'clip_id': clip_id,
                        'take': take,
                        'file_type': 'audio',
                        'file_path': os.path.join(audio_dir, filename)
                    })
    
    # Process vibration files
    vibration_files = []
    if os.path.exists(vibration_dir):
        print(f"📁 Processing {len(os.listdir(vibration_dir))} files in {vibration_dir}")
        for filename in os.listdir(vibration_dir):
            if filename.endswith('.wav'):
                # Parse filename: 1-100038-A-14-vib-freqshift.wav
                if '-vib-' in filename:
                    base_name = filename.split('-vib-')[0]
                    vib_type = filename.split('-vib-')[1].replace('.wav', '')
                    
                    parts = base_name.split('-')
                    if len(parts) >= 4:
                        fold = parts[0]
                        clip_id = parts[1]
                        take = parts[2]
                        target = int(parts[3])
                        
                        vibration_files.append({
                            'filename': filename,
                            'fold': fold,
                            'target': target,
                            'category': target_classes.get(target, 'unknown'),
                            'clip_id': clip_id,
                            'take': take,
                            'vibration_type': vib_type,
                            'file_type': 'vibration',
                            'file_path': os.path.join(vibration_dir, filename)
                        })
    
    # Generate CSV files
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Audio files CSV
    if audio_files:
        audio_csv = f'audio_vibration_audio_{timestamp}.csv'
        with open(audio_csv, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['filename', 'fold', 'target', 'category', 'clip_id', 'take', 'file_type', 'file_path'])
            writer.writeheader()
            writer.writerows(audio_files)
        print(f'✅ Audio CSV generated: {audio_csv}')
        print(f'   📊 {len(audio_files)} audio files')
    
    # Vibration files CSV
    if vibration_files:
        vib_csv = f'audio_vibration_vibration_{timestamp}.csv'
        with open(vib_csv, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['filename', 'fold', 'target', 'category', 'clip_id', 'take', 'vibration_type', 'file_type', 'file_path'])
            writer.writeheader()
            writer.writerows(vibration_files)
        print(f'✅ Vibration CSV generated: {vib_csv}')
        print(f'   📊 {len(vibration_files)} vibration files')
    
    # Combined CSV (ESC-50 format)
    combined_csv = f'audio_vibration_esc50_format_{timestamp}.csv'
    with open(combined_csv, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'fold', 'target', 'category', 'clip_id', 'take', 'file_type', 'vibration_type'])
        writer.writeheader()
        
        # Add audio files
        for audio in audio_files:
            writer.writerow({
                'filename': audio['filename'],
                'fold': audio['fold'],
                'target': audio['target'],
                'category': audio['category'],
                'clip_id': audio['clip_id'],
                'take': audio['take'],
                'file_type': audio['file_type'],
                'vibration_type': ''
            })
        
        # Add vibration files
        for vib in vibration_files:
            writer.writerow({
                'filename': vib['filename'],
                'fold': vib['fold'],
                'target': vib['target'],
                'category': vib['category'],
                'clip_id': vib['clip_id'],
                'take': vib['take'],
                'file_type': vib['file_type'],
                'vibration_type': vib['vibration_type']
            })
    
    print(f'✅ Combined CSV generated: {combined_csv}')
    print(f'   📊 Total files: {len(audio_files) + len(vibration_files)}')
    
    # Summary statistics
    print(f'\n📈 SUMMARY STATISTICS:')
    print(f'   🎵 Audio files: {len(audio_files)}')
    print(f'   📳 Vibration files: {len(vibration_files)}')
    print(f'   🎯 Unique targets: {len(set(f["target"] for f in audio_files))}')
    print(f'   📁 Unique categories: {len(set(f["category"] for f in audio_files))}')
    
    # Target distribution
    target_counts = Counter(f['target'] for f in audio_files)
    
    print(f'\n🎯 TARGET CLASS DISTRIBUTION:')
    for target in sorted(target_counts.keys()):
        category = target_classes.get(target, 'unknown')
        count = target_counts[target]
        print(f'   {target:2d} ({category:20s}): {count:3d} files')
    
    # Vibration type distribution
    vib_type_counts = Counter(f['vibration_type'] for f in vibration_files)
    print(f'\n�� VIBRATION TYPE DISTRIBUTION:')
    for vib_type, count in vib_type_counts.items():
        print(f'   {vib_type:12s}: {count:4d} files')
    
    return {
        'audio_csv': audio_csv if audio_files else None,
        'vibration_csv': vib_csv if vibration_files else None,
        'combined_csv': combined_csv,
        'audio_count': len(audio_files),
        'vibration_count': len(vibration_files)
    }

if __name__ == '__main__':
    generate_esc50_csv()
