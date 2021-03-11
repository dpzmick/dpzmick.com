const AudioContext = window.AudioContext || window.webkitAudioContext;

// lazy init, probably that is a bad thing
var canvas;
var canvasCtx;

const plotRange = 4; // [-2,2]

var poles = [];
var zeros = [];

// tracking mouse movement
var engaged = false;
var engagedIsPole = false;
var engagedIdx = -1;

function mouseDown(event) {
    const rect = canvas.getBoundingClientRect()
    const width = canvas.width;
    const height = canvas.height;
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // figure out if there is a pole or zero here
    let scale = width/plotRange;
    const r = (x-width/2)/scale;
    const i = (height/2-y)/scale;

    // FIXME maybe compare before unscaling? hard to set the right threshold for
    // bounding box comparing in r,i coordinates

    var found = false;
    var foundIdx = 0;

    for (let idx = 0; idx < poles.length; ++idx) {
        let pole = poles[idx];
        if (Math.abs(pole[0] - r) > 0.1) continue;
        if (Math.abs(pole[1] - i) > 0.1) continue;
        found = true;
        foundIdx = idx;
        break;
    }

    if (found) {
        engaged = true;
        engagedIsPole = true;
        engagedIdx = foundIdx;
        return;
    }

    for (let idx = 0; idx < zeros.length; ++idx) {
        let zero = zeros[idx];
        if (Math.abs(zero[0] - r) > 0.1) continue;
        if (Math.abs(zero[1] - i) > 0.1) continue;
        found = true;
        pole = false;
        foundIdx = idx;
        break;
    }

    if (found) {
        engaged = true;
        engagedIsPole = false;
        engagedIdx = foundIdx;
        return;
    }
}

function mouseMove(event) {
    if (!engaged) return;

    // hopefully this is fast enough to run inline

    const rect = canvas.getBoundingClientRect()
    const width = canvas.width;
    const height = canvas.height;
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    let scale = width/plotRange;
    const r = (x-width/2)/scale;
    const i = (height/2-y)/scale;

    // change the location of the active thing
    if (engagedIsPole) {
        poles[engagedIdx] = [r,i];
    }
    else {
        zeros[engagedIdx] = [r,i];
    }

    // FIXME also move congugate

    // if none are pending, start a timer to adjust the filter
}

function mouseUp() {
    // nothing to do here really, we've already done the updates
    engaged = false;
}

function addPole() {
    poles.push( [0,0] );

    // FIXME need to add congugate pair?
}

function addZero() {
    zeros.push( [0,0] );

    // FIXME need to add congugate pair?
}

function engage() {
    // lazy init these
    canvas = document.getElementById("plot");
    canvasCtx = canvas.getContext("2d");

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    window.requestAnimationFrame(drawPlot);
}

function drawPlot() {
    const width = canvas.width;
    const height = canvas.height;
    // FIXME error if width!=height

    canvasCtx.strokeStyle = '#000000';
    canvasCtx.clearRect(0, 0, width, height);

    // x and y axis
    canvasCtx.beginPath();
    canvasCtx.moveTo(width/2, 0);
    canvasCtx.lineTo(width/2, height);
    canvasCtx.stroke();

    canvasCtx.beginPath();
    canvasCtx.moveTo(0, height/2);
    canvasCtx.lineTo(width, height/2);
    canvasCtx.stroke();

    // unit circle, diameter is 50% of the width==height
    let d = width * 1/(plotRange/2);
    canvasCtx.beginPath();
    canvasCtx.arc(width/2, height/2, d/2, 0, Math.PI*2);
    canvasCtx.stroke();

    function drawZero(r,i) {
        let scale = width/plotRange;
        let x = width/2 + scale*r;
        let y = height/2 - scale*i;

        canvasCtx.strokeStyle = '#ff0000';
        canvasCtx.beginPath();
        canvasCtx.arc(x,y,5,0,Math.PI*2);
        canvasCtx.stroke();
    }

    function drawPole(r,i) {
        const b = 5;
        let scale = width/plotRange;
        let x = width/2 + scale*r;
        let y = height/2 - scale*i;

        canvasCtx.strokeStyle = '#ff0000';
        canvasCtx.beginPath();
        canvasCtx.moveTo(x+b, y+b);
        canvasCtx.lineTo(x-b, y-b);
        canvasCtx.stroke();

        canvasCtx.beginPath();
        canvasCtx.moveTo(x+b, y-b);
        canvasCtx.lineTo(x-b, y+b);
        canvasCtx.stroke();
    }

    for (const pole of poles) {
        drawPole( pole[0], pole[1] );
    }

    for (const zero of zeros) {
        drawZero( zero[0], zero[1] );
    }

    window.requestAnimationFrame(drawPlot);
}

function start() {
    const audioCtx = new AudioContext();
    const sampleRate = audioCtx.sampleRate;

    // create some white noise
    const whiteNoiseBuffer = audioCtx.createBuffer(1, sampleRate, sampleRate);
    const output = whiteNoiseBuffer.getChannelData(0);
    for (var i = 0; i < whiteNoiseBuffer.length; ++i) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    let source = audioCtx.createBufferSource()
    source.buffer = whiteNoiseBuffer;
    source.loop = true;

    // well this is a pain, for some reason this buffer has to be large
    let b = audioCtx.createBuffer(1, sampleRate, sampleRate);
    let buf = b.getChannelData(0);

    for (let i = 0; i < sampleRate/32; ++i) {
        buf[i] = 1;
    }

    // let filter = audioCtx.createConvolver();
    // filter.buffer = b;
    // filter.normalize = false;

    let pannerL = new StereoPannerNode(audioCtx, { pan: -1 });
    let pannerR = new StereoPannerNode(audioCtx, { pan: +1 });

    let fwd = [0.00020298, 0.0004059599, 0.00020298];
    let bwd = [1.0126964558, -1.9991880801, 0.9873035442];
    let filter = new IIRFilterNode(audioCtx, {feedforward: fwd, feedback: bwd});

    source.connect(pannerR);
    source.connect(filter);
    filter.connect(pannerL);
    pannerL.connect(audioCtx.destination);
    pannerR.connect(audioCtx.destination);

    source.start()

    // figure out how to make a UI to explore adding poles/zeros
    // then move them around

    // maybe have to always factor FIR into IIR or something for ease
}
