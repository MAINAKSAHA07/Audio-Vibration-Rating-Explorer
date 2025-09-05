# 🎵 Audio-Vibration Integration System

This document explains how to use the integrated Python algorithms with the React frontend for automatic vibration generation from uploaded audio files.

## 🏗️ System Architecture

The system consists of two main components:

1. **React Frontend** (`src/components/AudioUpload.tsx`) - Handles file uploads and displays results
2. **Python Backend** (`backend/app.py`) - Runs your vibration generation algorithms

## 🚀 Quick Start

### 1. Start the Python Backend

```bash
# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask service
python app.py
```

The backend will start on `http://localhost:5000` and automatically import your algorithms from the `Audioalgo/` directory.

### 2. Start the React Frontend

```bash
# In a new terminal, from the project root
npm start
```

The React app will start on `http://localhost:3000`.

### 3. Use the System

1. Navigate to the "🎵 Audio Upload" tab in the React app
2. Upload an audio file (WAV, MP3, OGG, FLAC, M4A)
3. The system will automatically:
   - Generate a spectrogram analysis
   - Process the audio through your Python algorithms
   - Generate vibration files using both FreqShift and HapticGen
   - Display download links for the generated vibrations

## 🔧 Python Algorithms Integration

### Supported Algorithms

1. **FreqShift** (`Audioalgo/FreqShift.py`)
   - Frequency shifting for haptic generation
   - Center frequency: 250Hz, Q: 1.0
   - Output: 8kHz WAV files

2. **HapticGen** (`Audioalgo/HapticGen.py`)
   - Amplitude envelope-based haptic generation
   - Base frequency: 200Hz
   - Output: 8kHz WAV files

3. **Normalization** (`Audioalgo/normalization.py`)
   - Audio normalization utilities
   - Used by both algorithms

### Algorithm Parameters

#### FreqShift
- **Center Frequency**: 250Hz (configurable in backend)
- **Q Factor**: 1.0 (configurable in backend)
- **High-pass Filter**: 10Hz cutoff
- **Output Sample Rate**: 8kHz

#### HapticGen
- **Base Frequency**: 200Hz
- **Window Size**: 10ms
- **Output Sample Rate**: 8kHz

## 📁 File Structure

```
Audio-Vibration-Rating-Explorer/
├── src/
│   ├── components/
│   │   └── AudioUpload.tsx          # Enhanced upload component
│   └── utils/
│       └── vibrationService.ts      # Backend communication service
├── backend/
│   ├── app.py                       # Flask backend service
│   ├── requirements.txt             # Python dependencies
│   └── start_backend.py            # Backend startup script
├── Audioalgo/                       # Your Python algorithms
│   ├── FreqShift.py
│   ├── HapticGen.py
│   └── normalization.py
└── README_VIBRATION_INTEGRATION.md  # This file
```

## 🔌 API Endpoints

### Backend Service (`http://localhost:5000`)

- `GET /health` - Check backend status and available algorithms
- `POST /generate-vibrations` - Upload audio and generate vibrations
- `GET /download/<filename>` - Download generated vibration files
- `GET /list-outputs` - List all generated output files

### Frontend Service

The `vibrationService.ts` utility provides:
- `checkHealth()` - Verify backend availability
- `generateVibrations(file)` - Send audio for processing
- `downloadVibration(filename)` - Download generated files
- `listOutputs()` - Get list of available outputs

## 🎯 How It Works

### 1. File Upload
- User uploads audio file through React interface
- File is validated (type, size < 50MB)
- Audio is displayed with WaveSurfer player

### 2. Automatic Processing
- Spectrogram analysis is generated in the browser
- Audio file is sent to Python backend via HTTP POST
- Backend processes file through both algorithms simultaneously

### 3. Vibration Generation
- **FreqShift**: Applies frequency shifting, band-pass filtering, and resampling
- **HapticGen**: Extracts amplitude envelope and generates sine wave vibrations
- Both algorithms output 8kHz WAV files optimized for haptic devices

### 4. Results Display
- Success/error status for each algorithm
- File information (name, size)
- Download buttons for generated vibrations
- Real-time status updates

## 🛠️ Customization

### Modifying Algorithm Parameters

Edit `backend/app.py` to change algorithm parameters:

```python
# FreqShift parameters
freqshift_process(
    in_wav=str(input_path),
    out_wav=str(freqshift_output),
    centre_hz=250.0,  # Change center frequency
    q=1.0             # Change Q factor
)
```

### Adding New Algorithms

1. Add your algorithm file to `Audioalgo/`
2. Import it in `backend/app.py`
3. Add processing logic in the `generate_vibrations` function
4. Update the frontend to display results

### Changing Output Formats

Modify the backend to support different output formats:
- Change sample rates
- Add different file formats (MP3, OGG)
- Implement custom normalization

## 🐛 Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Check Python version (3.7+ required)
   - Install dependencies: `pip install -r requirements.txt`
   - Verify `Audioalgo/` directory exists

2. **Algorithm Import Errors**
   - Check file paths in `backend/app.py`
   - Verify algorithm files have correct imports
   - Check for missing dependencies (librosa, torch, etc.)

3. **File Processing Errors**
   - Ensure audio files are valid
   - Check file size limits
   - Verify supported formats

4. **Frontend Connection Issues**
   - Verify backend is running on port 5000
   - Check CORS settings
   - Verify network connectivity

### Debug Mode

Enable debug logging in the backend:

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

Check browser console and backend terminal for detailed error messages.

## 📊 Performance Considerations

### Processing Time
- **Small files (< 1MB)**: 1-5 seconds
- **Medium files (1-10MB)**: 5-15 seconds
- **Large files (10-50MB)**: 15-60 seconds

### Memory Usage
- Backend processes files in temporary directories
- Generated files are stored in `backend/outputs/`
- Consider cleanup for production use

### Scalability
- Current implementation is single-threaded
- For production, consider:
  - Worker queues (Celery, RQ)
  - File storage (S3, local filesystem)
  - Load balancing
  - Database for job tracking

## 🔒 Security Considerations

### File Upload Security
- File type validation
- File size limits
- Temporary file handling
- Input sanitization

### Production Deployment
- Use HTTPS
- Implement authentication
- Rate limiting
- Input validation
- Secure file storage

## 🚀 Future Enhancements

### Planned Features
- Real-time processing progress
- Batch file processing
- Algorithm parameter tuning UI
- Vibration preview/playback
- Integration with haptic devices
- Cloud storage integration

### Algorithm Improvements
- GPU acceleration for large files
- Parallel processing
- Adaptive parameter selection
- Quality metrics and comparison

## 📚 References

- [Librosa Documentation](https://librosa.org/)
- [PyTorch Audio](https://pytorch.org/audio/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React File Upload](https://reactjs.org/docs/forms.html#the-file-input-tag)

## 🤝 Contributing

To contribute to this integration:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This integration follows the same license as the main project. Please refer to the project's LICENSE file for details.

---

**Note**: This system integrates your existing Python algorithms with a modern web interface. The algorithms remain unchanged and can be used independently or integrated with other systems.
