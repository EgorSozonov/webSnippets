export { drawPlots, exportPlot, exportPlotsAll }

/**
   data: { axes: { { name: string, unit: string } }, points: {} }
   canv: canvas
   style: { color: String, lineThickness: Number }
 */
function plotSerieOrSeries(data, canv) {
    clearCanvas(canv);
    const isMultipleSeries = data.series !== undefined
    const padding = 24
    if (isMultipleSeries) {
        plotSeries(data, padding, canv)
    } else {
        plotSerie(data, padding, canv)
    }
}

/**
   data: { axes: { { name: string, unit: string } },
           points: {},
           style: { color: String, lineThickness: Number } }
   canv: canvas 2D context

 */
function plotSerie(data, padding, canv) {
    if (!data || data.axes.length < 2 || data.points.length < 1
        || !data.style || !data.style.color) return

    const widthPixels = canv.canvas.width - 2*padding
    const heightPixels = canv.canvas.height - 2*padding
    const minMax = calcMinMax(data.points)

    const boundsUnits = calcBoundsUnits(minMax)
    const layout = determineLayout(boundsUnits, padding)
    drawDataGrid(boundsUnits, data.axes, layout, canv, padding)

    const xInterval = boundsUnits.xBounds[1] - boundsUnits.xBounds[0]
    const yInterval = boundsUnits.yBounds[1] - boundsUnits.yBounds[0]

    function xToPixels(value) {
        return (value - boundsUnits.xBounds[0])/xInterval*widthPixels + layout.topLeft[0]
    }

    function yToPixels(value) {
        return heightPixels - (value - boundsUnits.yBounds[0])/yInterval*heightPixels + layout.topLeft[1]
    }

    drawSerie(data, xToPixels, yToPixels, canv)
}

/**
   data: {  axes: { { name: string, unit: string } }, series: [{}] }
   canv: canvas
   style: { color: String, lineThickness: Number }
 */
function plotSeries(data, padding, canv) {
    if (!data || data.axes.length < 2 || !data.series || data.series.length < 1) return

    const widthPixels = canv.canvas.width - 2*padding
    const heightPixels = canv.canvas.height - 2*padding
    let minMax = null

    for (let ky of Object.keys(data.series)) {
        const newMinMax = calcMinMax(data.series[ky].points)
        if (minMax === null) {
            minMax = newMinMax
        } else {
            mergeMinMax(minMax, newMinMax)
        }
    }

    const boundsUnits = calcBoundsUnits(minMax)
    const layout = determineLayout(boundsUnits, padding)

    drawDataGrid(boundsUnits, data.axes, layout, canv, padding)
    const xInterval = boundsUnits.xBounds[1] - boundsUnits.xBounds[0]
    const yInterval = boundsUnits.yBounds[1] - boundsUnits.yBounds[0]

    function xToPixels(value) {
        return (value - boundsUnits.xBounds[0])/xInterval*widthPixels + layout.topLeft[0]
    }

    function yToPixels(value) {
        return heightPixels - (value - boundsUnits.yBounds[0])/yInterval*heightPixels + layout.topLeft[1]
    }

    for (let ky of Object.keys(data.series)) {
        drawSerie(data.series[ky], xToPixels, yToPixels, canv)
    }
}

/** Determines the position of the top left corner of the plot area on the canvas
 Returns { topLeft: [x y], xPos: "left" | "inside" | "right", yPos: "left" | "inside" | "right"  }

 */
function determineLayout(boundsUnits, padding) {
    const result = {}

    if (boundsUnits.xBounds[0] > 0) {
        result.yPos = "left"
    } else if (boundsUnits.xBounds[1] < 0) {
        result.yPos = "right"
    } else {
        result.yPos = "inside"
    }
    if (boundsUnits.yBounds[0] > 0) {
        result.xPos = "left"
    } else if (boundsUnits.yBounds[1] < 0) {
        result.xPos = "right"
    } else {
        result.xPos = "inside"
    }

    if (result.yPos === "left") {
        if (result.xPos === "left") {
            result.topLeft = [padding, padding] // top right
        } else if (result.xPos === "inside") {
            result.topLeft = [padding, padding] // vert-middle right
        } else {
            result.topLeft = [padding, padding] // bottom right
        }
    } else if (result.yPos === "inside") {
        if (result.xPos === "left") {
            result.topLeft = [padding, padding] // top hor-middle
        } else if (result.xPos === "inside") {
            result.topLeft = [padding, padding] // vert-middle hor-middle
        } else {
            result.topLeft = [padding, padding] // bottom hor-middle
        }
    } else {
        if (result.xPos === "left") {
            result.topLeft = [padding, padding] // top left
        } else if (result.xPos === "inside") {
            result.topLeft = [padding, padding] // vert-middle left
        } else {
            result.topLeft = [padding, padding] // bottom left
        }
    }
    return result
}

