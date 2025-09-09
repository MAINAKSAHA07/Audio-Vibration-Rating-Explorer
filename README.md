# Audio-Vibration Rating Explorer

An advanced interactive web application for exploring how well six vibration designs match real-world sounds, featuring comprehensive data visualization, audio/vibration playback, waveform analysis, AI-powered research assistance, and neural network-based vibration generation.

## 🌐 **Live Demo**

**Visit the live application:** [https://audiovibration.netlify.app/](https://audiovibration.netlify.app/)

Experience all features including the comprehensive dashboard, audio playback, AI research assistant, interactive visualizations, and neural network vibration generation.

## 🚀 Features

### 📊 **Comprehensive Dashboard**

- **Multi-chart dashboard** with 6 different visualizations
- **Category Distribution** pie chart showing sound type breakdown
- **Rating Distribution** histogram for rating patterns
- **Top & Bottom Performers** bar chart for class performance
- **Performance Heatmap** showing design-category interactions
- **Rating vs Frequency** scatter plot for trend analysis
- **Design Correlations** matrix for relationship analysis

### 🎵 **Audio & Vibration Playback**

- **Dual-view audio player** with waveform visualization
- **Real-time waveform display** using WaveSurfer.js
- **Vibration design playback** for all 6 designs per audio file
- **Simple and enhanced player modes** with different control interfaces
- **Time synchronization** between audio and vibration playback
- **Spectrogram visualization** for frequency analysis

### 🤖 **Neural Network Vibration Generation**

- **Top-Rated Sound2Hap** - AI model trained on high-rated vibration patterns
- **Preference-Weighted Sound2Hap** - AI model optimized for user preferences
- **Real-time audio upload** and vibration generation
- **Single file processing** for immediate results
- **EnCodec-based architecture** for high-fidelity audio processing

### 📈 **Data Visualization**

- **Overview Chart** - Advanced dual-chart visualization featuring:
  - **Vibrant Color Box Plot** - Interactive bar chart with gradient overlays and hover effects
  - **Hierarchical Line Chart** - ESC-50 class-based performance tracking across all vibration methods
  - **Category Background Bands** - Visual separation of ESC-50 categories (Animals, Natural Soundscapes, Human Non-Speech, Interior/Domestic, Exterior/Urban)
  - **Interactive Tooltips** - Detailed information on hover including specific category names and ratings
  - **Method Highlighting** - Dynamic line thickness and opacity changes for focused analysis
  - **Real-time Statistics** - Live data summary with total files, classes, ratings, and categories
- **Algorithm Performance Sunburst** - Interactive hierarchical visualization featuring:
  - **Multi-level Navigation** - Drill down from algorithms to categories to subcategories to individual sounds
  - **Algorithm Win Rate Analysis** - Shows which algorithms win for each sound category
  - **Bidirectional Filter Integration** - Seamlessly connected with FilterPanel for synchronized exploration
  - **Real-time Performance Calculation** - Dynamic win rate computation based on selected algorithms
  - **Interactive Tooltips** - Detailed win statistics and sound counts for each segment
- **Category Analysis** - Detailed ratings by sound categories
- **Class Detail View** - Deep dive into specific audio classes
- **Creative Visualizations** - Advanced D3.js charts including:
  - **Volcano Contour Plot** - Interactive 3D-style visualization
  - **Radial Stacked Bar Chart** - Circular data representation
- **Generated Visualizations** - Pre-processed waveform and spectrogram analysis

### 🤖 **AI Research Assistant**

- **Intelligent chatbot** for data-driven insights
- **Quick question buttons** for common research queries
- **Real-time analysis** of vibration design preferences
- **Category-specific insights** and recommendations
- **Statistical analysis** with correlation data
- **Design performance comparisons** across different sound types

### 🔗 **Bidirectional Filter Integration**

- **Seamless FilterPanel ↔ AlgorithmPerformanceSunburst Connection**
- **Multi-level Navigation** - Drill down from algorithms to categories to subcategories with synchronized filtering
- **Smart State Management** - Automatic navigation reset and context preservation
- **Visual Feedback** - Connected selections highlighted with special styling

## 🛠️ Tech Stack

### **Frontend**

- **React.js 19.1.0** with TypeScript
- **D3.js 7.9.0** for advanced data visualization
- **Recharts 3.1.0** for standard charts
- **WaveSurfer.js 7.10.1** for audio waveform display
- **CSS3** with responsive design and animations

### **Backend**

- **Flask** for Python API server
- **PyTorch** for neural network inference
- **EnCodec** for audio processing
- **MATLAB Engine** for pitch matching algorithms
- **Custom audio processing** algorithms

### **Data Processing**

- **Node.js** with xlsx for Excel file processing
- **Custom data transformation** scripts
- **JSON/CSV output** for web consumption
- **Real-time data fetching** via REST API

### **Deployment**

- **Netlify** for static site hosting
- **Git-based deployment** with automatic builds
- **CDN optimization** for global performance

## 📁 Project Structure

```
Audio-Vibration Rating Explorer/
├── public/
│   ├── audio/           # 1000+ original audio files (.wav)
│   ├── vibration/       # 4000+ vibration design files (.wav)
│   ├── data/           # Processed JSON/CSV data
│   │   ├── ratings.json    # Main dataset (4000 entries)
│   │   ├── summary.json    # Statistical summary
│   │   ├── ratings.csv     # CSV version for debugging
│   │   └── visualizations/ # Pre-generated analysis files
│   └── index.html      # Main HTML entry point
├── src/
│   ├── components/     # React components
│   │   ├── DashboardOverview.tsx      # Main dashboard (6 charts)
│   │   ├── FilterPanel.tsx            # Advanced filter panel with bidirectional connections
│   │   ├── SoundGrid.tsx              # Sound grid with integrated visualizations
│   │   ├── AlgorithmPerformanceSunburst.tsx # Interactive sunburst chart (1300+ lines)
│   │   ├── OverviewChart.tsx          # Overview visualization with line chart
│   │   ├── CategoryChart.tsx          # Category analysis
│   │   ├── ClassDetail.tsx            # Class-specific view
│   │   ├── AudioPlayer.tsx            # Audio playback component
│   │   ├── SimpleAudioPlayer.tsx      # Basic audio controls
│   │   ├── DualViewPlayer.tsx         # Advanced dual-view player
│   │   ├── AudioUpload.tsx            # Audio upload and vibration generation
│   │   ├── DetailedSoundDrawer.tsx    # Detailed sound analysis
│   │   ├── ResearchChatbot.tsx        # AI assistant (464 lines)
│   │   ├── VolcanoContourPlot.tsx     # Creative visualization
│   │   ├── RadialStackedBarChart.tsx  # Radial chart component
│   │   ├── GeneratedVisualizations.tsx # Pre-processed analysis
│   │   ├── VisualizationGrid.tsx      # Grid layout for charts
│   │   ├── SpectrogramView.tsx        # Frequency analysis
│   │   └── DataTest.tsx               # Data validation component
│   ├── utils/         # Helper functions
│   │   ├── api.ts         # Data fetching and interfaces
│   │   ├── dataHelpers.ts # Data processing utilities
│   │   └── vibrationService.ts # Vibration generation service
│   ├── App.tsx        # Main application component
│   └── App.css        # Comprehensive styling (2065 lines)
├── backend/
│   ├── app.py         # Flask API server
│   ├── requirements.txt # Python dependencies
│   └── venv/          # Virtual environment (excluded from git)
├── Audioalgo/
│   ├── FreqShift.py   # Frequency shift algorithm
│   ├── HapticGen.py   # Haptic generation algorithm
│   ├── Percept.py     # Perceptual mapping algorithm
│   ├── PitchWrapper.py # Pitch matching algorithm
│   ├── normalization.py # Audio normalization
│   └── model_inference/
│       ├── inference_model1.py # Top-Rated Sound2Hap model
│       ├── inference_model2.py # Preference-Weighted Sound2Hap model
│       ├── best_model1.pth     # Model 1 weights (excluded from git)
│       ├── best_model2.pth     # Model 2 weights (excluded from git)
│       └── encodec/            # EnCodec framework (excluded from git)
├── scripts/
│   ├── process-data.js                # Excel to JSON conversion
│   ├── generate-visualizations.js     # Pre-processing analysis
│   └── generate-visualization-structure.js # Structure generation
├── Audio Summary/
│   ├── generate_audio_vibration_excel.py # Excel generator
│   ├── generate_simple_excel.py        # Simple Excel generator
│   └── generate_esc50_csv.py           # ESC-50 CSV generator
├── audio_vibration/   # Raw audio data
│   ├── audio/         # Original sound files
│   └── vibration/     # Vibration design files
├── audio1000_ratings.xlsx # Source Excel data
└── netlify.toml       # Deployment configuration
```

## 🎵 Data Structure

### **Audio Dataset**

- **1000 real-world sound recordings** with ratings for each design
- **6 vibration designs**: freqshift, hapticgen, percept, pitchmatch, model1 (Top-Rated Sound2Hap), model2 (Preference-Weighted Sound2Hap)
- **8 audio classes** (A-H) mapped to categories
- **Rating scale**: 0-100 for each design
- **Categories**: Human Speech (78.7%), Music (14.1%), Nature Sounds (4.4%), Machinery (1.6%), Household (0.6%), Electronics (0.3%), Transportation (0.1%), Alarms (0.2%)

### **ESC-50 Dataset Integration**

- **50 ESC-50 classes** (0-49) with hierarchical category mapping:
  - **Animals** (Classes 0-9): dog, rooster, pig, cow, frog, cat, hen, insects, sheep, crow
  - **Natural Soundscapes** (Classes 10-19): rain, sea_waves, crackling_fire, crickets, chirping_birds, water_drops, wind, pouring_water, toilet_flush, thunderstorm
  - **Human Non-Speech** (Classes 20-29): crying_baby, sneezing, clapping, breathing, coughing, footsteps, laughing, brushing_teeth, snoring, drinking_sipping
  - **Interior/Domestic** (Classes 30-39): door_wood_knock, mouse_click, keyboard_typing, door_wood_creaks, can_opening, washing_machine, vacuum_cleaner, clock_alarm, clock_tick, glass_breaking
  - **Exterior/Urban** (Classes 40-49): helicopter, chainsaw, siren, car_horn, engine, train, church_bells, airplane, fireworks, hand_saw

### **Processed Data**

- **4000 total ratings** (1000 files × 4 designs) for traditional algorithms
- **6000 total ratings** (1000 files × 6 designs) including neural network models
- **JSON format** for web consumption
- **CSV backup** for debugging and analysis
- **Summary statistics** for quick insights

## 🚀 Setup Instructions

### **Prerequisites**

- Node.js (v16 or higher)
- Python 3.8+ (for backend)
- npm or yarn
- Git for version control

### **Frontend Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/MAINAKSAHA07/Audio-Vibration-Rating-Explorer.git
   cd Audio-Vibration-Rating-Explorer
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Process the data**

   ```bash
   npm run process-data
   ```

   This converts the Excel file to JSON format.
4. **Generate visualizations** (optional)

   ```bash
   npm run generate-visualizations
   npm run generate-structure
   ```
5. **Start development server**

   ```bash
   npm start
   ```
6. **Open your browser**
   Navigate to `http://localhost:3000`

### **Backend Installation**

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```
2. **Create virtual environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```
4. **Start backend server**

   ```bash
   python app.py
   ```

   The backend will run on `http://localhost:5001`

### **Neural Network Models Setup**

The neural network models require additional setup:

1. **Install EnCodec** (if not already installed)

   ```bash
   pip install encodec
   ```
2. **Model files** (excluded from git due to size):

   - `Audioalgo/model_inference/best_model1.pth` (88MB)
   - `Audioalgo/model_inference/best_model2.pth` (145MB)
   - `Audioalgo/model_inference/encodec/` (EnCodec framework)

   These files need to be obtained separately and placed in the correct directories.

## 📊 Usage Guide

### **Navigation Views**

1. **📈 Overview** - High-level summary with average ratings
2. **📊 Dashboard** - Comprehensive 6-chart dashboard
3. **🏷️ By Category** - Filter and analyze by sound category
4. **🎓 By Class** - Deep dive into specific audio classes
5. **📊 All Visualizations** - Pre-generated waveform analysis
6. **🎨 Creative Visualizations** - Advanced D3.js charts
7. **🤖 Research Assistant** - AI-powered data insights
8. **🎵 Audio Upload** - Upload audio and generate vibrations

### **Audio Upload & Vibration Generation**

#### **Traditional Algorithms**

1. **Frequency Shift** - Frequency-shifted vibration generation
2. **HapticGen** - Haptic-generated vibration patterns
3. **Percept** - Perceptual audio-to-vibration translation
4. **PitchMatch** - Pitch-matched vibration (requires MATLAB)

#### **Neural Network Models**

1. **Top-Rated Sound2Hap** - AI model trained on high-rated patterns
2. **Preference-Weighted Sound2Hap** - AI model optimized for user preferences

#### **Upload Process**

1. **Select Audio File** - Upload WAV, MP3, OGG, FLAC, or M4A files
2. **Generate Vibrations** - All 6 algorithms process the audio
3. **Play & Compare** - Use WaveSurfer players to compare results
4. **Download** - Save individual vibration files

### **Dashboard Features**

- **Overview Chart** - Advanced dual visualization with vibrant color box plot and hierarchical line chart
- **Category Distribution** - Interactive pie chart with sound type breakdown
- **Rating Distribution** - Histogram showing rating frequency patterns
- **Top & Bottom Performers** - Bar chart comparing class performance
- **Performance Heatmap** - Color-coded matrix showing design-category interactions
- **Rating vs Frequency** - Scatter plot with trend analysis
- **Design Correlations** - Correlation matrix between vibration designs

### **Bidirectional Filter Integration**

- **Algorithm Selection**: Select algorithms in FilterPanel to see performance in AlgorithmPerformanceSunburst
- **Category Navigation**: Navigate categories in AlgorithmPerformanceSunburst to filter results in FilterPanel
- **Subcategory Selection**: Click subcategories (e.g., "dog") to show only those sounds in FilterPanel
- **Multi-level Navigation**: Level 1 (Overview) → Level 2 (Algorithm) → Level 3 (Category) → Level 4 (Subcategory)
- **Smart State Management**: Automatic reset, context preservation, and visual feedback

### **Audio Playback Features**

- **Dual-View Player** - Simple and enhanced modes with waveform visualization
- **Vibration Design Playback** - All 6 designs per audio file with synchronized controls
- **A/B Comparison** - Side-by-side audio and vibration comparison

### **Research Assistant**

- **Quick Questions** - Pre-built queries for common research questions
- **Interactive Analysis** - Real-time statistical calculations and insights
- **Category-specific Insights** - Design performance comparisons across sound types

## 🔧 Development

### **Available Scripts**

```bash
# Frontend
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
npm run process-data   # Convert Excel to JSON
npm run generate-visualizations  # Generate analysis files
npm run generate-structure      # Create visualization structure

# Backend
cd backend
source venv/bin/activate
python app.py          # Start Flask server
```

### **Data Processing**

The application processes `audio1000_ratings.xlsx` to create:

- `public/data/ratings.json` - Main dataset in long format
- `public/data/summary.json` - Statistical summary
- `public/data/ratings.csv` - CSV version for debugging

### **Data Generation Scripts**

- **Excel Generator** - Creates detailed Excel files with multiple analysis sheets
- **ESC-50 CSV Generator** - Generates CSV files following ESC-50 dataset format
- **Data Processing** - Converts Excel to JSON format for web consumption

### **Component Architecture**

- **Modular React components** with TypeScript
- **Custom hooks** for data management
- **Responsive CSS** with mobile-first design
- **D3.js integration** for advanced visualizations
- **Flask API** for backend services
- **PyTorch models** for neural network inference

### **Bidirectional Connection Implementation**

- **Centralized State Management** in App.tsx with `connectedAlgorithm`, `connectedCategory`, `connectedSubcategory`
- **Event Handlers** for algorithm, category, and subcategory selection/deselection
- **Multi-level Navigation System** with automatic reset and context preservation
- **Smart Data Processing** with full dataset integration and real-time performance calculation
- **Visual Feedback System** with CSS classes for connected selections
- **Comprehensive Debug Logging** and error handling

### **Advanced D3.js Features**

- **Interactive visualizations** with gradient overlays and hover effects
- **Dynamic scaling** and responsive chart sizing
- **Real-time data updates** with custom tooltip system

## 🌐 Deployment

- **Frontend**: Netlify with Git-based deployment and automatic builds
- **Backend**: Deployable to AWS, Docker, or other platforms
- **Custom Domain**: Configure in Netlify DNS settings with automatic SSL

## 📈 Performance

- **Optimizations**: Lazy loading, pre-processed visualizations, CDN delivery
- **Browser Support**: Modern browsers with mobile responsive design
- **Neural Network Caching** for faster inference

## 🤝 Contributing

- **Development Setup**: Fork repository, create feature branch, submit pull request
- **Code Style**: TypeScript, ESLint, Prettier, component-based architecture
- **Backend**: Python PEP 8 standards

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎓 Research Applications

### **Academic Value**

- **ESC-50 Dataset Integration**: Leverages the Environmental Sound Classification dataset for standardized audio analysis
- **Hierarchical Category Analysis**: Enables research into vibration design performance across different sound categories
- **Interactive Data Exploration**: Facilitates hypothesis generation and pattern discovery in audio-vibration research
- **Real-time Statistical Analysis**: Provides immediate insights for research presentations and publications
- **Comparative Design Analysis**: Supports A/B testing and performance evaluation of vibration algorithms
- **Neural Network Integration**: Enables research into AI-powered audio-to-vibration translation

### **Research Features**

- **Class-specific Performance Tracking** across 50 ESC-50 classes
- **Bidirectional Filter Integration** for seamless data exploration
- **Algorithm Win Rate Analysis** with real-time calculations
- **Multi-level Data Exploration** from algorithm overview to individual sounds
- **Export-ready Visualizations** for academic papers
- **Comprehensive Data Coverage** with 6000+ ratings
- **AI Model Comparison** between traditional algorithms and neural networks

## 👨‍💻 Author

**Mainak Saha**

- Website: [mainaksaha.in](https://mainaksaha.in/)
- GitHub: [@mainaksaha07](https://github.com/mainaksaha07)

## 🙏 Acknowledgments

- **D3.js** for advanced data visualization
- **WaveSurfer.js** for audio waveform display
- **React** for the component framework
- **PyTorch** for neural network capabilities
- **EnCodec** for audio processing
- **Netlify** for hosting and deployment

---

**🎵 Explore the fascinating world of audio-vibration matching with this comprehensive research tool featuring both traditional algorithms and cutting-edge neural network models!**
