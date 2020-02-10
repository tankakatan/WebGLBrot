"use strict";

// https://stackoverflow.com/questions/42909947/webgl-double-precision-emulation-with-two-floats-has-no-effect
// https://www.thasler.com/blog/blog/glsl-part2-emu
// https://gist.github.com/LMLB/4242936fe79fb9de803c20d1196db8f3 ← !

// https://2ality.com/2012/04/number-encoding.html

function v2 (x, y) {

    if (Array.isArray (x) && y === undefined) {
        x = x[0]
        y = x[1]
    }

    const v = { x, y }

    return Object.defineProperties (v, {

        add: { value: function (v) { return v2 (this.x + v.x, this.y + v.y) } },
        sub: { value: function (v) { return this.add (v.scale (-1)) } },
      scale: { value: function (f) { return v2 (this.x * f, this.y * f) } },
    rescale: { value: function (src_min, src_max, dst_min, dst_max) {
                return v2 (rescale (this.x, src_min.x, src_max.x, dst_min.x, dst_max.x),
                           rescale (this.y, src_min.y, src_max.y, dst_min.y, dst_max.y)) } },

       list: { get: function () { return [this.x, this.y] } },
       type: { get: () => 'v2' },
    })
}

document.addEventListener ('DOMContentLoaded', async () => {

    const iterationRange = document.createElement ('input')

    iterationRange.type = 'range'
    iterationRange.min = 102
    iterationRange.max = 1024
    iterationRange.step = 1
    iterationRange.value = 300
    iterationRange.style.position = 'absolute'
    iterationRange.style.zIndex = '100'

    document.body.appendChild (iterationRange)

    // const infinityRange = document.createElement ('input')

    // infinityRange.type = 'range'
    // infinityRange.min = 100
    // infinityRange.max = 100000
    // infinityRange.step = 10
    // infinityRange.value = 10000
    // infinityRange.style.position = 'absolute'
    // infinityRange.style.zIndex = '100'
    // infinityRange.style.top = '20px'

    // document.body.appendChild (infinityRange)

    const canvas = document.createElement ('canvas')
    const scale = window.devicePixelRatio

    document.body.appendChild (canvas)

    const gl = canvas.getContext ('webgl2', { antialias: false, depth: false, alpha: false }) ||
               canvas.getContext ('webgl',  { antialias: false, depth: false, alpha: false }) // true })

    const program = setup ({ gl, scale })
    const canvasSize = v2 (gl.canvas.width, gl.canvas.height)

    // const aspectRatio = canvasSize.x / canvasSize.y
    // const canvasCenter = canvasSize.scale (0.5)

    let zoom = 1.0
    let offset = v2 (0, 0)
    let iterations = iterationRange.value
    let infinity // = infinityRange.value

    render ({ gl, program, zoom, offset, iterations, infinity })

    function handleZoom ({ deltaY, clientX, clientY }) {

        const nextZoom = zoom + (zoom * scale * deltaY / canvasSize.y)

        const cursorAbsolutePosition = v2 (clientX, clientY).scale (scale).rescale (
            v2 (0, 0), v2 (canvasSize.x, canvasSize.y),
            v2 (-1, -1), v2 (1, 1)
        )

        const cursorPositionBeforeZoom = cursorAbsolutePosition.scale (zoom)
        const cursorPositionAfterZoom = cursorAbsolutePosition.scale (nextZoom)
        const cursorShift = cursorPositionAfterZoom.sub (cursorPositionBeforeZoom).scale (scale)

        offset = offset.sub (cursorShift)
        zoom = nextZoom

        render ({ gl, program, zoom, offset, iterations, infinity })
    }

    // window.onwheel = function () { return false }
    document.querySelector ('canvas').addEventListener ('mousewheel', handleZoom)
    document.querySelector ('body').addEventListener ('DOMMouseScroll', handleZoom)

    iterationRange.addEventListener ('input', e => {

        iterations = parseInt (e.srcElement.value)

        render ({ gl, program, zoom, offset, iterations, infinity })
    })

    // infinityRange.addEventListener ('input', e => {

    //     infinity = parseInt (e.srcElement.value)

    //     render ({ gl, program, zoom, offset, iterations, infinity })
    // })
})

