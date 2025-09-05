import os
import pandas as pd
import re
from datetime import datetime

def parse_filename(filename):
    """Parse filename to extract components"""
    # Remove .wav extension
    name = filename.replace('.wav', '')
    
    # Check if it's a vibration file
    if '-vib-' in name:
        # Format: class-id-variant-rating-vib-type
        parts = name.split('-vib-')
        base_part = parts[0]
        vib_type = parts[1]
        
        # Parse base part: class-id-variant-rating
        base_parts = base_part.split('-')
        if len(base_parts) >= 4:
            class_num = base_parts[0]
            file_id = base_parts[1]
            variant = base_parts[2]
            rating = base_parts[3]
            
            return {
                'filename': filename,
                'class': class_num,
                'file_id': file_id,
                'variant': variant,
                'rating': rating,
                'file_type': 'vibration',
                'vibration_type': vib_type,
                'base_filename': f"{class_num}-{file_id}-{variant}-{rating}.wav"
            }
    else:
        # Format: class-id-variant-rating
        parts = name.split('-')
        if len(parts) >= 4:
            class_num = parts[0]
            file_id = parts[1]
            variant = parts[2]
            rating = parts[3]
            
            return {
                'filename': filename,
                'class': class_num,
                'file_id': file_id,
                'variant': variant,
                'rating': rating,
                'file_type': 'audio',
                'vibration_type': None,
                'base_filename': filename
            }
    
    return None

def get_file_size_mb(filepath):
    """Get file size in MB"""
    try:
        size_bytes = os.path.getsize(filepath)
        return round(size_bytes / (1024 * 1024), 2)
    except:
        return 0

def generate_audio_vibration_excel():
    """Generate Excel sheet for audio_vibration folder"""
    
    # Paths
    audio_dir = "audio_vibration/audio"
    vibration_dir = "audio_vibration/vibration"
    
    # Lists to store data
    all_files_data = []
    
    # Process audio files
    if os.path.exists(audio_dir):
        print(f"Processing audio files in {audio_dir}...")
        for filename in os.listdir(audio_dir):
            if filename.endswith('.wav'):
                file_info = parse_filename(filename)
                if file_info:
                    file_info['file_path'] = os.path.join(audio_dir, filename)
                    file_info['file_size_mb'] = get_file_size_mb(file_info['file_path'])
                    all_files_data.append(file_info)
    
    # Process vibration files
    if os.path.exists(vibration_dir):
        print(f"Processing vibration files in {vibration_dir}...")
        for filename in os.listdir(vibration_dir):
            if filename.endswith('.wav'):
                file_info = parse_filename(filename)
                if file_info:
                    file_info['file_path'] = os.path.join(vibration_dir, filename)
                    file_info['file_size_mb'] = get_file_size_mb(file_info['file_path'])
                    all_files_data.append(file_info)
    
    # Create DataFrame
    df = pd.DataFrame(all_files_data)
    
    # Add additional columns
    df['has_audio_version'] = df['base_filename'].isin(df[df['file_type'] == 'audio']['filename'])
    df['has_vibration_version'] = df['base_filename'].isin(df[df['file_type'] == 'vibration']['base_filename'])
    
    # Reorder columns for better readability
    column_order = [
        'filename', 'file_type', 'class', 'file_id', 'variant', 'rating',
        'vibration_type', 'base_filename', 'file_size_mb', 'file_path',
        'has_audio_version', 'has_vibration_version'
    ]
    df = df[column_order]
    
    # Create summary statistics
    summary_data = {
        'Metric': [
            'Total Files',
            'Audio Files',
            'Vibration Files',
            'Unique Base Files',
            'Files with Audio Version',
            'Files with Vibration Version',
            'Total Size (MB)',
            'Average File Size (MB)',
            'Classes Found',
            'Vibration Types Found'
        ],
        'Value': [
            len(df),
            len(df[df['file_type'] == 'audio']),
            len(df[df['file_type'] == 'vibration']),
            len(df['base_filename'].unique()),
            len(df[df['has_audio_version'] == True]),
            len(df[df['has_vibration_version'] == True]),
            round(df['file_size_mb'].sum(), 2),
            round(df['file_size_mb'].mean(), 2),
            len(df['class'].unique()),
            len(df['vibration_type'].dropna().unique())
        ]
    }
    
    summary_df = pd.DataFrame(summary_data)
    
    # Create class statistics
    class_stats = df.groupby('class').agg({
        'filename': 'count',
        'file_type': lambda x: (x == 'audio').sum(),
        'file_size_mb': 'sum'
    }).rename(columns={
        'filename': 'Total Files',
        'file_type': 'Audio Files',
        'file_size_mb': 'Total Size (MB)'
    })
    class_stats['Vibration Files'] = class_stats['Total Files'] - class_stats['Audio Files']
    
    # Create vibration type statistics
    vib_type_stats = df[df['file_type'] == 'vibration'].groupby('vibration_type').agg({
        'filename': 'count',
        'file_size_mb': 'sum'
    }).rename(columns={
        'filename': 'Count',
        'file_size_mb': 'Total Size (MB)'
    })
    
    # Generate Excel file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_filename = f"audio_vibration_inventory_{timestamp}.xlsx"
    
    with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
        # Main data sheet
        df.to_excel(writer, sheet_name='All Files', index=False)
        
        # Summary sheet
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Class statistics sheet
        class_stats.to_excel(writer, sheet_name='Class Statistics')
        
        # Vibration type statistics sheet
        vib_type_stats.to_excel(writer, sheet_name='Vibration Types')
        
        # Audio files only sheet
        audio_df = df[df['file_type'] == 'audio'].copy()
        audio_df.to_excel(writer, sheet_name='Audio Files Only', index=False)
        
        # Vibration files only sheet
        vibration_df = df[df['file_type'] == 'vibration'].copy()
        vibration_df.to_excel(writer, sheet_name='Vibration Files Only', index=False)
        
        # Files with both audio and vibration versions
        both_versions = df[df['has_audio_version'] & df['has_vibration_version']].copy()
        both_versions.to_excel(writer, sheet_name='Files with Both Versions', index=False)
    
    print(f"\nExcel file generated: {excel_filename}")
    print(f"Total files processed: {len(df)}")
    print(f"Audio files: {len(df[df['file_type'] == 'audio'])}")
    print(f"Vibration files: {len(df[df['file_type'] == 'vibration'])}")
    print(f"Unique base files: {len(df['base_filename'].unique())}")
    print(f"Classes found: {sorted(df['class'].unique())}")
    print(f"Vibration types found: {sorted(df['vibration_type'].dropna().unique())}")
    
    return excel_filename

if __name__ == "__main__":
    generate_audio_vibration_excel() 