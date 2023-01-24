/**
   data: { axes: [], points: [] }
   canv: canvas
   style: { color: String, lineThickness: Number }
 */
function plotData(data, canv, style) {
    _plotClear(canv);
    if (!data || data.length < 1) return
    const sortedData = [...data.points]
    sortedData.sort((x, y) => x[0] < y[0] ? -1 : 1)

    console.log("sortedData")
    console.table(sortedData)


    const widthPixels = canv.canvas.width
    const heightPixels = canv.canvas.height
    const minMax = _plotCalcMinMax(sortedData)

    const boundsUnits = _plotCalcBoundsUnits(minMax)

    _plotDrawDataGrid(canv, boundsUnits)

    canv.strokeStyle = style.color
    canv.lineWidth = style.lineThickness
    canv.beginPath()

    const xInterval = boundsUnits.xBounds[1] - boundsUnits.xBounds[0]
    const yInterval = boundsUnits.yBounds[1] - boundsUnits.yBounds[0]

    function xToPixels(value) {
        return (value - boundsUnits.xBounds[0])/xInterval*widthPixels
    }

    function yToPixels(value) {
        return heightPixels - (value - boundsUnits.yBounds[0])/yInterval*heightPixels
    }

    console.log("first Y")
    console.log(sortedData[0][1])
    canv.moveTo(xToPixels(sortedData[0][0]), yToPixels(sortedData[0][1]))
    for (let i = 1; i < sortedData.length; i++) {
        const w = xToPixels(sortedData[i][0])
        const h = yToPixels(sortedData[i][1])
        canv.lineTo(w, h);
    }
    canv.stroke()
}

function _plotCalcMinMax(pts) {
    let xMin = pts[0][0]
    let xMax = xMin
    let yMin = pts[0][1]
    let yMax = yMin
    for (let i = 1; i < pts.length; i++) {
        const x = pts[i][0]
        if (x < xMin) {
            xMin = x
        } else if (x > xMax) {
            xMax = x
        }
        const y = pts[i][1]
        if (y < yMin) {
            yMin = y
        } else if (y > yMax) {
            yMax = y
        }                
    }
    return { xMin, xMax, yMin, yMax }
}

/** Returns { xBounds: [num num], xUnit: num, yBounds: [num num], yUnit: num } */
function _plotCalcBoundsUnits(minMax) {
    let xLowerBound = 0
    const xVals = _plotCalcBoundsUnitsOneDim(minMax.xMin, minMax.xMax)
    const yVals = _plotCalcBoundsUnitsOneDim(minMax.yMin, minMax.yMax)
    console.log("xVals")
    console.dir(xVals)
    console.log("yVals")
    console.dir(yVals)
    return { xBounds: xVals.bounds, xUnit: xVals.unit, yBounds: yVals.bounds, yUnit: yVals.unit }
}

/** Returns { bounds: [num num], unit: num, } */
function _plotCalcBoundsUnitsOneDim(min, max) {
    const interval = max - min
    if (interval === 0.0) {
        return { bounds: [-1.0, 1.0], unit: 1.0 };
    }
    const logOfUnit = Math.floor(Math.log10(interval) - 1)
    let theUnit = Math.pow(10, logOfUnit)
    const fiveTimesUnit = 5.0*theUnit
    if (interval/fiveTimesUnit >= 8.0) {
        theUnit = fiveTimesUnit
    }
    const lowerBound = theUnit*(Math.floor(min/theUnit))
    let numUnits = Math.ceil(interval/theUnit)
    if (numUnits % 2 > 0.5) {
        numUnits++
    }
    console.log(`numUnits ${numUnits}`)
    const upperBound = lowerBound + theUnit*numUnits

    return { bounds: [lowerBound, upperBound], unit: theUnit }
}

