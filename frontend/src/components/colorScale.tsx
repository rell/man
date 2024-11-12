import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import * as d3 from 'd3-scale';
import {Tooltip, OverlayTrigger } from 'react-bootstrap';

interface ColorLegendProps {
  type:string;
}
const ColorLegend: React.FC<ColorLegendProps> = ({type}) => {
  const markerScale = d3
    .scaleLinear<string>()
    .domain([0, 1 / 6, (1 / 6) * 2, (1 / 6) * 3, (1 / 6) * 4, (1 / 6) * 5, 1])
    .range([
    "blue",
    "teal",
    "green",
    "chartreuse",
    "yellow",
    "orange",
    "red",
  ]);

  const traceScale = d3.scaleLinear<string>()
    .domain([0, 1])
    .range(["#39FF14", "red"]);

  const ticks = Array.from({ length: 7 }, (_, i) => (i / 6).toFixed(1));

  const tickPositions = ticks.map((_, index) => {
    if (index === 0) {
      return `${55}%`; 
    } else if (index === ticks.length - 1) {
      return `${((index / (ticks.length - 1)) * 100) - 60}%`; 
    } else {
      return `${((index / (ticks.length - 1)) * 100)+1}%`; 
    }
  });

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 1000,
        pointerEvents: 'auto',
        width: '320px',
        padding: '5px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: '8px',
        boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 'bold', marginBottom: '8px' }}>
        Data Preview: {type} 
      </Typography>
      <OverlayTrigger
        placement="top" 
        overlay={<Tooltip id="tooltip-top">Marker Value Scale Legend</Tooltip>}
      >
      <Box
        sx={{
          marginTop: '8px',
          height: '12px',
          width: '260px',
          backgroundImage: `linear-gradient(to right, ${markerScale(0)}, ${markerScale(0.2)}, ${markerScale(0.4)}, ${markerScale(0.6)}, ${markerScale(0.8)}, ${markerScale(1)})`,
          border: '0.2px solid #333',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '1px',
            left: '-10px',
            width: '0',
            height: '0',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '8px solid grey',
            transform: 'rotate(-90deg)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '1px',
            right: '-10px',
            width: '0',
            height: '0',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '8px solid darkred',
            transform: 'rotate(90deg)',
          }}
        />
      </Box>
      </OverlayTrigger>
      
  
      <Box sx={{ position: 'relative', width: '280px', margin: '0 auto' }}>
        <Grid container justifyContent="space-between" sx={{ marginTop: `16px` }}>
          {ticks.map((tick, index) => (
            <Grid item key={index} sx={{ position: 'relative', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ position: 'relative', top: '-8px' }}>
                {tick}
              </Typography>
              <Box
                sx={{
                  position: 'absolute',
                  top: '-16px',
                  left: tickPositions[index],
                  width: '1px',
                  height: '5px',
                  backgroundColor: '#000000',
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      <OverlayTrigger
        placement="top" 
        overlay={<Tooltip id="tooltip-top">Cruise Trace Legend</Tooltip>}
      >
      <Box
        sx={{
          marginTop: '16px',
          height: '12px',
          width: '280px',
          backgroundImage: `linear-gradient(to right, ${traceScale(0)}, ${traceScale(0.2)}, ${traceScale(0.4)}, ${traceScale(0.6)}, ${traceScale(0.8)}, ${traceScale(1)})`,
          border: '1px solid #333',
          margin: '0 auto',
          position: 'relative',
        }}
      >
      </Box>
      </OverlayTrigger>
      <Grid container justifyContent="space-between" sx={{ width: '280px', marginTop: '20px', margin: '0 auto' }}>
        <Typography variant="caption">Start</Typography>
        <Typography variant="caption">End</Typography>
      </Grid>
    </Box>
  );
};

export default ColorLegend;

