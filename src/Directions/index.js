import React from 'react';
import MapViewDirections from 'react-native-maps-directions';

const Directions = ({
  destination,
  origin,
  waypoints,
  onReady,
  onError,
  mode,
  color,
  width,
}) => (
  <MapViewDirections
    destination={destination}
    origin={origin}
    waypoints={waypoints}
    onReady={onReady}
    apikey="AIzaSyDJANTANzQey3Qe8yBpjbskbyH7KnuOqws"
    strokeWidth={width}
    strokeColor={color}
    splitWaypoints={true}
    optimizeWaypoints={true}
    precision="high"
    timePrecision="now"
    mode={mode}
    onError={onError}
    resetOnChange={false}
  />
);

export default Directions;
