'use strict'

Vector = {
    /**
     *  @description модуль вектора 
     */
    absV: function(U) {
        return Math.sqrt(U[0]*U[0] + U[1]*U[1] + U[2]*U[2])
    },
    /**
    * @description сумма векторов
    */
    vectSumm: function(U, V) {
        return [
            U[0] + V[0],
            U[1] + V[1],
            U[2] + V[2]
        ]
    },
    /**
    * @description вычитание векторов
    */
    vectSubt: function(U, V) {
        return [
            U[0] - V[0],
            U[1] - V[1],
            U[2] - V[2]
        ]
    },
    /**
    * @description умножить вектор на скаляр
    */
    vectByScal: function(U, k) {
        return [
            U[0] * k,
            U[1] * k,
            U[2] * k
        ]
    },
    /**
    * @description скалярное произведение
    */
    dotProduct: function (U, V) {
        return U[0]*V[0] + U[1]*V[1] + U[2]*V[2]
    },
    /**
    * @description векторное произведение
    */
    crossProduct: function(U, V) {
        return [
            U[1] * V[2] - U[2] * V[1],
            U[2] * V[0] - U[0] * V[2],
            U[0] * V[1] - U[1] * V[0]
        ]
    },
    /**
     * @description Построить плоскость по трем точкам
     */
    points2plane: function(U, V, W) {
        const UV = U - V
        const WV = W - V
        const norm = Vector.crossProduct(UV, WV)
        const dNorm = 1 / Vector.absV(norm)
        
        return {
            point: V,
            norm: [
                norm[0] * dNorm,
                norm[1] * dNorm,
                norm[2] * dNorm
            ]
        }
    },
    /**
    * @description плоскость местного горизонта
    */
    tangentPlane: function(U) {
        const absU = absV(U)

        return {
            point: [U[0], U[1], U[2]],
            norm: [
                U[0]/absU,
                U[1]/absU,
                U[2]/absU
            ]
        }
    },
    /**
    * @description модуль угла между двумя векторами
    */
    angleBetween: function(U, V) {
        return Math.acos( Vector.dotProduct(U, V) / (Vector.absV(U) * Vector.absV(V)))
    },
    /**
    * @description спроецировать точку на плоскость
    */
    point2plane: function(U, plane) {
        const t = Vector.dotProduct(
            plane.norm,
            Vector.vectSubt(plane.point, U)
        ) / Vector.dotProduct(plane.norm, plane.norm)

        return Vector.vectSumm(U, Vector.vectByScal(plane.norm, t))
    },
    /**
    * @description декартовы координаты -> сферические
    */
    decart2sphere :function(U) {
        const rad = Vector.absVect(U)
        const rad_planar = Math.sqrt(U[0] * U[0] + U[2] * U[2])
        const W = Math.asin(U[1] / rad)
        const W0 = Math.asin(U[0] / rad_planar)
        const L = (U[0] > 0) ?
            (U[2] > 0 ? W0 : Math.PI - W0) :
            (U[2] < 0 ? 1.5 * Math.PI + W0 : 2 * Math.PI + W0) 
            
        return {W, L}
    },
    /**
    * @description  сферические координаты -> декартовы
    */
    sphere2decart: function(W, L, H) {
        const cw = Math.cos(w)
        
        return [		
            H * cw * Math.sin(L),
            H * Math.sin(W),
            H * cw * Math.cos(L)
        ]
    },
    /**
    * @description  сферические координаты -> декартовы
    */
    azimuth: function(V, crd) {

    }
}

module.exports = Vector