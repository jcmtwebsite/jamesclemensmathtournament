/* Shared tangram geometry and piece colours.
   index.html's engine and 404.html's single figure both read this, so the
   coordinates only ever live in one place. Coordinates are on the 4x4 grid
   of the square; index.html centres and re-poses them at runtime. */
window.JCMT_TANGRAM = (function () {
  var IDS = ['LT1', 'LT2', 'MT', 'ST1', 'ST2', 'SQ', 'PG'];
  var COL = { LT1: '#1D3160', LT2: '#6FA8DC', MT: '#EE5A3C', ST1: '#F6B72B', ST2: '#23A07A', SQ: '#F3A6B8', PG: '#7A5AC8' };
  var TYPE = { LT1: 'tri', LT2: 'tri', MT: 'tri', ST1: 'tri', ST2: 'tri', SQ: 'sq', PG: 'pg' };
  var sq = {
    LT1: [[0, 0], [4, 0], [2, 2]],
    LT2: [[0, 0], [2, 2], [0, 4]],
    ST1: [[4, 0], [4, 2], [3, 1]],
    SQ: [[2, 2], [3, 1], [4, 2], [3, 3]],
    ST2: [[2, 2], [3, 3], [1, 3]],
    PG: [[0, 4], [1, 3], [3, 3], [2, 4]],
    MT: [[4, 2], [4, 4], [2, 4]]
  };
  var k2 = Math.SQRT1_2;
  var RAW = {
    square: Object.fromEntries(IDS.map(function (id) { return [id, sq[id].map(function (p) { return [p[0] * k2, p[1] * k2]; })]; })),
    house: { LT1: [[0, 2], [2, 2], [0, 4]], LT2: [[2, 2], [2, 4], [0, 4]], ST1: [[-1, 2], [0, 1], [0, 2]], SQ: [[1, 2], [0, 2], [0, 1], [1, 1]], ST2: [[1, 2], [1, 1], [2, 2]], PG: [[3, 2], [2, 2], [1, 1], [2, 1]], MT: [[0, 1], [1, 0], [2, 1]] },
    arrow: { LT1: [[2, 2], [0, 2], [2, 0]], LT2: [[0, 2], [0, 0], [2, 0]], ST1: [[3, 2], [2, 3], [2, 2]], SQ: [[1, 2], [2, 2], [2, 3], [1, 3]], ST2: [[1, 2], [1, 3], [0, 2]], PG: [[-1, 2], [0, 2], [1, 3], [0, 3]], MT: [[2, 3], [1, 4], [0, 3]] },
    hourglass: { ST1: [[3, 0], [2, 1], [2, 0]], SQ: [[1, 0], [2, 0], [2, 1], [1, 1]], ST2: [[1, 0], [1, 1], [0, 0]], PG: [[-1, 0], [0, 0], [1, 1], [0, 1]], MT: [[2, 1], [1, 2], [0, 1]], LT1: [[1, 2], [1, 4], [-1, 4]], LT2: [[1, 2], [3, 4], [1, 4]] },
    boat: { LT1: [[2, 0], [2, 2], [0, 2]], LT2: [[2, 0], [4, 2], [2, 2]], PG: [[-1, 2], [0, 2], [1, 3], [0, 3]], ST1: [[0, 2], [1, 2], [1, 3]], SQ: [[1, 2], [2, 2], [2, 3], [1, 3]], ST2: [[2, 2], [3, 3], [2, 3]], MT: [[2, 2], [4, 2], [3, 3]] }
  };
  return { IDS: IDS, COL: COL, TYPE: TYPE, sq: sq, RAW: RAW };
})();
