"use strict";

document.addEventListener ('DOMContentLoaded', async () => {

    const canvas = document.createElement ('canvas')
    const scale = window.devicePixelRatio

    document.body.appendChild (canvas)

    const gl = canvas.getContext ('webgl2', { alpha: false, antialias: true })

    const program = setup ({ gl, scale })
    const center = { x: gl.canvas.width / 2, y: gl.canvas.height / 2 }

    let zoom = 1
    let offset = { x: 0.0, y: 0.0 }

    window.requestAnimationFrame (() => draw ({ gl, program, zoom, offset }))

    document.body.onwheel = function ({ deltaY, clientX, clientY }) {
        const delta = zoom * deltaY / gl.canvas.height
        const nextZoom = zoom + delta

        if (nextZoom <= 0) {
            return
        }

        const zoomDiff = 1 - nextZoom / zoom
        zoom = nextZoom

        // const cursor = { x: (pageX - center.x) / center.x, y: (pageY - center.y) / center.y }
        const targetOffset = { x: (clientX - center.x) / center.x, y: (clientY - center.y) / center.y }

        // offset.x = offset.x + ((cursor.x - offset.x) * Math.abs (delta))
        // offset.y = offset.y + ((cursor.y - offset.y) * delta)

        offset.x += (targetOffset.x - offset.x) * zoom * zoomDiff
        offset.y += (targetOffset.y - offset.y) * zoom * zoomDiff

        window.requestAnimationFrame (() => draw ({ gl, program, zoom, offset }))
    }
})

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
    const windowSizeUniform = gl.getUniformLocation (program, 'windowSize')

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
    gl.uniform2fv (windowSizeUniform, new Float32Array ([ gl.canvas.width, gl.canvas.height ]))

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

function draw ({ gl, program, zoom, offset }) {

    const zoomUniform = gl.getUniformLocation (program, 'zoom')
    const offsetUniform = gl.getUniformLocation (program, 'offset')

    gl.uniform1f (zoomUniform, zoom)
    gl.uniform2fv (offsetUniform, new Float32Array ([offset.x, offset.y]))

    gl.drawArrays (gl.TRIANGLE_STRIP, 0, 4)
}
