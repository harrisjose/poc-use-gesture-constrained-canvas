import { useEffect, useRef, useState } from 'react'
import './App.css'
import { useGesture } from '@use-gesture/react';

const sections = { a1x: {}, b2y: {}, c3z: {}, d4w: {} } as const

const CanvasConstants = {
  SectionWidth: 1660,
  SectionHeight: 1024,
  PaddingAround: 100,
  PaddingBetween: 100,
};


const computeInitialZoom = () => {
  // Get the viewport dimensions
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Get the total height needed for the section
  const totalSectionHeight = CanvasConstants.SectionHeight;  // Height of one section
  const totalHPadding = CanvasConstants.PaddingAround * 2;  // Padding above and below

  // Calculate the scale needed to fit the section vertically in the viewport
  // Formula: viewportHeight / contentHeight
  // This ensures the entire height (including padding) fits in the viewport
  const current = viewport.height / (totalSectionHeight + totalHPadding);

  return current;
}

const computeInitialPosition = (
  scale: number,
) => {
  // Calculate total width and height of the sections container
  const sectionCount = Object.keys(sections).length;
  const totalWidth = CanvasConstants.SectionWidth * sectionCount + 
    CanvasConstants.PaddingAround * 2 + 
    CanvasConstants.PaddingBetween * (sectionCount - 1);
  const totalHeight = CanvasConstants.SectionHeight + 
    CanvasConstants.PaddingAround * 2;

  // When using transform-origin: center center, the scaling creates an offset
  // that we need to compensate for to maintain top-left alignment
  const scaledWidth = totalWidth * scale;
  const scaledHeight = totalHeight * scale;
  
  return {
    x: (totalWidth - scaledWidth) / 2,
    y: (totalHeight - scaledHeight) / 2,
  };
};

const computeZoomBounds = (
) => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const sectionWidth = CanvasConstants.SectionWidth;
  const sectionCount = Object.keys(sections).length;
  const totalWPadding =
    CanvasConstants.PaddingAround * 2 +
    CanvasConstants.PaddingBetween * (sectionCount - 1);
  const totalSectionWidth = sectionCount * sectionWidth;

  const min = viewport.width / (totalSectionWidth + totalWPadding);
  const max = 1;

  return { min, max, };
};

function App() {

  const canvasRootRef = useRef<HTMLDivElement>(null);
  const sectionRootRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const zoom = computeInitialZoom();
    setScale(zoom);
    setPosition(computeInitialPosition(zoom));
  }, []);

  useGesture(
    {
      onPinch: (state) => {
        state.event.preventDefault();
        const pinchOriginX = state.origin[0];
        const pinchOriginY = state.origin[1];
        const newScale = state.offset[0];

        // Initialize memo with initial conditions
        const memo = state.memo ?? {
          bounds: sectionRootRef.current!.getBoundingClientRect(),
          initial: {
            x: position.x,
            y: position.y,
            scale: scale
          }
        };

        // Calculate the transform origin (center of the element)
        const transformOriginX = memo.bounds.x + memo.bounds.width / 2;
        const transformOriginY = memo.bounds.y + memo.bounds.height / 2;

        // Calculate displacement from transform origin to pinch point
        const displacementX = (transformOriginX - pinchOriginX) / memo.initial.scale;
        const displacementY = (transformOriginY - pinchOriginY) / memo.initial.scale;

        // Calculate the scale change
        const scaleDelta = newScale - memo.initial.scale;

        // Update position based on displacement and scale change
        const newPosition = {
          x: memo.initial.x - displacementX * scaleDelta,
          y: memo.initial.y - displacementY * scaleDelta
        };

        setScale(newScale);
        setPosition(newPosition);

        return memo;
      },
      onWheel: (state) => {
        state.event.preventDefault();

        setPosition({
          x: state.offset[0],
          y: state.offset[1],
        });
      },
    },
    {
      eventOptions: { passive: false },
      target: canvasRootRef,
      pinch: {
        from: () => [scale, 0],
        scaleBounds: () => computeZoomBounds(),
      },
      wheel: {
        from: () => [position.x, position.y],
      },
    }
  );

  return (
    <>
      <div
        ref={canvasRootRef}
        id="canvas-root"
        className="absolute top-0 left-0 w-full h-full z-0 touch-none flex items-center justify-start bg-[#FAF8F6]"
      >
        <div
          id="canvas-scale-wrapper"
          ref={sectionRootRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            left: -position.x,
            top: -position.y,
            gap: CanvasConstants.PaddingBetween,
            padding: CanvasConstants.PaddingAround,
          }}
          className={"flex w-fit overflow-visible absolute"}
        >
          {Object.keys(sections).map((sId) => (
            <div
              key={sId}
              className="shrink-0 bg-white border border-[#E0E0E0] rounded-lg"
              style={{
                width: CanvasConstants.SectionWidth,
                height: CanvasConstants.SectionHeight,
              }}
            ></div>
          ))}
        </div>
        <div className="absolute top-0 left-0 w-fit h-fit bg-green-200 opacity-45">
          <p className='flex text-sm'>Scale: {scale.toFixed(2)}</p>
          <p className='flex text-sm'>
            Position: {position.x.toFixed(2)}, {position.y.toFixed(2)}
          </p>
        </div>
      </div>
    </>
  )
}

export default App
