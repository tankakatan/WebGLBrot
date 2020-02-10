"use strict";

const { f32, v2f32 } = require ('./f32')
const { expect } = require ('chai')

describe ('Float 32', () => {

    // 32 -> 2 × 16
    // > f = x => new Float32Array ([x])[0]
    // [Function: f]
    // > var p2 = f (f (Math.PI) * f (Math.pow (2, 13) + 1))
    // 25739.068359375
    // > var h16 = f (f (p2) - f (f (p2) - f (Math.PI))) // heading half precision number
    // undefined
    // > h16.toString (2)
    // '11.001001'
    // > var t16 = f (f (Math.PI) - f (h16)) // trailing half precision number
    // > t16.toString (2)
    // '0.0000000000111111011011'
    // > f (f (h16) + f (t16)).toString (2)
    // '11.0010010000111111011011'
    // > f (Math.PI).toString (2)
    // '11.0010010000111111011011'

    it ('multiplies with double precision', () => {
        const a = f32 (Math.PI)
        const b = f32 (Math.sqrt (2))

        const product = a.mul64 (b)

        expect (product.type).to.equal ('v2f32')
        expect (product.x + product.y).to.equal (a * b)
    })
})

describe ('Emulated Float 64', () => {

    it ('can be created from float 64', () => {

        // The 53-bit significand precision gives from 15 to 17 significant decimal digits precision (2−53 ≈ 1.11 × 10−16)

        const f64 = Math.PI
        const eml = v2f32.from64 (f64)

        expect (eml.type).to.equal ('v2f32')
        expect (eml.x + eml.y).to.be.closeTo (f64, 1e-14)
    })

    it ('supports addition', () => {

        const a = Math.PI
        const b = Math.sqrt (2)

        const sum = v2f32.from64 (a).add (v2f32.from64 (b))

        expect (sum.type).to.equal ('v2f32')
        expect (sum.x + sum.y).to.be.closeTo (a + b, 1e-14)
    })

    it ('supports subtraction', () => {

        const a = Math.PI
        const b = Math.sqrt (3)

        const diff = v2f32.from64 (a).sub (v2f32.from64 (b))

        expect (diff.type).to.equal ('v2f32')
        expect (diff.x + diff.y).to.be.closeTo (a - b, 1e-14)
    })

    it ('supports multiplication', () => {

        const a = Math.PI
        const b = Math.sqrt (5)

        const product = v2f32.from64 (a).mul (v2f32.from64 (b))

        expect (product.type).to.equal ('v2f32')
        expect (product.x + product.y).to.be.closeTo (a * b, 1e-14)
    })

    it ('supports division', () => {

        const a = Math.PI
        const b = Math.sqrt (7)

        const ratio = v2f32.from64 (a).div (v2f32.from64 (b))

        expect (ratio.type).to.equal ('v2f32')
        expect (ratio.x + ratio.y).to.be.closeTo (a / b, 1e-14)
    })

    it ('supports comparison', () => {

        const a = v2f32.from64 (Math.PI)
        const b = v2f32.from64 (Math.sqrt (2))
        const c = v2f32.from64 (Math.sqrt (2) + 1)

        expect (a.gt (b)).to.be.true
        expect (a.gte (c)).to.be.true
        expect (a.lte (b)).to.be.false
        expect (a.lt (b)).to.be.false
        expect (b.ne (c)).to.be.true
        expect (b.add (v2f32.from64 (1)).eq (c)).to.be.true
    })
})

// 64 -> 2 × 32

// console.log ('Math.PI                                       :', Math.PI.toString (2))
// var split1 = Math.PI * (Math.pow (2, 26) + 1)
// console.log ('var split1 = Math.PI * (Math.pow (2, 26) + 1) :', split1.toString (2))
// var h32 = split1 - (split1 - Math.PI)
// console.log ('var h32 = split1 - (split1 - Math.PI)         :', h32.toString (2))
// var t32 = Math.PI - (split1 - (split1 - Math.PI))
// console.log ('var t32 = Math.PI - (p1 - (p1 - Math.PI))     :', t32.toString (2))
// console.log ('h32 + t32                                     :', (h32 + t32).toString (2))
// console.log ('Math.PI                                       :', Math.PI.toString (2))
// console.log (' ')

// var test = v2f32.from64 (Math.PI)

// console.log ('test            :', test)
// console.log ('test.x + test.y :', test.x + test.y)
// console.log ('Math.PI         :', Math.PI)

// console.log ('Math.PI         :', Math.PI.toString (2))
// console.log ('test.x + test.y :', (test.x + test.y).toString (2))
// console.log ('test.x          :', (test.x).toString (2))
// console.log ('test.y          :', (test.y).toString (2))

// > (Math.PI * (Math.pow (2, 26) + 1)).toString (2)
// '1100100100001111110110101101.0100011001010101111101101'
// > var p1 = (Math.PI * (Math.pow (2, 26) + 1))
// undefined
// > var h32 = (p1 - (p1 - Math.PI))
// > h32.toString (2)
// '11.0010010000111111011010101'
// > var t32 = (Math.PI - (p1 - (p1 - Math.PI)))
// > t32.toString (2)
// '0.000000000000000000000000000010001000010110100011'
// > (h32 + t32).toString (2)
// '11.001001000011111101101010100010001000010110100011'
// > Math.PI.toString (2)
// '11.001001000011111101101010100010001000010110100011'
