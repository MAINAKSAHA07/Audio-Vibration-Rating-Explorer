# Audio-Vibration Rating Explorer

An advanced interactive web application for exploring how well four vibration designs match real-world sounds, featuring comprehensive data visualization, audio/vibration playback, waveform analysis, and AI-powered research assistance.

## 🌐 **Live Demo**

**Visit the live application:** [https://audiovibration.netlify.app/](https://audiovibration.netlify.app/)

Experience all features including the comprehensive dashboard, audio playback, AI research assistant, and interactive visualizations.

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
- **Vibration design playback** for all 4 designs per audio file
- **Simple and enhanced player modes** with different control interfaces
- **Time synchronization** between audio and vibration playback
- **Spectrogram visualization** for frequency analysis

### 📈 **Data Visualization**
- **Overview Chart** - Average ratings across all vibration designs
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

### 🎯 **Interactive Navigation**
- **7 main views** with emoji-enhanced navigation
- **Filter controls** for category and class selection
- **Responsive design** for desktop and mobile devices
- **Real-time data loading** with progress indicators

## 🛠️ Tech Stack

### **Frontend**
- **React.js 19.1.0** with TypeScript
- **D3.js 7.9.0** for advanced data visualization
- **Recharts 3.1.0** for standard charts
- **WaveSurfer.js 7.10.1** for audio waveform display
- **CSS3** with responsive design and animations

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
│   │   ├── FilterControls.tsx         # Navigation controls
│   │   ├── OverviewChart.tsx          # Overview visualization
│   │   ├── CategoryChart.tsx          # Category analysis
│   │   ├── ClassDetail.tsx            # Class-specific view
│   │   ├── AudioPlayer.tsx            # Audio playback component
│   │   ├── SimpleAudioPlayer.tsx      # Basic audio controls
│   │   ├── DualViewPlayer.tsx         # Advanced dual-view player
│   │   ├── ResearchChatbot.tsx        # AI assistant (464 lines)
│   │   ├── VolcanoContourPlot.tsx     # Creative visualization
│   │   ├── RadialStackedBarChart.tsx  # Radial chart component
│   │   ├── GeneratedVisualizations.tsx # Pre-processed analysis
│   │   ├── VisualizationGrid.tsx      # Grid layout for charts
│   │   ├── SpectrogramView.tsx        # Frequency analysis
│   │   └── DataTest.tsx               # Data validation component
│   ├── utils/         # Helper functions
│   │   ├── api.ts         # Data fetching and interfaces
│   │   └── dataHelpers.ts # Data processing utilities
│   ├── App.tsx        # Main application component
│   └── App.css        # Comprehensive styling (2065 lines)
├── scripts/
│   ├── process-data.js                # Excel to JSON conversion
│   ├── generate-visualizations.js     # Pre-processing analysis
│   └── generate-visualization-structure.js # Structure generation
├── audio_vibration/   # Raw audio data
│   ├── audio/         # Original sound files
│   └── vibration/     # Vibration design files
├── audio1000_ratings.xlsx # Source Excel data
└── netlify.toml       # Deployment configuration
```

## 🎵 Data Structure

### **Audio Dataset**
- **1000 real-world sound recordings** with ratings for each design
- **4 vibration designs**: freqshift, hapticgen, percept, pitchmatch
- **8 audio classes** (A-H) mapped to categories
- **Rating scale**: 0-100 for each design
- **Categories**: Human Speech (78.7%), Music (14.1%), Nature Sounds (4.4%), Machinery (1.6%), Household (0.6%), Electronics (0.3%), Transportation (0.1%), Alarms (0.2%)

### **Processed Data**
- **4000 total ratings** (1000 files × 4 designs)
- **JSON format** for web consumption
- **CSV backup** for debugging and analysis
- **Summary statistics** for quick insights

## 🚀 Setup Instructions

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- Git for version control

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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

## 📊 Usage Guide

### **Navigation Views**

1. **📈 Overview** - High-level summary with average ratings
2. **📊 Dashboard** - Comprehensive 6-chart dashboard
3. **🏷️ By Category** - Filter and analyze by sound category
4. **🎓 By Class** - Deep dive into specific audio classes
5. **📊 All Visualizations** - Pre-generated waveform analysis
6. **🎨 Creative Visualizations** - Advanced D3.js charts
7. **🤖 Research Assistant** - AI-powered data insights

### **Dashboard Features**

#### **Category Distribution**
- Interactive pie chart showing sound type breakdown
- Color-coded segments with percentage labels
- Legend with detailed category information

#### **Rating Distribution**
- Histogram showing rating frequency patterns
- Interactive bars with hover effects
- Statistical analysis of rating distribution

#### **Top & Bottom Performers**
- Bar chart comparing class performance
- Color-coded top performers (red) vs bottom performers (blue)
- Value labels on each bar for precise reading

#### **Performance Heatmap**
- Color-coded matrix showing design-category interactions
- Interactive cells with tooltips
- Gradient legend for rating interpretation

#### **Rating vs Frequency**
- Scatter plot showing rating trends
- Trend line for pattern analysis
- Interactive points with detailed information

#### **Design Correlations**
- Correlation matrix between vibration designs
- Color-coded correlation strength
- Statistical significance indicators

### **Audio Playback Features**

#### **Dual-View Player**
- **Simple Mode**: Basic play/pause controls with time display
- **Enhanced Mode**: Full waveform visualization with real-time cursor
- **Dual View**: Side-by-side audio and vibration comparison
- **Spectrogram**: Frequency analysis visualization

#### **Vibration Design Playback**
- All 4 designs available per audio file
- Synchronized playback controls
- Individual design rating display
- A/B comparison capabilities

### **Research Assistant**

#### **Quick Questions**
- "Which vibration design is most preferred overall?"
- "What are the top performing designs by category?"
- "Show me the most consistent vibration design"
- "Which design works best for human speech?"

#### **Interactive Analysis**
- Real-time statistical calculations
- Category-specific insights
- Design performance comparisons
- Correlation analysis

## 🔧 Development

### **Available Scripts**
```bash
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
npm run process-data   # Convert Excel to JSON
npm run generate-visualizations  # Generate analysis files
npm run generate-structure      # Create visualization structure
```

### **Data Processing**
The application processes `audio1000_ratings.xlsx` to create:
- `public/data/ratings.json` - Main dataset in long format
- `public/data/summary.json` - Statistical summary
- `public/data/ratings.csv` - CSV version for debugging

### **Component Architecture**
- **Modular React components** with TypeScript
- **Custom hooks** for data management
- **Responsive CSS** with mobile-first design
- **D3.js integration** for advanced visualizations

## 🌐 Deployment

### **Netlify Deployment**
1. **Connect to Git repository**
   - Push code to GitHub/GitLab
   - Connect repository to Netlify

2. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment variables** (if needed)
   - Configure in Netlify dashboard

### **Custom Domain**
- Configure in Netlify DNS settings
- SSL certificate automatically provided

## 📈 Performance

### **Optimizations**
- **Lazy loading** for large audio files
- **Pre-processed visualizations** for faster loading
- **Responsive images** and optimized assets
- **CDN delivery** for global performance

### **Browser Support**
- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile responsive** design
- **Progressive Web App** features

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Component-based** architecture

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Mainak Saha**
- Website: [mainaksaha.in](https://mainaksaha.in/)
- GitHub: [@mainaksaha](https://github.com/mainaksaha07)

## 🙏 Acknowledgments

- **D3.js** for advanced data visualization
- **WaveSurfer.js** for audio waveform display
- **React** for the component framework
- **Netlify** for hosting and deployment

---

**🎵 Explore the fascinating world of audio-vibration matching with this comprehensive research tool!**