/** Bounds: { xBounds: [num num], xUnit: num, yBounds: [num num], yUnit: num } */
function _plotDrawDataGrid(c, bounds) {
    const xWidth = bounds.xBounds[1] - bounds.xBounds[0];
    const xPixPerUnit = c.canvas.width / xWidth;
    const yWidth = bounds.yBounds[1] - bounds.yBounds[0];
    const yPixPerUnit = c.canvas.height / yWidth;

    const axisColor =  "white";
    const gridColor = "hsl(0, 0%, 86%)";
    const textColor =  "white";
    c.fillStyle = textColor
    c.strokeStyle = gridColor;
    {   // horizontal lines
        const numUnits = (bounds.xBounds[1] - bounds.xBounds[0])/bounds.xUnit
        _plotDrawLine(c, 1, 0, 1, c.canvas.height);
        for (let i = 0; i < numUnits; i++) {
            const positionRel = i*bounds.xUnit;
            const positionAbs = bounds.xBounds[0] + positionRel
            const positionPix = positionRel*xPixPerUnit;

            _plotDrawLine(c, positionPix, 0, positionPix, c.canvas.height);

            const text = positionAbs.toFixed(2).toString()
            c.fillText(text, positionPix + 1, c.canvas.height/2 + 10);
        }
        _plotDrawLine(c, c.canvas.width - 1, 0, c.canvas.width - 1, c.canvas.height);
    }
    {   // vertical lines
        const numUnits = (bounds.yBounds[1] - bounds.yBounds[0])/bounds.yUnit
        _plotDrawLine(c, 0, 2, c.canvas.width, 2);
        for (let i = 0; i < numUnits; i++) {
            const positionRel = i*bounds.yUnit;
            const positionAbs = bounds.yBounds[0] + positionRel
            const positionPix = c.canvas.height - positionRel*yPixPerUnit;
            _plotDrawLine(c, 0, positionPix, c.canvas.width, positionPix);

            const text = positionAbs.toFixed(2).toString()
            c.fillText(text, c.canvas.width/2 + 2, positionPix - 4);
        }
        _plotDrawLine(c, 0, c.canvas.height - 2, c.canvas.width, c.canvas.height - 2);
    }
}


function _plotXCoordToPix(c, xCoord) {
    const xDiff = c.xMax - c.xMin;
    const xPixPerUnit = c.ctx.canvas.width / xDiff;
    return Math.round((xCoord - c.xMin) * xPixPerUnit);
}

function _plotYCoordToPix(c, yCoord) {
    const yDiff = c.yMax - c.yMin;
    const yPixPerUnit = c.ctx.canvas.height / yDiff;
    return Math.round(c.ctx.canvas.height - (yCoord - c.yMin) * yPixPerUnit);
}

function _plotXPixToCoord(c, xPix) {
    const xDiff = c.xMax - c.xMin;
    const xPixPerUnit = c.ctx.canvas.width / xDiff;
    return xPix / xPixPerUnit + c.xMin;
}

function _plotYPixToCoord(c, yPix) {
    const yDiff = c.yMax - c.yMin;
    const yPixPerUnit = c.ctx.canvas.height / yDiff;
    return -(yPix - c.ctx.canvas.height) / yPixPerUnit + c.yMin;
}

function _plotDrawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function _plotLineToPoints(c, wPoints, yPoints) {
    for (let i=0; i < wPoints.length; i++) {
        const w = wPoints[i];
        const y = yPoints[i];
        const h = yCoordToPix(c, y);
        c.ctx.lineTo(w, h);
    }
}

function plotDrawPoints(c, fillStyle, points) {
    clear(c);
    c.ctx.fillStyle = fillStyle;
    for (let point of points){
        c.ctx.beginPath();
        c.ctx.arc(xCoordToPix(c, point[0]), yCoordToPix(c, point[1]), 5, 0, 2 * Math.PI, true);
        c.ctx.fill();
    }
}

