// tracking mouse movement
var engaged = false;
var engagedIsPole = false;
var engagedIdx = -1;

function mouseDown( poles, zeros, event ) {
  let canvas = document.getElementById( "plot" );
  const rect = canvas.getBoundingClientRect()
  const width = canvas.width;
  const height = canvas.height;
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // figure out if there is a pole or zero here
  let scale = width/plotRange;
  const r = (x-width/2)/scale;
  const i = (height/2-y)/scale;

  var found = false;
  var foundIdx = 0;

  for( let idx = 0; idx < poles.length; ++idx ) {
    let pole = poles[idx];
    if( Math.abs( pole.real - r ) > 0.1 ) continue;
    if( Math.abs( pole.im - i ) > 0.1 ) continue;

    found = true;
    foundIdx = idx;
    break;
  }

  for( let idx = 0; idx < poles.length; ++idx ) {
    let pole = poles[idx].conj();
    if( Math.abs( pole.real - r ) > 0.1 ) continue;
    if( Math.abs( pole.im - i ) > 0.1 ) continue;

    found = true;
    foundIdx = idx;
    break;
  }

  if( found ) {
    engaged = true;
    engagedIsPole = true;
    engagedIdx = foundIdx;
    return;
  }

  for( let idx = 0; idx < zeros.length; ++idx ) {
    let zero = zeros[idx];
    if( Math.abs( zero.real - r ) > 0.1 ) continue;
    if( Math.abs( zero.im - i ) > 0.1 ) continue;
    found = true;
    pole = false;
    foundIdx = idx;
    break;
  }

  for( let idx = 0; idx < zeros.length; ++idx ) {
    let zero = zeros[idx].conj();
    if( Math.abs( zero.real - r ) > 0.1 ) continue;
    if( Math.abs( zero.im - i ) > 0.1 ) continue;
    found = true;
    pole = false;
    foundIdx = idx;
    break;
  }

  if( found ) {
    engaged = true;
    engagedIsPole = false;
    engagedIdx = foundIdx;
    return;
  }
}

function mouseMove( poles, zeros, event ) {
  if( !engaged ) return;

  let canvas = document.getElementById( "plot" );
  const rect = canvas.getBoundingClientRect()
  const width = canvas.width;
  const height = canvas.height;
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  let scale = width/plotRange;
  const r = (x-width/2)/scale;
  const i = (height/2-y)/scale;

  // change the location of the active thing
  if( engagedIsPole ) {
    poles[engagedIdx] = new Complex( r, i );
  }
  else {
    zeros[engagedIdx] = new Complex( r, i );
  }
}

function mouseUp( poles, zeros, event ) {
  // nothing to do here really, we've already done the updates
  engaged = false;
}

function setupMouse( poles, zeros ) {
  let canvas = document.getElementById( "plot" );

  canvas.addEventListener( 'mousedown', (ev) => mouseDown( poles, zeros, ev ), false );
  canvas.addEventListener( 'mousemove', (ev) => mouseMove( poles, zeros, ev ), false );
  canvas.addEventListener( 'mouseup',   (ev) => mouseUp( poles, zeros, ev ), false );
}
