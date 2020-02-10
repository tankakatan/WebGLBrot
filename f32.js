"use strict";

// https://www.thasler.com/blog/blog/glsl-part2-emu
// https://www.thasler.com/blog/search?q=glsl+shader
// https://gist.github.com/LMLB/4242936fe79fb9de803c20d1196db8f3

function v2double (x, y) {

    if (Array.isArray (x) && y === undefined) {
        x = x[0]
        y = x[1]
    }

    if (x.type !== 'double') x = double (x)
    if (y.type !== 'double') y = double (y)

    return Object.defineProperties ({ x, y }, {

        add: { value: function (v) { return v2double (this.x.add (v.x), this.y.add (v.y)) } },
        sub: { value: function (v) { return this.add (v.scale (-1)) } },
      scale: { value: function (f) { if (f.type !== 'double') f = double (f); return v2double (this.x.mul (f, this.y.mul (f))) } },
    rescale: { value: function (src_min, src_max, dst_min, dst_max) {
                return v2double (this.x.rescale (src_min.x, src_max.x, dst_min.x, dst_max.x),
                                 this.y.rescale (src_min.y, src_max.y, dst_min.y, dst_max.y)) } },

       list: { get: function () { return [this.x, this.y] } },
       type: { get: () => 'v2double' },
    })
}

function double (x, y) {

    if (y === undefined) {
        return Array.isArray (x) ? double ([ x[0], x[1] ]) : double.from64 (x)
    }

    return Object.defineProperties (new Float32Array ([ x, y ]), {

          x: { get: function () { return this[0].type === 'f32' ? this[0] : f32 (this[0]) } },
          y: { get: function () { return this[1].type === 'f32' ? this[1] : f32 (this[1]) } },
         hi: { get: function () { return this.x } }, // alias to x
         lo: { get: function () { return this.y } }, // alias to y

       type: { get: function () { return 'double' } },
       as64: { get: function () { return this.x + this.y } },

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

    rescale: { value: function (src_min, src_max, dst_min, dst_max) {
            return dst_min.add (dst_max.sub (dst_min).mul (this.sub (src_min).div (src_max.sub (src_min)))) } },

    })
}

Object.defineProperties (double, {

    from64: { value: function (f64) {

        const bias = Math.pow (2, 26) + 1
        const f64_biased = f64 * bias

        const f64_head = f32 (f64_biased - (f64_biased - f64))
        const f64_tail = f32 (f64 - f64_head)

        return double (f64_head, f64_tail) } },
})

function normalize (head, tail) {
    const result_head = head.add (tail)
    const result_tail = tail.sub (result_head.sub (head))
    return double (result_head, result_tail)
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

                return double (product_head, product_tail)
        } },
    })
}

if (module !== undefined) {
    module.exports = { f32, double, v2double } // for tests
}