function plotGetGradientVector(colorMapIndex, levels) {
    const gradientColors1 = {
        0.0: "rgb(51, 59, 126)",
        0.05: "rgb(45, 74, 138)",
        0.1: "rgb(38, 89, 149)",
        0.15: "rgb(28, 116, 174)",
        0.2: "rgb(18, 142, 186)",
        0.25: "rgb(19, 158, 198)",
        0.3: "rgb(22, 161, 191)",
        0.35: "rgb(28, 160, 163)",
        0.4: "rgb(47, 157, 119)",
        0.45: "rgb(86, 156,66)",
        0.5: "rgb(121, 162, 43)",
        0.55: "rgb(162, 172, 29)",
        0.6: "rgb(194, 184, 22)",
        0.65: "rgb(216, 194, 17)",
        0.7: "rgb(223, 204, 15)",
        0.75: "rgb(238, 201, 15)",
        0.8: "rgb(237, 180, 17)",
        0.85: "rgb(236, 144, 19)",
        0.9: "rgb(228, 96, 25)",
        0.95: "rgb(221, 60, 30)",
        1.0: "rgb(221, 49, 33)"
    };
    const gradientColors2 = {
        0.0: "rgb(204, 196, 129)",
        0.05: "rgb(210, 181, 117)",
        0.1: "rgb(217, 166, 106)",
        0.15: "rgb(227, 139, 81)",
        0.2: "rgb(237, 113, 69)",
        0.25: "rgb(236, 97, 57)",
        0.3: "rgb(233, 94, 64)",
        0.35: "rgb(227, 95, 92)",
        0.4: "rgb(208, 98, 136)",
        0.45: "rgb(169, 99, 189)",
        0.5: "rgb(134, 93, 212)",
        0.55: "rgb(93, 83, 226)",
        0.6: "rgb(61, 71, 233)",
        0.65: "rgb(39, 61, 238)",
        0.7: "rgb(32, 51, 240)",
        0.75: "rgb(17, 54, 240)",
        0.8: "rgb(18, 75, 238)",
        0.85: "rgb(19, 111, 236)",
        0.9: "rgb(27, 159, 230)",
        0.95: "rgb(34, 195, 225)",
        1.0: "rgb(34, 206, 222)"
    };
    const gradientColors3 = {
        0.0: "rgb(0, 0, 0)",
        0.5: "#0081a8",
        1.0: "rgb(255, 255, 255)"
    };
    const gradientColors4 = {
        0.0: "#0055e4",
        1.0: "#c70000"
    };
    const gradientColors5 = {
        0.0: "rgb(0, 0, 0)",
        0.05: "rgb(0, 0, 0)",
        0.050000001: "rgb(255, 255, 255)",
        0.1: "rgb(255, 255, 255)",
        0.100000001: "rgb(0, 0, 0)",
        0.15: "rgb(0, 0, 0)",
        0.150000001: "rgb(255, 255, 255)",
        0.2: "rgb(255, 255, 255)",
        0.200000001: "rgb(0, 0, 0)",
        0.25: "rgb(0, 0, 0)",
        0.250000001: "rgb(255, 255, 255)",
        0.3: "rgb(255, 255, 255)",
        0.300000001: "rgb(0, 0, 0)",
        0.35: "rgb(0, 0, 0)",
        0.350000001: "rgb(255, 255, 255)",
        0.4: "rgb(255, 255, 255)",
        0.400000001: "rgb(0, 0, 0)",
        0.45: "rgb(0, 0, 0)",
        0.450000001: "rgb(255, 255, 255)",
        0.5: "rgb(255, 255, 255)",
        0.500000001: "rgb(0, 0, 0)",
        0.55: "rgb(0, 0, 0)",
        0.550000001: "rgb(255, 255, 255)",
        0.6: "rgb(255, 255, 255)",
        0.600000001: "rgb(0, 0, 0)",
        0.65: "rgb(0, 0, 0)",
        0.650000001: "rgb(255, 255, 255)",
        0.7: "rgb(255, 255, 255)",
        0.700000001: "rgb(0, 0, 0)",
        0.75: "rgb(0, 0, 0)",
        0.750000001: "rgb(255, 255, 255)",
        0.8: "rgb(255, 255, 255)",
        0.800000001: "rgb(0, 0, 0)",
        0.85: "rgb(0, 0, 0)",
        0.850000001: "rgb(255, 255, 255)",
        0.9: "rgb(255, 255, 255)",
        0.900000001: "rgb(0, 0, 0)",
        0.95: "rgb(0, 0, 0)",
        0.950000001: "rgb(255, 255, 255)",
        1.0: "rgb(255, 255, 255)"
    };
    const gradientColors6 = {
        0.0: "#c70000",
        0.5: "rgb(224, 137, 0)",
        1.0: "rgb(224, 206, 0)"
    };
    const gradientColors7 = {
        0.0: 'rgb(0, 0, 0)',
        0.6: 'rgb(24, 53, 103)',
        0.75: 'rgb(46, 100, 158)',
        0.9: 'rgb(23, 173, 203)',
        1.0: 'rgb(0, 250, 250)'
    };
    const gradientColors8 = {
        0: '#000',
        0.33: '#640901',
        0.66: '#f6eb36',
        1: '#ffffff'
    };
    const gradientColors9 = {
        0:'#ff3800',
        0.1429:'#ff6500',
        0.2857:'#ffa54f',
        0.4286:'#ffc78f',
        0.5714:'#ffe1c6',
        0.7143:'#fef9ff',
        0.8571:'#c9d9ff',
        1:'#9fbfff'
    };
    const gradientColors10 = {
        0.0: "#003649",
        0.5: "#0081a8",
        1.0: "#ffffff"
    };

    const gradientColorList = [
        gradientColors1,
        gradientColors2,
        gradientColors3,
        gradientColors4,
        gradientColors5,
        gradientColors6,
        gradientColors7,
        gradientColors8,
        gradientColors9,
        gradientColors10
    ];

    const gradientColors = gradientColorList[colorMapIndex];

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = levels;
    const ctx2 = canvas.getContext("2d");
    const gradient = ctx2.createLinearGradient(0, 0, 0, levels);
    for (let pos of Object.keys(gradientColors)) {
        gradient.addColorStop(parseFloat(pos), gradientColors[pos]);
    }
    ctx2.fillStyle = gradient;
    ctx2.fillRect(0, 0, 1, levels);
    return ctx2.getImageData(0, 0, 1, levels).data;
}

