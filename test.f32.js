"use strict";

const { f32, double } = require ('./f32')
const { expect } = require ('chai')

describe ('Float 32', () => {

    it ('multiplies with double precision', () => {

        const a = f32 (Math.PI)
        const b = f32 (Math.sqrt (2))

        const product = a.mul64 (b)

        expect (product.type).to.equal ('double')
        expect (product.as64).to.equal (a * b)
    })
})

describe ('Emulated Float 64', () => {

    it ('can be created from float 64', () => {

        // The 53-bit significand precision gives from 15 to 17 significant decimal digits precision (2−53 ≈ 1.11 × 10−16)

        const f64 = Math.PI
        const eml = double (f64)

        expect (eml.type).to.equal ('double')
        expect (eml.as64).to.be.closeTo (f64, 1e-14) // TODO: try to increase the accuracy
    })

    it ('supports addition', () => {

        const a = Math.PI
        const b = Math.sqrt (2)

        const sum = double (a).add (double (b))

        expect (sum.type).to.equal ('double')
        expect (sum.as64).to.be.closeTo (a + b, 1e-14)
    })

    it ('supports subtraction', () => {

        const a = Math.PI
        const b = Math.sqrt (3)

        const diff = double (a).sub (double (b))

        expect (diff.type).to.equal ('double')
        expect (diff.as64).to.be.closeTo (a - b, 1e-14)
    })

    it ('supports multiplication', () => {

        const a = Math.PI
        const b = Math.sqrt (5)

        const product = double (a).mul (double (b))

        expect (product.type).to.equal ('double')
        expect (product.as64).to.be.closeTo (a * b, 1e-14)
    })

    it ('supports division', () => {

        const a = Math.PI
        const b = Math.sqrt (7)

        const ratio = double (a).div (double (b))

        expect (ratio.type).to.equal ('double')
        expect (ratio.as64).to.be.closeTo (a / b, 1e-14)
    })

    it ('supports comparison', () => {

        const a = double (Math.PI)
        const b = double (Math.sqrt (2))
        const c = double (Math.sqrt (2) + 1)

        expect (a.gt (b)).to.be.true
        expect (a.gte (c)).to.be.true
        expect (a.lte (b)).to.be.false
        expect (a.lt (b)).to.be.false
        expect (b.ne (c)).to.be.true
        expect (b.add (double (1)).eq (c)).to.be.true
    })
})
