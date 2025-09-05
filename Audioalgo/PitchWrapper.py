#!/usr/bin/env python3
"""
Python wrapper for MATLAB Pitch.m algorithm using MATLAB Engine for Python
Sound-to-Touch Crossmodal Pitch Matching based on IEEE Transactions on Haptics 2024

This wrapper calls the MATLAB Pitch.m file directly using the MATLAB Engine.
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
import soundfile as sf
import numpy as np

# Try to import MATLAB Engine
try:
    import matlab.engine
    MATLAB_ENGINE_AVAILABLE = True
    print("✅ MATLAB Engine for Python is available")
except ImportError as e:
    MATLAB_ENGINE_AVAILABLE = False
    print(f"❌ MATLAB Engine for Python not available: {e}")

class PitchProcessor:
    """
    Wrapper class for the MATLAB Pitch.m algorithm using MATLAB Engine
    """
    
    def __init__(self):
        self.matlab_script_path = Path(__file__).parent / "Pitch.m"
        self.engine = None
        
        if MATLAB_ENGINE_AVAILABLE:
            self._start_matlab_engine()
        else:
            raise RuntimeError("MATLAB Engine for Python is not available")
    
    def _start_matlab_engine(self):
        """Start MATLAB Engine for Python"""
        try:
            self.engine = matlab.engine.start_matlab()
            print("✅ MATLAB Engine started successfully")
        except Exception as e:
            print(f"❌ Failed to start MATLAB Engine: {e}")
            self.engine = None
            raise
    
    def process_file(self, input_wav, output_wav, **kwargs):
        """
        Process audio file using MATLAB Pitch.m algorithm
        
        Args:
            input_wav: Path to input audio file
            output_wav: Path to output vibration file
            **kwargs: Additional parameters (unused for now)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.engine:
            print("❌ MATLAB Engine not available")
            return False
        
        if not self.matlab_script_path.exists():
            print(f"❌ MATLAB script not found: {self.matlab_script_path}")
            return False
        
        try:
            # Create temporary directory for processing
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Copy input file to temp directory
                temp_input = temp_path / "input.wav"
                temp_output = temp_path / "output.wav"
                
                shutil.copy2(input_wav, temp_input)
                
                # Create a modified MATLAB script that uses our temp files
                modified_script = self._create_modified_matlab_script(temp_input, temp_output)
                script_path = temp_path / "run_pitch.m"
                
                with open(script_path, 'w') as f:
                    f.write(modified_script)
                
                # Run MATLAB script using the engine
                print(f"🔄 Running MATLAB Pitch algorithm...")
                
                # Change to temp directory and run the script
                self.engine.cd(str(temp_path))
                self.engine.run(str(script_path), nargout=0)
                
                # Check if output file was created
                if temp_output.exists():
                    # Copy output to final destination
                    shutil.copy2(temp_output, output_wav)
                    print(f"✅ Pitch algorithm completed successfully")
                    return True
                else:
                    print("❌ MATLAB script did not produce output file")
                    return False
                    
        except Exception as e:
            print(f"❌ Error processing with MATLAB Engine: {e}")
            return False
    
    def _create_modified_matlab_script(self, input_file, output_file):
        """
        Create a modified version of the MATLAB script that uses our temp files
        """
        # Read the original Pitch.m file
        with open(self.matlab_script_path, 'r') as f:
            original_script = f.read()
        
        # Replace the hardcoded file paths with our temp files
        modified_script = original_script.replace(
            "inputFilePath = '/Users/yinanli/Desktop/audio-to-haptic/sound2haptics_SP/1-85362-A-0.wav';",
            f"inputFilePath = '{input_file}';"
        ).replace(
            "outputFilePath = '/Users/yinanli/Desktop/audio-to-haptic/sound2haptics_SP/1-85362-A-0-pitch.wav';",
            f"outputFilePath = '{output_file}';"
        )
        
        # Replace missing functions with custom implementations
        function_replacements = """
% Custom Hann window function (replacement for Signal Processing Toolbox)
function w = hann(n)
    if n == 1
        w = 1;
    else
        w = 0.5 * (1 - cos(2*pi*(0:n-1)'/(n-1)));
    end
end

% Custom acoustic loudness function (simplified replacement for Audio Toolbox)
function [loudness, specificLoudnessMatrix] = acousticLoudness(audio, sr, varargin)
    % Simplified loudness calculation using RMS
    loudness = rms(audio);
    
    % Create a simple specific loudness matrix (24 Bark bands)
    % This is a simplified approximation
    nBands = 24;
    specificLoudnessMatrix = zeros(1, nBands);
    
    % Distribute loudness across frequency bands (simplified)
    for i = 1:nBands
        specificLoudnessMatrix(i) = loudness / nBands;
    end
end

% Custom resample function (simplified replacement for Signal Processing Toolbox)
function y = resample(x, p, q)
    % Simple resampling using interpolation
    % This is a basic implementation
    if p == q
        y = x;
        return;
    end
    
    % Calculate new length
    newLength = round(length(x) * p / q);
    
    % Create new time vector
    oldTime = 1:length(x);
    newTime = linspace(1, length(x), newLength);
    
    % Interpolate
    y = interp1(oldTime, x, newTime, 'linear', 'extrap');
end
"""
        
        # Add the custom functions at the beginning of the script
        modified_script = function_replacements + "\n" + modified_script
        
        return modified_script
    
    def __del__(self):
        """Clean up MATLAB engine when object is destroyed"""
        if self.engine:
            try:
                self.engine.quit()
            except:
                pass

def process_file(in_wav, out_wav, **kwargs):
    """
    Main processing function that can be called from the backend
    
    Args:
        in_wav: Path to input audio file
        out_wav: Path to output vibration file
        **kwargs: Additional parameters
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        processor = PitchProcessor()
        return processor.process_file(in_wav, out_wav, **kwargs)
    except Exception as e:
        print(f"❌ Failed to create PitchProcessor: {e}")
        return False

if __name__ == "__main__":
    # Test the wrapper
    import argparse
    
    parser = argparse.ArgumentParser(description="MATLAB Pitch Algorithm Wrapper")
    parser.add_argument("--input_file", required=True, help="Input audio file")
    parser.add_argument("--output_file", required=True, help="Output vibration file")
    
    args = parser.parse_args()
    
    success = process_file(args.input_file, args.output_file)
    if success:
        print("✅ Processing completed successfully")
    else:
        print("❌ Processing failed")
        sys.exit(1)
