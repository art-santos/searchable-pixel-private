interface Window {
  VANTA: {
    BIRDS: (options: VantaBirdsOptions) => VantaBirds;
  }
  THREE: any;
}

declare module 'vanta/dist/vanta.birds.min.js' {
  interface VantaBirdsOptions {
    el: HTMLElement | null;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number;
    color1?: number;
    color2?: number;
    colorMode?: string;
    birdSize?: number;
    wingSpan?: number;
    speedLimit?: number;
    separation?: number;
    alignment?: number;
    cohesion?: number;
    quantity?: number;
    backgroundAlpha?: number;
    THREE?: any;
  }

  interface VantaBirds {
    destroy: () => void;
    setOptions: (options: Partial<VantaBirdsOptions>) => void;
  }

  function BIRDS(options: VantaBirdsOptions): VantaBirds;
  
  export default BIRDS;
}

declare module 'vanta/dist/vanta.globe.min.js'; 