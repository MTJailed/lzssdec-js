var state = new Array(); state["COPYFROMDICT"] = 0; state["EXPECTINGFLAG"] = 1; state["PROCESSFLAGBIT"] = 2; state["EXPECTING2NDBYTE"] = 3;
var _state;
var _flags;
var _bitnr;
var _src, _srcend;
var _dst, _dstend;
var _fistbyte;

var _dict;

var _dictsize;
var _maxmatch;
var _copythreshold;

var _dictptr;

var _copyptr;
var _copycount;

var _inputoffset;
var _outputoffset;

function reset()
{
	_state = state["EXPECTINGFLAG"];
	_flags = 0; _bitnr = 0;
	_src, _srcend, _dst, _dstend = 0;
	_dict = new Uint8Array(_dictsize+_maxmatch-1);
	_dictptr = _dictsize - _maxmatch;
	_inputoffset = 0;
	_outputoffset = 0;
	_firstbyte = 0;
	_copyptr = 0;
	_copycount = 0;
}


function lzssdecompress() {
	    _maxmatch= 18;  // 4 bit size + threshold 
        _dictsize= 4096; // 12 bit size
        _copythreshold= 3; // 0 == copy 3 bytes
        _dict= new Uint8Array(_dictsize+_maxmatch-1);
        reset();
}

function decompress(dst, dstlen, pdstused, src, srclen, psrcused)
{
	_src = src; _srcend = _src+srclen;
	_dst = dst; _dstend = dst+dstlen;
	while (_src<_srcend && _dst<_dstend)
	{
		switch(_state)
		{
			case state["EXPECTINGFLAG"]:
				_flags = _src++;
				_inputoffset++;
				_bitnr = 0;
				_state = state["PROCESSFLAGBIT"];
				break;
			case state["PROCESSFLAGBIT"]:
				if(_flags & 1) {
					var arr = _dst;
					arr[arr.length+1] = _src[_src.length+1];
					addtodict(arr);
					_inputoffset++;
					_outputoffset++;
					nextflagbit();
				} else {
					_firstbyte = _src++;
					_inputoffset++;
					_state = state["EXPECTING2NDBYTE"];
				}
				break;
			case state["EXPECTING2NDBYTE"]:
				var secondbyte = stringToUTF8Array(src++);
				_inputoffset++;
				setcounter(_firstbyte, secondbyte);
				_state = state["COPYFROMDICT"];
				break;
			case state["COPYFROMDICT"]:
				copyfromdict();
				break;
		}
	}
}


function flush(dst, dstlen, pdstused)
{
	_src, _srcend = null;
	_dst = dst; _dstend = dst+dstlen;
	if(_state==state["COPYFROMDICT"])
		copyfromdict();
	if(pdstused)
		pdstused = _dst-dst;
}

function copyfromdict()
{
	while(_dst<_dstend && _copycount)
	{
		var arr = _dst;
		arr[arr.length+1] = _dict[_copyptr++];
		addtodict(arr);
		_outputoffset++;
		_copycount--;
		_copyptr = _copyptr & (_dictsize-1);
	}
	if(_copycount==0)
		nextflagbit();
}

function dumpcopydata()
{
	for(var i = 0; i < _copycount; i++)
		console.log(_dictsize[(_copyptr+1)&(_dictsize-1)]);
}

function addtodict(c)
{
	_dict[_dictptr++] = c;
	_dictptr = _dictptr&(_dictsize-1);
}

function nextflagbit()
{
	_bitnr++;
	_flags>>=1;
	if(_bitnr == 8)
	{
		_state = _state["EXPECTINGFLAG"];
	} else {
		_state = _state["PROCESSFLAGBIT"];
	}
}

function setcounter(first, second)
{
	_copyptr = first | ((second&0xf0)<<4);
	_copycount = _copythreshold + (second&0xf);
}

function stringToUTF8Array(str) {
	if(typeof str != 'string') {
		return null;
	} else {
		var encoder = new TextEncoder("utf-8");
		var UTF8String = encoder.encode(str);
		return UTF8String;
	}
}

function main()
{
	var skipbytes = 0;
}
