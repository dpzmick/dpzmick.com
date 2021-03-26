// NOTE: conjugates are implicitly injected
var poles = [];
var zeros = [];

function engage()
{
  setupMouse( poles, zeros );
  startDrawing( poles, zeros );
  setInterval( updateFilter, 100 );
}

function addPole()
{
  poles.push( new Complex( 0, 0 ) );
}

function addZero()
{
  zeros.push( new Complex( 0, 0 ) );
}

function updateFilter()
{
  let z = [];
  let p = [];

  for( const zero of zeros ) {
    z.push( zero );
    z.push( zero.conj() );
  }

  for( const pole of poles ) {
    p.push( pole );
    p.push( pole.conj() );
  }

  // regenerate the polynomial
  let a = generate_poly( p );
  let b = generate_poly( z );

  // all coefs are real here (we have the conjugates)
  // so realify them, and also round them to something sorta sane
  // also, need to normalize so that signal of all 1, 1, 1, 1 doens't clip

  let sum = 0;
  for( let i = 0; i < a.length; ++i ) {
    a[i] = a[i].real;
    sum += a[i];
  }

  for( let i = 0; i < a.length; ++i ) {
    a[i] = a[i]/sum;
    a[i] = Math.round( (a[i] + Number.EPSILON) * 100 ) / 100;
  }

  sum = 0;
  for( let i = 0; i < b.length; ++i ) {
    b[i] = b[i].real;
    sum += b[i];
  }

  for( let i = 0; i < b.length; ++i ) {
    b[i] = b[i]/sum;
    b[i] = Math.round( (b[i] + Number.EPSILON) * 100 ) / 100;
  }

  // generate some LaTeX
  let str = '$$ H(z) = \\frac{';
  for( let i = 0; i < b.length; ++i ) {
    if( i==0 ) str += ` ${b[i]}`
    else       str += ` + ${b[i]} z^{-${i}}`
  }
  str += '}{'
  for( let i = 0; i < a.length; ++i ) {
    if( i==0 ) str += ` ${a[i]}`
    else       str += ` + ${a[i]} z^{-${i}}`
  }
  str += '} $$';

  let eq = document.getElementById( 'equation' );
  eq.innerHTML = str;
  renderMathInElement( eq );

  updateAudio( b, a );
}