/** Draw a single serie (a single graph) of data on the canvas according to its style */
function drawSerie(serie, xToPixels, yToPixels, canv) {
    canv.strokeStyle = serie.style.color
    canv.lineWidth = serie.style.lineThickness ? serie.style.lineThickness : 2;
    canv.beginPath()

    const sortedData = [...serie.points]
    sortedData.sort((x, y) => x[0] < y[0] ? -1 : 1)
    canv.moveTo(xToPixels(sortedData[0][0]), yToPixels(sortedData[0][1]))
    for (let i = 1; i < sortedData.length; i++) {
        const w = xToPixels(sortedData[i][0])
        const h = yToPixels(sortedData[i][1])
        canv.lineTo(w, h);
    }
    canv.stroke()
}


/** Bounds: { xBounds: { num num }, xUnit: num, yBounds: { num num }, yUnit: num }
    Axes: [ { name: string, unit: string} ]
    layout: { topLeft: [x y], xPos, yPos }
    c: canvas
    padding: number
    */
function drawDataGrid(bounds, axes, layout, c, padding) {
    const dataWidth = bounds.xBounds[1] - bounds.xBounds[0];
    const plotWidth = c.canvas.width - 2*padding
    const xPixPerUnit = plotWidth / dataWidth;

    const plotHeight = c.canvas.height - 2*padding
    const dataHeight = bounds.yBounds[1] - bounds.yBounds[0];
    const yPixPerUnit = plotHeight / dataHeight;

    const axisColor =  "white";
    const gridColor = "hsl(0, 0%, 86%)";
    const textColor =  "white";
    c.fillStyle = textColor
    c.strokeStyle = gridColor;
    const topLeft = layout.topLeft

    const plotCoords = {bounds, axes, topLeft, xPos: layout.xPos, yPos: layout.yPos, padding,
                        dataWidth, plotWidth, xPixPerUnit,
                        dataHeight, plotHeight, yPixPerUnit }
    drawNumbers(plotCoords, c)

    let metXAxis = false
    let metYAxis = false
    const xUnitError = bounds.xUnit/20
    const yUnitError = bounds.yUnit/20
    {   // vertical lines
        const numUnits = (bounds.xBounds[1] - bounds.xBounds[0])/bounds.xUnit
        drawALine(c, topLeft[0], topLeft[1], topLeft[0], topLeft[1] + plotHeight);
        for (let i = 0; i < numUnits; i++) {
            const positionRel = i*bounds.xUnit;
            const positionAbs = bounds.xBounds[0] + positionRel
            const positionPix = positionRel*xPixPerUnit + topLeft[0];

            if (Math.abs(positionAbs) < xUnitError) {
                drawYAxis(positionPix, axes[1], padding, c)
                metYAxis = true
            } else {
                drawALine(c, positionPix, topLeft[1], positionPix, topLeft[1] + plotHeight);
            }
        }
        drawALine(c, topLeft[0] + plotWidth, topLeft[1],
                         topLeft[0] + plotWidth, topLeft[1] + plotHeight);
    }
    {   // horizontal lines
        const numUnits = (bounds.yBounds[1] - bounds.yBounds[0])/bounds.yUnit
        drawALine(c, topLeft[0], topLeft[1],
                         topLeft[0] + plotWidth, topLeft[1]);
        for (let i = 0; i < numUnits; i++) {
            const positionRel = i*bounds.yUnit;
            const positionAbs = bounds.yBounds[0] + positionRel
            const positionPix = plotHeight - positionRel*yPixPerUnit + topLeft[1];
            if (Math.abs(positionAbs) < yUnitError) {
                drawXAxis(positionPix, axes[0], padding, c)
                metXAxis = true
            } else {
                drawALine(c, topLeft[0], positionPix, topLeft[0] + plotWidth, positionPix);
            }
        }
        drawALine(c, topLeft[0], topLeft[1] + plotHeight,
                         topLeft[0] + plotWidth, topLeft[1] + plotHeight);
    }

    if (metYAxis === false && metXAxis === false) {
        drawAxesNotTouching(plotCoords, c)
    } else if (metYAxis === false) {
        drawYAxisNotTouching(plotCoords, c)
    } else if (metXAxis === false) {
        drawXAxisNotTouching(plotCoords, c)
    }
}

