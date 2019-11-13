"use strict";

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
    rescale: { value: function (v_x_src, v_x_dst, v_y_src, v_y_dst) {
                return v2 (rescale (this.x, v_x_src.x, v_x_src.y, v_x_dst.x, v_x_dst.y),
                           rescale (this.y, v_y_src.x, v_y_src.y, v_y_dst.x, v_y_dst.y)) } },

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
    iterationRange.value = 200
    iterationRange.style.position = 'absolute'
    iterationRange.style.zIndex = '100'

    document.body.appendChild (iterationRange)

    const canvas = document.createElement ('canvas')
    const scale = window.devicePixelRatio

    document.body.appendChild (canvas)

    const gl = canvas.getContext ('webgl2', { alpha: false, antialias: false }) // true })

    const program = setup ({ gl, scale })
    const canvasSize = v2 (gl.canvas.width, gl.canvas.height)
    const aspectRatio = canvasSize.x / canvasSize.y

    // const canvasCenter = canvasSize.scale (0.5)

    let zoom = 1.0
    let offset = v2 (0, 0)
    let iterations = iterationRange.value

    render ({ gl, program, zoom, offset, iterations })

    document.body.onwheel = function ({ deltaY, clientX, clientY }) {

        const nextZoom = zoom + (zoom * scale * deltaY / canvasSize.y)
        const cursorAbsolutePosition = v2 (clientX, clientY).scale (scale).rescale (
            v2 (0, canvasSize.x), v2 (-1, 1).scale (aspectRatio),
            v2 (0, canvasSize.y), v2 (-1, 1),
        )

        const cursorPositionBeforeZoom = cursorAbsolutePosition.scale (zoom)
        const cursorPositionAfterZoom = cursorAbsolutePosition.scale (nextZoom)
        const cursorShift = cursorPositionAfterZoom.sub (cursorPositionBeforeZoom)

        offset = offset.sub (cursorShift)

        zoom = nextZoom

        render ({ gl, program, zoom, offset, iterations })
    }

    iterationRange.addEventListener ('input', e => {

        iterations = parseInt (e.srcElement.value)

        render ({ gl, program, zoom, offset, iterations })
    })
})

function render ({ gl, program, zoom, offset, iterations }) {

    window.requestAnimationFrame (() => {

        const zoomUniform = gl.getUniformLocation (program, 'zoom')
        const offsetUniform = gl.getUniformLocation (program, 'offset')
        const iterationsUniform = gl.getUniformLocation (program, 'maxIterations')

        gl.uniform1f (zoomUniform, zoom)
        gl.uniform1i (iterationsUniform, iterations)
        gl.uniform2fv (offsetUniform, new Float32Array (offset.list))

        gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4)
    })
}

function setup ({ gl, scale }) {

    gl.canvas.width = gl.canvas.clientWidth * scale
    gl.canvas.height = gl.canvas.clientHeight * scale

    gl.viewport (0, 0, gl.canvas.width, gl.canvas.height)

    // Get the strings for our GLSL shaders
    const vertexShaderSource = document.getElementById ("2d-vertex-shader").text
    const fragmentShaderSource = document.getElementById ("2d-fragment-shader").text

    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = createShader (gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader (gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    // Link the two shaders into a program
    const program = createProgram (gl, vertexShader, fragmentShader)

    // look up where the vertex data needs to go.
    const vertexPositionAttribute = gl.getAttribLocation (program, 'aVertexPosition')
    const canvasSizeUniform = gl.getUniformLocation (program, 'canvasSize')

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
    gl.uniform2fv (canvasSizeUniform, new Float32Array ([ gl.canvas.width, gl.canvas.height ]))

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
