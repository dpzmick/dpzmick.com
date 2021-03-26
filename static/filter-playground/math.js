function Complex( real, im ) {
  this.real = real;
  this.im   = im;
  return Object.freeze( this ); // immutable
}

Complex.prototype.add = function( other ) {
  return new Complex( this.real+other.real, this.im+other.im );
}

Complex.prototype.mul = function( other ) {
  // (r1 + c1i)*(r2 + c2i)
  // = (r1)(r2) + (c1)(r2)i + (r1)(c2)i - (c1)(c2)
  // = (r1)(r2) - (c1)(c2) + (c1)(r2)i + (r1)(c2)i

  let real = this.real*other.real - this.im*other.im;
  let im   = this.real*other.im   + this.im*other.real;
  return new Complex( real, im );
}

Complex.prototype.div = function( other ) {
  // (r1 + c1i) / (r1 + c2i)
  // (r1 + c1i)*(r1 - c2i) / (r1+c2i)*(r1-c2i)
  // ...                   / (r1)(r1) + -(c2)(c2)

  let numer = this.mul( other.conj() )
  let denom = other.mul( other.conj() ); // only real

  console.log( numer );
  console.log( denom );

  let real = numer.real / denom.real;
  let im   = numer.im  / denom.real;
  return new Complex( real, im );
}

Complex.prototype.conj = function() {
  return new Complex( this.real, -this.im );
}

Complex.prototype.ipower = function( i ) {
  // other must be integer
  let ret = new Complex( 1, 0 );
  for( ; i > 0; --i ) {
    ret = ret.mul( this );
  }
  return ret;
}

function conv( a, b )
{
  var out = new Array( a.length + b.length-1 );
  for( let n = 0; n < a.length + b.length - 1; ++n ) {
    out[n] = new Complex( 0, 0 );

    for( let k = 0; k < Math.max( a.length, b.length ) && n >= k; ++k ) {
      let _a = (k < a.length) ? a[k] : new Complex( 0, 0 );
      let _b = (n-k < b.length) ? b[n-k] : new Complex( 0, 0 );
      out[n] = out[n].add( _a.mul( _b ) );
    }
  }

  return out;
}

// (1-q1/z)(1-q2/z) -> 1 + a/z + b/z^2
function generate_poly( roots )
{
  let one = new Complex( 1, 0 );
  let negative_one = new Complex( -1, 0 );

  let coefs = [ new Complex( 1, 0 ) ];
  for( let i = 0; i < roots.length; ++i ) {
    let term = [ one, roots[i].mul( negative_one ) ];
    coefs = conv( coefs, term );
  }

  return coefs;
}

// eval a + b/z + c/z^2 + ...
function eval_poly( coefs, z )
{
  let one = new Complex( 1, 0 );
  let result = new Complex( 0, 0 );
  for( let power = 0; power < coefs.length; ++power ) {
    let term = coefs[power].mul( one.div( z.ipower( power ) ));
    result = result.add( term );
  }
  return result;
}
