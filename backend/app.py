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
    from normalization import normalize_audio
    print("✅ Successfully imported core algorithms")
except ImportError as e:
    print(f"❌ Error importing core algorithms: {e}")
    print(f"Audioalgo directory: {audioalgo_dir}")

# Import neural network models
try:
    # Add model_inference directory to path
    model_inference_dir = audioalgo_dir / 'model_inference'
    sys.path.insert(0, str(model_inference_dir))
    
    from inference_model1 import AudioToVibrationInference as Model1Inference
    from inference_model2 import AudioToVibrationInference as Model2Inference
    print("✅ Successfully imported neural network models")
    NEURAL_MODELS_AVAILABLE = True
except ImportError as e:
    print(f"❌ Error importing neural network models: {e}")
    print(f"Model inference directory: {model_inference_dir}")
    NEURAL_MODELS_AVAILABLE = False
    print(f"Available files: {list(audioalgo_dir.glob('*.py'))}")

# Try to import MATLAB-dependent algorithm
# Note: MATLAB Engine for Python is optional - if not available, the pitch algorithm will be disabled
try:
    from PitchWrapper import process_file as pitch_process
    PITCH_AVAILABLE = True
    print("✅ Successfully imported Pitch algorithm (MATLAB Engine available)")
except ImportError as e:
    print(f"⚠️ MATLAB Engine for Python not available - Pitch algorithm will be disabled")
    print(f"   Error details: {e}")
    print("   This is normal if MATLAB is not installed. The backend will continue without the pitch algorithm.")
    PITCH_AVAILABLE = False
    # Create a dummy function for when MATLAB is not available
    def pitch_process(*args, **kwargs):
        print("❌ Pitch algorithm requires MATLAB Engine for Python (not available)")
        return False

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Production configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Security headers for production
@app.after_request
def after_request(response):
    """Add security headers for production deployment"""
    if os.getenv('ENVIRONMENT') == 'production':
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# Initialize neural network models if available
model1_inference = None
model2_inference = None

if NEURAL_MODELS_AVAILABLE:
    try:
        # Get model paths
        model1_path = model_inference_dir / 'best_model1.pth'
        model2_path = model_inference_dir / 'best_model2.pth'
        
        if model1_path.exists():
            model1_inference = Model1Inference(str(model1_path))
            print("✅ Model 1 (Top-Rated Sound2Hap) initialized successfully")
        else:
            print(f"❌ Model 1 file not found: {model1_path}")
            
        if model2_path.exists():
            model2_inference = Model2Inference(str(model2_path))
            print("✅ Model 2 (Preference-Weighted Sound2Hap) initialized successfully")
        else:
            print(f"❌ Model 2 file not found: {model2_path}")
            
    except Exception as e:
        print(f"❌ Error initializing neural network models: {e}")
        NEURAL_MODELS_AVAILABLE = False

# Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with accurate model status"""
    algorithms = ['freqshift', 'hapticgen', 'percept']
    if PITCH_AVAILABLE:
        algorithms.append('pitch')
    
    # Only add models if they are actually initialized
    model1_available = model1_inference is not None
    model2_available = model2_inference is not None
    
    if model1_available:
        algorithms.append('model1')
    if model2_available:
        algorithms.append('model2')
    
    return jsonify({
        'status': 'healthy',
        'algorithms': algorithms,
        'pitch_available': PITCH_AVAILABLE,
        'neural_models_available': NEURAL_MODELS_AVAILABLE,
        'model1_available': model1_available,
        'model2_available': model2_available,
        'matlab_engine_available': PITCH_AVAILABLE,
        'message': 'Audio-Vibration backend service is running',
        'note': 'MATLAB Engine is optional - pitch algorithm disabled if not available'
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
                if PITCH_AVAILABLE:
                    pitch_output = temp_path / 'pitch_output.wav'
                    success = pitch_process(
                        in_wav=str(input_path),
                        out_wav=str(pitch_output)
                    )
                    
                    if success and pitch_output.exists():
                        results['pitch'] = {
                            'filename': f'pitch_{file.filename}',
                            'path': str(pitch_output),
                            'size': pitch_output.stat().st_size
                        }
                    else:
                        results['pitch'] = {'error': 'Pitch algorithm failed to generate output'}
                else:
                    results['pitch'] = {'error': 'Pitch algorithm requires MATLAB Engine for Python (not available - this is normal if MATLAB is not installed)'}
                
            except Exception as e:
                print(f"Error in Pitch algorithm: {e}")
                results['pitch'] = {'error': str(e)}
            
            # Neural Network Model 1 (Top-Rated Sound2Hap)
            if model1_inference is not None:
                try:
                    model1_output = temp_path / 'model1_output.wav'
                    vib_output = model1_inference.inference(str(input_path), output_sample_rate=8000)
                    model1_inference.save_vibration(vib_output, str(model1_output), 8000)
                    
                    if model1_output.exists():
                        results['model1'] = {
                            'filename': f'model1_{file.filename}',
                            'path': str(model1_output),
                            'size': model1_output.stat().st_size
                        }
                    else:
                        results['model1'] = {'error': 'Model 1 output file not generated'}
                    
                except Exception as e:
                    print(f"Error in Model 1 (Top-Rated Sound2Hap): {e}")
                    results['model1'] = {'error': str(e)}
            else:
                results['model1'] = {'error': 'Model 1 (Top-Rated Sound2Hap) not available - model file not found or initialization failed'}
            
            # Neural Network Model 2 (Preference-Weighted Sound2Hap)
            if model2_inference is not None:
                try:
                    model2_output = temp_path / 'model2_output.wav'
                    vib_output = model2_inference.inference(str(input_path), output_sample_rate=8000)
                    model2_inference.save_vibration(vib_output, str(model2_output), 8000)
                    
                    if model2_output.exists():
                        results['model2'] = {
                            'filename': f'model2_{file.filename}',
                            'path': str(model2_output),
                            'size': model2_output.stat().st_size
                        }
                    else:
                        results['model2'] = {'error': 'Model 2 output file not generated'}
                    
                except Exception as e:
                    print(f"Error in Model 2 (Preference-Weighted Sound2Hap): {e}")
                    results['model2'] = {'error': str(e)}
            else:
                results['model2'] = {'error': 'Model 2 (Preference-Weighted Sound2Hap) not available - model file not found or initialization failed'}
            
            # Return file data as base64 encoded strings instead of file paths
            import base64
            file_data = {}
            
            for algorithm, result in results.items():
                if 'path' in result and Path(result['path']).exists():
                    with open(result['path'], 'rb') as f:
                        file_data[algorithm] = {
                            'filename': result['filename'],
                            'size': result['size'],
                            'data': base64.b64encode(f.read()).decode('utf-8')
                        }
                elif 'error' in result:
                    file_data[algorithm] = {'error': result['error']}
            
            return jsonify({
                'success': True,
                'message': 'Vibration generation completed',
                'original_file': file.filename,
                'results': file_data
            })
            
    except Exception as e:
        print(f"Error in generate_vibrations: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


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
        available_algorithms = ['freqshift', 'hapticgen', 'percept']
        if PITCH_AVAILABLE:
            available_algorithms.append('pitch')
        if model1_inference is not None:
            available_algorithms.append('model1')
        if model2_inference is not None:
            available_algorithms.append('model2')
        
        if algorithm not in available_algorithms:
            return jsonify({'error': f'Invalid algorithm specified. Available: {available_algorithms}'}), 400
        
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
                    if PITCH_AVAILABLE:
                        success = pitch_process(
                            in_wav=str(input_path),
                            out_wav=str(output_path)
                        )
                        if not success:
                            return jsonify({'error': 'Pitch algorithm failed to generate output'}), 500
                    else:
                        return jsonify({'error': 'Pitch algorithm requires MATLAB Engine for Python (not available - this is normal if MATLAB is not installed)'}), 400
                elif algorithm == 'model1':
                    if model1_inference is not None:
                        vib_output = model1_inference.inference(str(input_path), output_sample_rate=8000)
                        model1_inference.save_vibration(vib_output, str(output_path), 8000)
                    else:
                        return jsonify({'error': 'Model 1 (Top-Rated Sound2Hap) not available - model file not found or initialization failed'}), 400
                elif algorithm == 'model2':
                    if model2_inference is not None:
                        vib_output = model2_inference.inference(str(input_path), output_sample_rate=8000)
                        model2_inference.save_vibration(vib_output, str(output_path), 8000)
                    else:
                        return jsonify({'error': 'Model 2 (Preference-Weighted Sound2Hap) not available - model file not found or initialization failed'}), 400
                
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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)