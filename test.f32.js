"use strict";

const { f32, v2f32 } = require ('./f32')
const { expect } = require ('chai')

describe ('Float 32', () => {

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
        expect (eml.x + eml.y).to.be.closeTo (f64, 1e-14) // TODO: try to increase the accuracy
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