/** When the plotted data doesn't intersect any axes, we need to draw them in the padding
    plotCoords: {bounds, axes, topLeft, xPos, yPos, padding,
                        dataWidth, plotWidth, xPixPerUnit,
                        dataHeight, plotHeight, yPixPerUnit }
*/
function drawAxesNotTouching(plotCoords, canv) {
    const xUnitSize = canv.measureText(plotCoords.axes[0].unit)
    const yUnitSize = canv.measureText(plotCoords.axes[1].unit)
    if (plotCoords.bounds.xBounds[0] > 0) {
        if (plotCoords.bounds.yBounds[0] > 0) { // upper right quadrant
            drawXAxis(canv.canvas.height - plotCoords.padding/4, plotCoords.axes[0], plotCoords.padding, canv)
            drawYAxis(plotCoords.padding/4, plotCoords.axes[1], plotCoords.padding, canv)
        } else {                     // lower right quadrant
            drawXAxis(plotCoords.padding*0.75, plotCoords.axes[0], plotCoords.padding, canv)
            drawYAxisNoArrow(plotCoords.padding/4, plotCoords.padding, canv)
        }
    } else {
        if (plotCoords.bounds.yBounds[0] > 0) { // upper left quadrant
            drawXAxisNoArrow(canv.canvas.height - plotCoords.padding/2, plotCoords.padding, canv)
            drawYAxis(canv.canvas.width - plotCoords.padding/2, plotCoords.axes[1], plotCoords.padding, canv)
            canv.fillText(plotCoords.axes[0].unit, 10, canv.canvas.height - plotCoords.padding/2 - 2)
        } else {                     // lower left quadrant
            drawXAxisNoArrow(plotCoords.padding*0.75, plotCoords.padding, canv)
            drawYAxisNoArrow(canv.canvas.width - plotCoords.padding/2, plotCoords.padding, canv)
            canv.fillText(plotCoords.axes[0].unit, plotCoords.topLeft[0] + 5, plotCoords.padding + xUnitSize.actualBoundingBoxAscent + 2)
            canv.fillText(plotCoords.axes[1].unit,
                          canv.canvas.width - plotCoords.padding/2 - yUnitSize.width - 5, plotCoords.padding/2 - 2)
        }
    }
}


function drawXAxisNotTouching(plotCoords, canv) {
    if (plotCoords.bounds.yBounds[1] > 0) { // top half
        drawXAxis(canv.canvas.height - plotCoords.padding/4, plotCoords.axes[0], plotCoords.padding, canv)
    } else {                     // bottom half
        drawXAxis(plotCoords.padding/4, plotCoords.axes[0], plotCoords.padding, canv)
    }
}

/**
    plotCoords: {bounds, axes, layout, padding,
                dataWidth, plotWidth, xPixPerUnit,
                dataHeight, plotHeight, yPixPerUnit }
 */
function drawYAxisNotTouching(plotCoords, canv) {

    if (plotCoords.bounds.xBounds[1] > 0) { // right half
        drawYAxis(plotCoords.padding/4, plotCoords.axes[1], plotCoords.padding, canv)

    } else {                     // left half
        drawYAxis(canv.canvas.width - padding/4, axes[1], padding, canv)
        for (let i = 0; i < numUnits; i++) {
            const positionRel = i*plotCoords.bounds.yUnit;
            const positionAbs = plotCoords.bounds.xBounds[0] + positionRel
            const positionPix = plotCoords.plotHeight - positionRel*plotCoords.yPixPerUnit + plotCoords.topLeft[1];

            const printedCoordValue = positionAbs.toFixed(2).toString()
            c.fillText(printedCoordValue, plotCoords.topLeft[0] + plotCoords.plotWidth, positionPix);
        }
    }
}

/** Draw the numeric values for both axes
   plotCoords: {bounds, axes, layout, padding,
                dataWidth, plotWidth, xPixPerUnit,
                dataHeight, plotHeight, yPixPerUnit }
 */