function plotDraw3dFunction(c, zMin, zMax, alpha, gv, func) {
    clear(c);
    const data = c.ctx.createImageData(c.ctx.canvas.width, c.ctx.canvas.height);

    let w = 0;
    let h = -1;
    let stopNow = false;

    const drawInTimeSlot = function () {
        const start = +new Date();
        while (+new Date() < start + 70 && !stopNow) {
            if (w >= c.ctx.canvas.width) break;
            
            h++;
            if (h === c.ctx.canvas.height + 1) {
                w++;
                h = 0;
            }
            const z = func(xPixToCoord(c, w), yPixToCoord(c, h));
            const pixelCount = gv.length / 4;
            let gradientIndex = Math.round(((z - zMin) / (zMax - zMin)) * pixelCount);
            if (gradientIndex < 0) {
                gradientIndex = 0;
            }
            if (gradientIndex >= pixelCount) {
                gradientIndex = pixelCount - 1;
            }
            const r = gv[gradientIndex * 4    ];
            const g = gv[gradientIndex * 4 + 1];
            const b = gv[gradientIndex * 4 + 2];
            let a = Math.round(alpha * 255);
            if (z < zMin || z > zMax) {
                a *= 0.5;
            }
            const index = h * c.ctx.canvas.width * 4 + w * 4;
            data.data[index    ] = r;
            data.data[index + 1] = g;
            data.data[index + 2] = b;
            data.data[index + 3] = a;
        }
        c.ctx.putImageData(data, 0, 0);
        if (w < c.ctx.canvas.width && !stopNow) {
            setTimeout(()=> drawInTimeSlot());
        }
    };

    drawInTimeSlot();
    return () => stopNow = true;
}


function _plotClear(c) {
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
}