function render ({ gl, program, zoom, offset, iterations, infinity }) {

    window.requestAnimationFrame (() => {

        gl.uniform1f (gl.getUniformLocation (program, 'zoom'), zoom)
        gl.uniform1i (gl.getUniformLocation (program, 'maxIterations'), iterations)
        gl.uniform2fv (gl.getUniformLocation (program, 'offset'), new Float64Array (offset.list))
        // gl.uniform1i (gl.getUniformLocation (program, 'infinity'), infinity)

        gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4)
    })
}

function setup ({ gl, scale }) {

    gl.canvas.width = gl.canvas.clientWidth * scale
    gl.canvas.height = gl.canvas.clientHeight * scale

    gl.viewport (0, 0, gl.canvas.width, gl.canvas.height)

    // Get the strings for our GLSL shaders, create GLSL shaders, upload the GLSL source, compile the shaders
    // Link the two shaders into a program
    const program = createProgram (gl,
        createShader (gl, gl.VERTEX_SHADER, document.getElementById ("2d-vertex-shader").text),
        createShader (gl, gl.FRAGMENT_SHADER, document.getElementById ("2d-fragment-shader").text),
    )

    // look up where the vertex data needs to go.
    const vertexPositionAttribute = gl.getAttribLocation (program, 'aVertexPosition')

    // Create a buffer and put three 2d clip space points in it
    const positionBuffer = gl.createBuffer ()

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)

    const positions = [-1, -1,
                       -1,  1,
                        1, -1,
                        1,  1,]

    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (positions), gl.STATIC_DRAW)

    // code above this line is initialization code.
    // code below this line is rendering code.

    // Clear the canvas
    gl.clearColor (0.0, 0.0, 0.0, 1.0)
    gl.clearDepth (1.0) // Clear everything
    gl.enable (gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc (gl.LEQUAL) // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Tell it to use our program (pair of shaders)
    gl.useProgram (program)
    gl.uniform2fv (
        gl.getUniformLocation (program, 'canvasSize'),
        new Float32Array ([ gl.canvas.width, gl.canvas.height ])
    )

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    const size = 2          // 2 components per iteration
    const type = gl.FLOAT   // the data is 32bit floats
    const normalize = false // don't normalize the data
    const stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
    const bufferOffset = 0  // start at the beginning of the buffer

    gl.vertexAttribPointer (
        vertexPositionAttribute, size, type, normalize, stride, bufferOffset
    )

    gl.enableVertexAttribArray (vertexPositionAttribute)

    return program
}

function rescale (x, src_min, src_max, dst_min, dst_max) {
    return dst_min + ((dst_max - dst_min) * ((x - src_min) / (src_max - src_min)))
}

function createShader (gl, type, source) {
    var shader = gl.createShader (type)
    gl.shaderSource (shader, source)
    gl.compileShader (shader)
    if (!gl.getShaderParameter (shader, gl.COMPILE_STATUS)) {
        alert ('An error occurred compiling the shaders: ' + gl.getShaderInfoLog (shader))
        gl.deleteShader (shader)
        return null
    }
    return shader
}

function createProgram (gl, vertexShader, fragmentShader) {
    var program = gl.createProgram ()
    gl.attachShader (program, vertexShader)
    gl.attachShader (program, fragmentShader)
    gl.linkProgram (program)
    if (!gl.getProgramParameter (program, gl.LINK_STATUS)) {
        alert ('Unable to initialize the shader program: ' + gl.getProgramInfoLog (program))
        gl.deleteProgram (program)
        return null
    }
    return program
}