function drawNumbers(plotCoords, canv) {
    const numUnitsX = (plotCoords.bounds.xBounds[1] - plotCoords.bounds.xBounds[0])/plotCoords.bounds.xUnit
    const numUnitsY = (plotCoords.bounds.yBounds[1] - plotCoords.bounds.yBounds[0])/plotCoords.bounds.yUnit

    let positionXNums
    if (plotCoords.xPos === "left") {
        positionXNums = plotCoords.plotHeight + plotCoords.topLeft[1] + canv.measureText("2").actualBoundingBoxAscent + 2
    } else if (plotCoords.xPos === "inside") {
        if (plotCoords.bounds.yBounds[0] === 0) { // the x axis is the lower border of the plot
            positionXNums = canv.canvas.height - canv.measureText("2").actualBoundingBoxAscent - 2
        } else if (plotCoords.bounds.yBounds[1] === 0) {
            positionXNums = 10
        } else {
            positionXNums = (plotCoords.bounds.yBounds[1]/plotCoords.dataHeight)*plotCoords.plotHeight + plotCoords.topLeft[1]
        }
    } else {
        positionXNums = 10
    }

    let positionYNums
    if (plotCoords.yPos === "left") {
        positionYNums = plotCoords.padding*0.32
    } else if (plotCoords.yPos === "inside") {
        positionYNums = (plotCoords.bounds.xBounds[1]/plotCoords.dataWidth)*plotCoords.plotHeight + plotCoords.topLeft[1]
    } else {
        positionYNums = plotCoords.plotWidth + plotCoords.topLeft[0] + 2
    }

    for (let i = 0; i <= numUnitsX; i++) {
        const positionRel = i*plotCoords.bounds.xUnit;
        const positionAbs = plotCoords.bounds.xBounds[0] + positionRel
        const positionPix = positionRel*plotCoords.xPixPerUnit + plotCoords.topLeft[0];

        const printedCoordValue = trimEndZeroes(positionAbs.toFixed(2).toString())
        const textWidth = canv.measureText(printedCoordValue).width

        canv.fillText(printedCoordValue, Math.max(positionPix - textWidth - 2, 0), positionXNums);
    }

    for (let i = 0; i <= numUnitsY; i++) {
        const positionRel = i*plotCoords.bounds.yUnit;
        const positionAbs = plotCoords.bounds.yBounds[0] + positionRel
        const positionPix = plotCoords.plotHeight - positionRel*plotCoords.yPixPerUnit + plotCoords.topLeft[1] - 3;

        const printedCoordValue = trimEndZeroes(positionAbs.toFixed(2).toString())
        canv.fillText(printedCoordValue, positionYNums, positionPix);
    }
}

/** "25.00" -> "25" */
function trimEndZeroes(str) {
    let i = str.length - 1
    while (i > 0 && str[i] === "0") {
        i--
    }
    if (str[i] == ".") {
        i--
    }
    return str.substring(0, i + 1)
}

function drawXAxis(yPix, xAxis, padding, canv) {
    const cWidth = canv.canvas.width
    canv.lineWidth = 2
    drawALine(canv, 0, yPix, cWidth, yPix);
    drawALine(canv, cWidth, yPix, cWidth - padding*0.5, yPix - padding/8);
    drawALine(canv, cWidth, yPix, cWidth - padding*0.5, yPix + padding/8);

    const unitName = xAxis.unit
    const unitXCoord = cWidth - canv.measureText(unitName).width - 4
    canv.fillText(unitName, unitXCoord, yPix - padding/2);
    // if (yPix > canv.canvas.height - padding) { // unit name goes below the axis
    //     canv.fillText(unitName, unitXCoord, canv.canvas.height - 2);
    // } else {
    //     canv.fillText(unitName, unitXCoord, yPix + canv.measureText(unitName).actualBoundingBoxAscent + 5);
    // }

    canv.lineWidth = 1
}

function drawYAxis(xPix, yAxis, pad, canv) {
    canv.lineWidth = 2
    drawALine(canv, xPix, 0, xPix, canv.canvas.height);
    drawALine(canv, xPix, 0,
                     xPix - pad/8, pad*0.5);
    drawALine(canv, xPix, 0,
                     xPix + pad/8, pad*0.5);
    const unitName = yAxis.unit
    const sizeName = canv.measureText(unitName)
    const widthOfName = sizeName.width
    const heightOfName = sizeName.actualBoundingBoxAscent

    const unitCoord = (xPix + widthOfName + 20 < canv.canvas.width) ? (xPix + 10) : (xPix - canv.measureText(unitName).width - 10)
    canv.fillText(unitName, unitCoord, heightOfName + 2);
    canv.lineWidth = 1
}

function drawXAxisNoArrow(yPix, padding, c) {
    c.lineWidth = 2
    drawALine(c, padding/2, yPix,
                     c.canvas.width, yPix);
    c.lineWidth = 1
}

function drawYAxisNoArrow(xPix, pad, c) {
    c.lineWidth = 2
    drawALine(c, xPix, 0, xPix, c.canvas.height - pad/2);
    c.lineWidth = 1
}

