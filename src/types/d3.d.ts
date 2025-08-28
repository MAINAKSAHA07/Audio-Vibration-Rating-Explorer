import * as d3 from 'd3';

// D3.js type compatibility fixes
declare module 'd3' {
  interface Axis<Domain> {
    (context: any): void;
  }
} 