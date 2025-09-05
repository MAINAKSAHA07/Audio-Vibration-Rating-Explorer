#!/usr/bin/env python3
"""
Flask backend service for Audio-Vibration Rating Explorer
Integrates the Python algorithms for vibration generation
"""

import os
import tempfile
import shutil
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import werkzeug
import sys

# Add the Audioalgo directory to the Python path
current_dir = Path(__file__).parent
audioalgo_dir = current_dir.parent / 'Audioalgo'
sys.path.insert(0, str(audioalgo_dir))

# Import the algorithms
try:
    from FreqShift import process_file as freqshift_process
    from HapticGen import process_file as hapticgen_process
    from Percept import process_file as percept_process
    from PitchWrapper import process_file as pitch_process
    from normalization import normalize_audio
    print("✅ Successfully imported all algorithms")
except ImportError as e:
    print(f"❌ Error importing algorithms: {e}")
    print(f"Audioalgo directory: {audioalgo_dir}")
    print(f"Available files: {list(audioalgo_dir.glob('*.py'))}")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'algorithms': ['freqshift', 'hapticgen', 'percept', 'pitch'],
        'message': 'Audio-Vibration backend service is running'
    })

@app.route('/generate-vibrations', methods=['POST'])
def generate_vibrations():
    """Generate vibrations using the Python algorithms"""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not file.filename.lower().endswith(('.wav', '.mp3', '.ogg', '.flac', '.m4a')):
            return jsonify({'error': 'Unsupported file format. Please use WAV, MP3, OGG, FLAC, or M4A'}), 400
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Save uploaded file
            input_path = temp_path / 'input_audio.wav'
            file.save(str(input_path))
            
            # Convert to WAV if needed (you might want to add audio conversion here)
            # For now, we'll assume it's already WAV or can be processed directly
            
            # Generate vibrations using both algorithms
            results = {}
            
            try:
                # Frequency Shift algorithm
                freqshift_output = temp_path / 'freqshift_output.wav'
                freqshift_process(
                    in_wav=str(input_path),
                    out_wav=str(freqshift_output),
                    centre_hz=250.0,
                    q=1.0
                )
                
                if freqshift_output.exists():
                    results['freqshift'] = {
                        'filename': f'freqshift_{file.filename}',
                        'path': str(freqshift_output),
                        'size': freqshift_output.stat().st_size
                    }
                
            except Exception as e:
                print(f"Error in FreqShift algorithm: {e}")
                results['freqshift'] = {'error': str(e)}
            
            try:
                # HapticGen algorithm
                hapticgen_output = temp_path / 'hapticgen_output.wav'
                hapticgen_process(
                    input_path=str(input_path),
                    output_path=str(hapticgen_output)
                )
                
                if hapticgen_output.exists():
                    results['hapticgen'] = {
                        'filename': f'hapticgen_{file.filename}',
                        'path': str(hapticgen_output),
                        'size': hapticgen_output.stat().st_size
                    }
                
            except Exception as e:
                print(f"Error in HapticGen algorithm: {e}")
                results['hapticgen'] = {'error': str(e)}
            
            try:
                # Percept algorithm (perceptual audio-to-vibration translation)
                percept_output = temp_path / 'percept_output.wav'
                percept_process(
                    in_wav=str(input_path),
                    out_wav=str(percept_output),
                    overlap=0.0,
                    content="game"  # Default to game content type
                )
                
                if percept_output.exists():
                    results['percept'] = {
                        'filename': f'percept_{file.filename}',
                        'path': str(percept_output),
                        'size': percept_output.stat().st_size
                    }
                
            except Exception as e:
                print(f"Error in Percept algorithm: {e}")
                results['percept'] = {'error': str(e)}
            
            try:
                # Pitch algorithm (MATLAB-based sound-to-touch crossmodal pitch matching)
                pitch_output = temp_path / 'pitch_output.wav'
                pitch_process(
                    in_wav=str(input_path),
                    out_wav=str(pitch_output)
                )
                
                if pitch_output.exists():
                    results['pitch'] = {
                        'filename': f'pitch_{file.filename}',
                        'path': str(pitch_output),
                        'size': pitch_output.stat().st_size
                    }
                
            except Exception as e:
                print(f"Error in Pitch algorithm: {e}")
                results['pitch'] = {'error': str(e)}
            
            return jsonify({
                'success': True,
                'message': 'Vibration generation completed',
                'original_file': file.filename,
                'results': results
            })
            
    except Exception as e:
        print(f"Error in generate_vibrations: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a generated vibration file"""
    try:
        file_path = Path(OUTPUT_FOLDER) / filename
        if file_path.exists():
            return send_file(str(file_path), as_attachment=True)
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/generate-and-download', methods=['POST'])
def generate_and_download():
    """Generate vibration file on-demand and return it without saving"""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get algorithm type
        algorithm = request.form.get('algorithm', 'freqshift')
        if algorithm not in ['freqshift', 'hapticgen', 'percept', 'pitch']:
            return jsonify({'error': 'Invalid algorithm specified'}), 400
        
        # Validate file type
        if not file.filename.lower().endswith(('.wav', '.mp3', '.ogg', '.flac', '.m4a')):
            return jsonify({'error': 'Unsupported file format. Please use WAV, MP3, OGG, FLAC, or M4A'}), 400
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Save uploaded file
            input_path = temp_path / 'input_audio.wav'
            file.save(str(input_path))
            
            # Generate vibration file based on algorithm
            output_path = temp_path / f'{algorithm}_output.wav'
            
            try:
                if algorithm == 'freqshift':
                    freqshift_process(
                        in_wav=str(input_path),
                        out_wav=str(output_path),
                        centre_hz=250.0,
                        q=1.0
                    )
                elif algorithm == 'hapticgen':
                    hapticgen_process(
                        input_path=str(input_path),
                        output_path=str(output_path)
                    )
                elif algorithm == 'percept':
                    percept_process(
                        in_wav=str(input_path),
                        out_wav=str(output_path),
                        overlap=0.0,
                        content="game"
                    )
                elif algorithm == 'pitch':
                    pitch_process(
                        in_wav=str(input_path),
                        out_wav=str(output_path)
                    )
                
                if output_path.exists():
                    return send_file(
                        str(output_path), 
                        as_attachment=True, 
                        download_name=f'{algorithm}_{file.filename}'
                    )
                else:
                    return jsonify({'error': f'Failed to generate {algorithm} vibration'}), 500
                    
            except Exception as e:
                print(f"Error in {algorithm} algorithm: {e}")
                return jsonify({'error': f'Algorithm error: {str(e)}'}), 500
                
    except Exception as e:
        print(f"Error in generate_and_download: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/list-outputs', methods=['GET'])
def list_outputs():
    """List all generated output files"""
    try:
        output_files = []
        for file_path in Path(OUTPUT_FOLDER).glob('*'):
            if file_path.is_file():
                output_files.append({
                    'filename': file_path.name,
                    'size': file_path.stat().st_size,
                    'modified': file_path.stat().st_mtime
                })
        
        return jsonify({
            'outputs': output_files,
            'count': len(output_files)
        })
    except Exception as e:
        return jsonify({'error': f'Error listing outputs: {str(e)}'}), 500

if __name__ == '__main__':
#   print("🚀 Starting Audio-Vibration Backend Service...")
#    print(f"📁 Audioalgo directory: {audioalgo_dir}")
#    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
#    print(f"📁 Output folder: {OUTPUT_FOLDER}")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