function xCoordToPix(c, xCoord) {
    const xDiff = c.xMax - c.xMin;
    const xPixPerUnit = c.ctx.canvas.width / xDiff;
    return Math.round((xCoord - c.xMin) * xPixPerUnit);
}

function yCoordToPix(c, yCoord) {
    const yDiff = c.yMax - c.yMin;
    const yPixPerUnit = c.ctx.canvas.height / yDiff;
    return Math.round(c.ctx.canvas.height - (yCoord - c.yMin) * yPixPerUnit);
}

function drawALine(ctx, x1, y1, x2, y2) {
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

/** Plot a heatmap */
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


function clearCanvas(c) {
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
}

function drawPlots(pagePlots) {
    for (let ky of Object.keys(pagePlots)) {
        const elt = document.getElementById(ky)
        if (!elt) continue;
        const childCanvas = elt.querySelector("canvas")
        const childLegend = elt.querySelector(".plotLegendDescr")
        const buttonExport = elt.querySelector(".plotLegendExport")
        const plotTitle = elt.querySelector(".plotTitle")
        //if (!childCanvas || !childLegend || !buttonExport) continue;
        if (!childCanvas || !childLegend) continue;

        plotSerieOrSeries(pagePlots[ky], childCanvas.getContext("2d"))
        childLegend.appendChild(createLegend(pagePlots[ky]))
        //buttonExport.dataset.plotId = ky
        if (plotTitle) {
            plotTitle.innerHTML = pagePlots[ky].title
        }
    }
}


function mergeMinMax(total, single) {
    if (single.xMin < total.xMin) total.xMin = single.xMin;
    if (single.xMax > total.xMax) total.xMax = single.xMax;
    if (single.yMin < total.yMin) total.yMin = single.yMin;
    if (single.yMax > total.yMax) total.yMax = single.yMax;
}

function calcMinMax(pts) {
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

/** Returns { xBounds: { num num }, xUnit: num, yBounds: { num num }, yUnit: num } */
function calcBoundsUnits(minMax) {
    let xLowerBound = 0
    const xVals = calcBoundsUnitsOneDim(minMax.xMin, minMax.xMax)
    const yVals = calcBoundsUnitsOneDim(minMax.yMin, minMax.yMax)

    return { xBounds: xVals.bounds, xUnit: xVals.unit, yBounds: yVals.bounds, yUnit: yVals.unit }
}

/** Returns { bounds: { num num }, unit: num, } */
function calcBoundsUnitsOneDim(min, max) {
    const interval = max - min
    if (interval === 0.0) {
        return { bounds: [-1.0, 1.0], unit: 1.0 };
    }
    const logOfUnit = Math.floor(Math.log10(interval) - 1)

    let theUnit = Math.pow(10, logOfUnit)
    const unitsToTry = [theUnit*7.5, theUnit*5.0, theUnit*4.0, theUnit*2.5, theUnit*1.5, theUnit]
    for (let un of unitsToTry) {
        if (interval/un >= 8.0) {
            theUnit = un
            break
        }
    }

    const lowerBound = theUnit*(Math.floor(min/theUnit))
    let numUnits = Math.ceil(interval/theUnit)
    if (numUnits % 2 > 0.5) {
        numUnits++
    }

    let upperBound = lowerBound + theUnit*numUnits
    if (upperBound < max) { // since lowerBound is below min, this current numUnits might not be enough
        upperBound += 2*theUnit
    }

    return { bounds: [lowerBound, upperBound], unit: theUnit }
}


function createLegend(plotData) {
	const legend = document.createElement('div')
    if (plotData.series) {
        
        for (let ky of Object.keys(plotData.series)) {
			const colorBox = document.createElement('div')
			colorBox.style.backgroundColor = plotData.series[ky].style.color
			if (plotData.series[ky].style.lineThickness > 2) {
				colorBox.style.minWidth = "14px"
				colorBox.style.minHeight = "14px"
			} else {
				colorBox.style.minWidth = "10px"
				colorBox.style.minHeight = "10px"
			}
			legend.appendChild(colorBox)
			const nameDiv = document.createElement('div')
			nameDiv.innerHTML = ky
			legend.appendChild(nameDiv)			
        }
    } else {		
        legend.innerHTML = (plotData.axes[1].name + " vs " + plotData.axes[0].name)
    }
    return legend

}

function exportPlot(event) {
    alert(event.target.dataset.plotId)
}

function exportPlotsAll(event) {
    alert(event.target.dataset.plotId)
}
