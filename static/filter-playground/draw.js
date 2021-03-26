const plotRange = 4; // [-2,2]

function drawAxis( canvas, canvasCtx )
{
  const width = canvas.width;
  const height = canvas.height;

  canvasCtx.strokeStyle = '#000000';
  canvasCtx.fillStyle = 'white';
  canvasCtx.fillRect( 0, 0, width, height );

  // x and y axis
  canvasCtx.beginPath();
  canvasCtx.moveTo( width/2, 0 );
  canvasCtx.lineTo( width/2, height );
  canvasCtx.stroke();

  canvasCtx.beginPath();
  canvasCtx.moveTo( 0, height/2 );
  canvasCtx.lineTo( width, height/2 );
  canvasCtx.stroke();

  // unit circle, diameter is 50% of the width==height
  let d = width * 1/(plotRange/2);
  canvasCtx.beginPath();
  canvasCtx.arc( width/2, height/2, d/2, 0, Math.PI*2 );
  canvasCtx.stroke();
}

function drawPlot( canvas, canvasCtx )
{
  const width = canvas.width;
  const height = canvas.height;

  canvasCtx.drawImage( canvas.offscreen, 0, 0 );

  function drawZero( r, i ) {
    let scale = width/plotRange;
    let x = width/2 + scale*r;
    let y = height/2 - scale*i;

    canvasCtx.strokeStyle = '#ff0000';
    canvasCtx.beginPath();
    canvasCtx.arc( x,y,5,0,Math.PI*2 );
    canvasCtx.stroke();
  }

  function drawPole( r, i ) {
    const b = 5;
    let scale = width/plotRange;
    let x = width/2 + scale*r;
    let y = height/2 - scale*i;

    canvasCtx.strokeStyle = '#ff0000';
    canvasCtx.beginPath();
    canvasCtx.moveTo( x+b, y+b );
    canvasCtx.lineTo( x-b, y-b );
    canvasCtx.stroke();

    canvasCtx.beginPath();
    canvasCtx.moveTo( x+b, y-b );
    canvasCtx.lineTo( x-b, y+b );
    canvasCtx.stroke();
  }

  for( const pole of poles ) {
    drawPole( pole.real, pole.im );
    drawPole( pole.real, -pole.im );
  }

  for( const zero of zeros ) {
    drawZero( zero.real, zero.im );
    drawZero( zero.real, -zero.im );
  }

  // always redo mathjax do we don't stutter when we actually need to do it
  window.requestAnimationFrame( () => drawPlot( canvas, canvasCtx, poles, zeros ) );
}

function startDrawing( poles, zeros )
{
  // lazy init these
  let canvas = document.getElementById( "plot" );
  let canvasCtx = canvas.getContext( "2d", { alpha: false } );

  // FIXME error if width!=height

  canvas.offscreen = document.createElement( 'canvas' );
  canvas.offscreen.width = canvas.width;
  canvas.offscreen.height = canvas.height;

  drawAxis( canvas.offscreen, canvas.offscreen.getContext( "2d" ) );

  window.requestAnimationFrame( () => drawPlot( canvas, canvasCtx, poles, zeros ) );
}
