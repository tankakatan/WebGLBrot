"use strict";

// https://www.thasler.com/blog/blog/glsl-part2-emu
// https://www.thasler.com/blog/search?q=glsl+shader
// https://gist.github.com/LMLB/4242936fe79fb9de803c20d1196db8f3

function v2f32 (x, y) {

    if (Array.isArray (x) && y === undefined) {
        x = x[0]
        y = x[1]
    }

    return Object.defineProperties (new Float32Array ([x, y]), {

          x: { get: function () { return this[0].type === 'f32' ? this[0] : f32 (this[0]) } },
          y: { get: function () { return this[1].type === 'f32' ? this[1] : f32 (this[1]) } },
       list: { get: function () { return [this[0], this[1]] } },
       type: { get: function () { return 'v2f32' } },

        add: { value: function (that) {

            const hi_sum = this.x.add (that.x)
            const carry  = hi_sum.sub (this.x)
            const lo_sum = that.x.sub (carry)
                                 .add (this.x.sub (hi_sum.sub (carry)))
                                 .add (this.y)
                                 .add (that.y) // t2 = ((dsb(1) - e) + (dsa(1) - (t1 - e))) + dsa(2) + dsb(2)

            return normalize (hi_sum, lo_sum) } },

        sub: { value: function (that) {

            const hi_diff = this.x.sub (that.x)
            const carry   = hi_diff.sub (this.x)
            const lo_diff = f32 (0).sub (that.x)
                                   .sub (carry)
                                   .add (this.x.sub (hi_diff.sub (carry)))
                                   .add (this.y)
                                   .sub (that.y) // t2 = ((-dsb(1) - e) + (dsa(1) - (t1 - e))) + dsa(2) - dsb(2)

            return normalize (hi_diff, lo_diff) } },

        mul: { value: function (that) {

            // From https://www.davidhbailey.com/dhbpapers/mpfun2015.pdf
            // https://mrob.com/pub/math/f161.html#fn_knuth1997

            // T.J. Dekker method implementation

            const head_product = this.x.mul64 (that.x)
            const product_tail = this.x.mul (that.y)
                                       .add (this.y.mul (that.x))
                                       .add (head_product.y)

            return normalize (head_product.x, product_tail) } },

        div: { value: function (that) {

            // https://hal.inria.fr/hal-01774587v2/document
            // https://gdz.sub.uni-goettingen.de/id/PPN362160546_0018?tify={%22pages%22:[232],%22view%22:%22export%22}

            // T.J. Dekker method implementation

            const head_ratio = this.x.div (that.x)
            const this_head_restored = head_ratio.mul64 (that.x)
            const ratio_tail = this.x.sub (this_head_restored.x)
                                     .sub (this_head_restored.y)
                                     .add (this.y)
                                     .sub (head_ratio.mul (that.y))
                                     .div (that.x)

            return normalize (head_ratio, ratio_tail) } },

       comp: { value: function (that) {

            if (this.x < that.x) return -1
            if (this.x > that.x) return  1

            if (this.y < that.y) return -1
            if (this.y > that.y) return  1

            return 0 } },

        gte: { value: function (that) { return this.comp (that) !== -1 } },
        lte: { value: function (that) { return this.comp (that) !==  1 } },
         ne: { value: function (that) { return this.comp (that) !==  0 } },
         eq: { value: function (that) { return this.comp (that) ===  0 } },
         gt: { value: function (that) { return this.comp (that) ===  1 } },
         lt: { value: function (that) { return this.comp (that) === -1 } },
    })
}

Object.defineProperties (v2f32, {

    from64: { value: function (f64) {

        const bias = Math.pow (2, 26) + 1
        const f64_biased = f64 * bias

        const f64_head = f32 (f64_biased - (f64_biased - f64))
        const f64_tail = f32 (f64 - f64_head)

        // console.log (' ')
        // console.log ('\n',
        //     '                                    64 value :', f64.toString (2), '\n',
        //     '                                        bias :', bias.toString (2), '\n',
        //     '                                   64 biased :', f64_biased.toString (2), '\n',
        //     '                                        head :', f64_head.toString (2), '\n',
        //     '                                        tail :', f64_tail.toString (2), '\n',
        //     '                                 head + tail :', (f64_head + f64_tail).toString (2), '\n',
        //     '                                    64 value :', f64.toString (2), '\n',
        //     '...', '\n',
        //     '                                     32 head :', f32 (f64_head).toString (2), '\n',
        //     '                                     32 tail :', f32 (f64_tail).toString (2), '\n',
        //     '                           32 head + 32 tail :', (f32 (f64_head) + f32 (f64_tail)).toString (2), '\n',

        // )

        return v2f32 (f64_head, f64_tail) } },
})

function normalize (head, tail) {
    const result_head = head.add (tail)
    const result_tail = tail.sub (result_head.sub (head))
    return v2f32 (result_head, result_tail)
}

function f32 (x) {
    return Object.defineProperties (new Number (new Float32Array ([x])[0]), {

        type: { get: function () { return 'f32' } },

         add: { value: function (that) { return f32 (this + (that.type === 'f32' ? that : f32 (that))) } },
         sub: { value: function (that) { return f32 (this - (that.type === 'f32' ? that : f32 (that))) } },
         mul: { value: function (that) { return f32 (this * (that.type === 'f32' ? that : f32 (that))) } },
         div: { value: function (that) { return f32 (this / (that.type === 'f32' ? that : f32 (that))) } },
       mul64: { value: function (that) {

                // double precision product of two single precision values

                const bias = f32 (Math.pow (2, 13) + 1) // 8193 = 2^(23 - 23/2) + 1, where 23 is the size of float32 mantissa

                const this_biased = this.mul (bias)
                const this_head   = this_biased.sub (this_biased.sub (this))
                const this_tail   = this.sub (this_head)

                const that_biased = that.mul (bias)
                const that_head   = that_biased.sub (that_biased.sub (that))
                const that_tail   = that.sub (that_head)

                const head_product = this_head.mul (that_head)
                const tail_product = this_head.mul (that_tail).add (this_tail.mul (that_head))

                const product_head = head_product.add (tail_product)
                const product_tail = head_product.sub (product_head)
                                                 .add (tail_product)
                                                 .add (this_tail.mul (that_tail))

                return v2f32 (product_head, product_tail)
        } },
    })
}

if (module !== undefined) {
    module.exports = { f32, v2f32 } // for tests
}
