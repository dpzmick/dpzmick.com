const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const noise = makeWhiteNoise();
var filter;
var running;

function makeWhiteNoise()
{
  const bufferSize = 2 * audioCtx.sampleRate;
  const noise = audioCtx.createBuffer( 1, bufferSize, audioCtx.sampleRate );
  const output = noise.getChannelData( 0 );
  const bs = audioCtx.createBufferSource();

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  bs.buffer = noise;
  bs.loop = true;
  return bs;
}

function makeFilter( fwd, back )
{
  if( back.length == 0 ) back = [0.00001]; // fake it
  const filter = new IIRFilterNode( audioCtx, { feedforward: fwd, feedback: back } );
  return filter;
}

function updateAudio( fwd, back )
{
  if( !running ) return;

  let old = filter;
  filter = makeFilter( fwd, back );
  old.disconnect()
  noise.connect( filter );
  filter.connect( audioCtx.destination );
}

function startAudio()
{
  filter = makeFilter( [1], [] );
  noise.connect( filter );
  filter.connect( audioCtx.destination );
  noise.start();
  running = true;
}
