# Audio-Vibration Rating Explorer

An interactive web application for exploring how well four vibration designs match real-world sounds, with interactive charts, audio/vibration playback, and waveform inspection.

## Features

- **Overview Dashboard**: View average ratings across all vibration designs
- **Category Analysis**: Explore ratings by sound categories (Human Speech, Music, Nature Sounds, etc.)
- **Class Detail View**: Deep dive into specific audio classes with interactive audio players
- **Research Assistant Chatbot**: Ask questions about vibration design preferences and get data-driven insights
- **Audio Playback**: Listen to original sound recordings and their corresponding vibration designs
- **Waveform Visualization**: Visual representation of audio waveforms using WaveSurfer.js
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Charts**: Recharts for data visualization
- **Audio**: WaveSurfer.js for waveform display and audio playback
- **Data Processing**: Node.js with xlsx for Excel file processing
- **Deployment**: Netlify for static site hosting

## Project Structure

```
├── public/
│   ├── audio/           # Original audio files
│   ├── vibration/       # Vibration design files
│   └── data/           # Processed JSON data
├── src/
│   ├── components/     # React components
│   ├── utils/         # API and data helper functions
│   └── App.tsx        # Main application
├── scripts/
│   └── process-data.js # Data processing script
└── netlify.toml       # Netlify configuration
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd audio-vibration-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Process the data**
   ```bash
   npm run process-data
   ```
   This will read the Excel file and generate the JSON data files.

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Data Processing

The application processes the `audio1000_ratings.xlsx` file to create:

- `public/data/ratings.json` - Transformed data in long format
- `public/data/summary.json` - Summary statistics
- `public/data/ratings.csv` - CSV version for debugging

### Data Structure

The processed data includes:
- **4 vibration designs**: freqshift, hapticgen, percept, pitchmatch
- **1000 real-world sound recordings** with ratings for each design
- **8 audio classes** (A-H) mapped to categories
- **Rating scale**: 0-100 for each design

## Usage

### Overview View
- Shows average ratings across all vibration designs
- Displays summary statistics
- Provides a high-level comparison

### Category View
- Select a category from the dropdown
- View detailed ratings for that category
- Compare performance across designs

### Class View
- Select a specific audio class
- View individual sound recordings with their ratings
- Play original sounds and vibration designs
- Compare waveforms visually

### Research Assistant Chatbot
- Ask questions about vibration design preferences
- Get instant data-driven insights
- Explore which designs are consistently preferred
- Analyze category-specific and class-specific preferences
- Quick question buttons for common research questions

### Audio Playback
- Click play buttons to listen to sound recordings
- View real-time waveform visualization
- Compare original sounds with vibration designs
- See time progress and duration

## Deployment

### Netlify Deployment

1. **Connect to Git repository**
   - Push your code to GitHub/GitLab
   - Connect the repository to Netlify

2. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment variables** (if needed)
   - Add any required environment variables in Netlify dashboard

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder**
   - Upload to any static hosting service
   - Ensure all audio files are accessible

## File Organization

### Audio Files
- Original sound recordings: `public/audio/`
- Vibration files: `public/vibration/`
- File naming: `{id}-vib-{design}.wav`

### Data Files
- Excel source: `audio1000_ratings.xlsx`
- Processed JSON: `public/data/ratings.json`
- Summary stats: `public/data/summary.json`

## Development

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **Data Helpers**: Extend `src/utils/dataHelpers.ts`
3. **API Functions**: Add to `src/utils/api.ts`

### Styling
- Main styles: `src/App.css`
- Responsive design included
- Modern gradient design

### Data Processing
- Script: `scripts/process-data.js`
- Run with: `npm run process-data`
- Updates JSON files in `public/data/`

## Troubleshooting

### Common Issues

1. **Audio files not loading**
   - Check that files are in `public/audio/` and `public/vibration/`
   - Verify file permissions
   - Check browser console for 404 errors

2. **Data not loading**
   - Run `npm run process-data` to regenerate JSON files
   - Check that Excel file is in the root directory
   - Verify JSON files are in `public/data/`

3. **WaveSurfer not working**
   - Check browser compatibility
   - Ensure audio files are valid WAV format
   - Check for CORS issues in development

### Performance

- Sound files are loaded on-demand
- WaveSurfer instances are destroyed when components unmount
- Large audio files may take time to load

## License

This project is for educational and research purposes.

## Author

**Mainak Malay Saha**
- Email: msaha4@asu.edu
- Website: [mainaksaha.in](https://mainaksaha.in)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all dependencies are installed
- Verify data processing has completed successfully
