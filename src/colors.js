// Create a custom color scale using the provided hex colors
const customColors = [
  "#F48FB1", // FreqShift - pink
  "#91b7f3", // HapticGen - blue
  "#F4CD62", // Percept - yellow
  "#D6A3DC"  // PitchMatch - lavender
];

export default function colors(index) {
  return customColors[index % customColors.length];
}
