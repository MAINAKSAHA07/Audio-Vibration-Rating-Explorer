import os
import pandas as pd
from datetime import datetime

def parse_filename(filename):
    """Parse filename to extract components"""
    name = filename.replace('.wav', '')
    
    if '-vib-' in name:
        # Vibration file: class-id-variant-rating-vib-type
        parts = name.split('-vib-')
        base_part = parts[0]
        vib_type = parts[1]
        
        base_parts = base_part.split('-')
        if len(base_parts) >= 4:
            return {
                'filename': filename,
                'class': base_parts[0],
                'file_id': base_parts[1],
                'variant': base_parts[2],
                'rating': base_parts[3],
                'file_type': 'vibration',
                'vibration_type': vib_type,
                'base_filename': f"{base_parts[0]}-{base_parts[1]}-{base_parts[2]}-{base_parts[3]}.wav"
            }
    else:
        # Audio file: class-id-variant-rating
        parts = name.split('-')
        if len(parts) >= 4:
            return {
                'filename': filename,
                'class': parts[0],
                'file_id': parts[1],
                'variant': parts[2],
                'rating': parts[3],
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

def generate_simple_excel():
    """Generate a simple Excel sheet for audio_vibration folder"""
    
    audio_dir = "audio_vibration/audio"
    vibration_dir = "audio_vibration/vibration"
    
    all_files_data = []
    
    # Process audio files
    if os.path.exists(audio_dir):
        print(f"Processing {len(os.listdir(audio_dir))} audio files...")
        for filename in os.listdir(audio_dir):
            if filename.endswith('.wav'):
                file_info = parse_filename(filename)
                if file_info:
                    file_info['file_path'] = os.path.join(audio_dir, filename)
                    file_info['file_size_mb'] = get_file_size_mb(file_info['file_path'])
                    all_files_data.append(file_info)
    
    # Process vibration files
    if os.path.exists(vibration_dir):
        print(f"Processing {len(os.listdir(vibration_dir))} vibration files...")
        for filename in os.listdir(vibration_dir):
            if filename.endswith('.wav'):
                file_info = parse_filename(filename)
                if file_info:
                    file_info['file_path'] = os.path.join(vibration_dir, filename)
                    file_info['file_size_mb'] = get_file_size_mb(file_info['file_path'])
                    all_files_data.append(file_info)
    
    # Create DataFrame
    df = pd.DataFrame(all_files_data)
    
    # Create summary data
    summary_data = {
        'Category': [
            'Total Files',
            'Audio Files',
            'Vibration Files',
            'Unique Base Files',
            'Classes',
            'Vibration Types',
            'Total Size (MB)',
            'Average File Size (MB)'
        ],
        'Count': [
            len(df),
            len(df[df['file_type'] == 'audio']),
            len(df[df['file_type'] == 'vibration']),
            len(df['base_filename'].unique()),
            len(df['class'].unique()),
            len(df['vibration_type'].dropna().unique()),
            round(df['file_size_mb'].sum(), 2),
            round(df['file_size_mb'].mean(), 2)
        ]
    }
    
    summary_df = pd.DataFrame(summary_data)
    
    # Create class breakdown
    class_breakdown = df.groupby('class').agg({
        'filename': 'count',
        'file_type': lambda x: (x == 'audio').sum(),
        'file_size_mb': 'sum'
    }).rename(columns={
        'filename': 'Total Files',
        'file_type': 'Audio Files',
        'file_size_mb': 'Total Size (MB)'
    })
    class_breakdown['Vibration Files'] = class_breakdown['Total Files'] - class_breakdown['Audio Files']
    
    # Create vibration type breakdown
    vib_breakdown = df[df['file_type'] == 'vibration'].groupby('vibration_type').agg({
        'filename': 'count',
        'file_size_mb': 'sum'
    }).rename(columns={
        'filename': 'Count',
        'file_size_mb': 'Total Size (MB)'
    })
    
    # Generate Excel file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_filename = f"audio_vibration_summary_{timestamp}.xlsx"
    
    with pd.ExcelWriter(excel_filename, engine='openpyxl') as writer:
        # Summary sheet
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Class breakdown
        class_breakdown.to_excel(writer, sheet_name='Class Breakdown')
        
        # Vibration types
        vib_breakdown.to_excel(writer, sheet_name='Vibration Types')
        
        # All files (main data)
        df.to_excel(writer, sheet_name='All Files', index=False)
    
    print(f"\n✅ Excel file generated: {excel_filename}")
    print(f"📊 Summary:")
    print(f"   • Total files: {len(df)}")
    print(f"   • Audio files: {len(df[df['file_type'] == 'audio'])}")
    print(f"   • Vibration files: {len(df[df['file_type'] == 'vibration'])}")
    print(f"   • Classes: {sorted(df['class'].unique())}")
    print(f"   • Vibration types: {sorted(df['vibration_type'].dropna().unique())}")
    
    return excel_filename

if __name__ == "__main__":
    generate_simple_excel() 